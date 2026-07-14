/**
 * scripts/generate-article.mjs
 *
 * 端到端新文章生产 pipeline:
 *   1. 调 LLM(OpenAI 协议 — DeepSeek/OpenAI/通义 都可)生成 2000 字解读
 *   2. 写 content/articles/{slug}.md(含完整 frontmatter — slug/episode/dynasty/...)
 *   3. 跑 publish-cover.mjs build → 拿 cover prompt 给 agent 跑 image_synthesize
 *   4. 跑 publish-audio.mjs build → 拿 tts text 给 agent 跑 synthesize_speech
 *   5. (外部) image_synthesize + synthesize_speech + publish-cover + publish-audio + upload-tcb + commit
 *
 * **agent 怎么配合跑完**:
 *   - 这个脚本 step 1-2 自己跑(LLM + 写文件)
 *   - step 3-4 输出 cover prompt + tts text(脚本运行 agent 跑 matrix)
 *   - step 5 由 agent 在 conversation 里跑 native tools + commit
 *
 * 用法:
 *   # 1. 准备 source.md(格式参考 content-pipeline/sources/01_zhishi_wang.md)
 *   # 2. 跑
 *   node scripts/generate-article.mjs \
 *     --slug 101-ming-rongmu \
 *     --episode 101 \
 *     --dynasty 明清 \
 *     --volume 卷二百五十三 \
 *     --title "明末容闳:中国第一个留学生" \
 *     --source content-pipeline/sources/101_rongmu.md
 *
 *   # 或简版(用 LLM 自己生成 topic):
 *   node scripts/generate-article.mjs \
 *     --slug 101-ming-rongmu --episode 101 --dynasty 明清 --volume 卷XXX \
 *     --topic "1847年容闳赴美留学,中国第一批留学生"
 *
 * 输出:
 *   ✓ content/articles/101-ming-rongmu.md
 *   → 下一步:跑 cover prompt (image_synthesize) + audio text (synthesize_speech) + publish + upload
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import OpenAI from 'openai';

// 动态 import publish-cover/publish-audio 子命令的 build helper
// (因为它们已经是 ESM script,我们可以直接 import 函数或 fork)
// 这里用 fork 方式更稳 ——
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

// ---------------------------------------------------------------------------
// Prompt(基于 content-pipeline/generate.py,扩展支持 frontmatter 注入)
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `你是一位资深的资治通鉴解读人,擅长把古文讲成现代人爱看的故事。

你的读者是 30-45 岁的商业人士/历史爱好者,希望从历史中读出"人性"和"管理智慧"。

写作要求:
- 语气:理性但不冷,有立场但不偏激
- 不用"我们可以看到""这告诉我们"这种说教句式
- 不堆砌四字成语
- 现代映射不要生硬(不要"这就像公司里的 XX 部门")
- 重要人物出场时,第一次提及时简短交代身份
- 直接输出正文,不要加任何"以下是解读稿"之类的开场白
- 用 Markdown 格式,标题用 ## 或 ###,古文原文用引用块(>)
- 写到 2000-3500 字(中文)
- **结尾用一个"互文"段落** ——
  - 提到 2-3 篇已存在的同朝代/同主题文章
  - 格式:跟 XX-某主题 互文
  - 这帮助网站内链 SEO + 读者扩展阅读

内容结构(强制):
1. **开篇钩子**(150 字):用一句反常识的话/一个悬念/一个现代类比,把读者拉进来
2. **背景速览**(200 字):这段历史发生在什么年代、什么背景,用白话说清
3. **故事深读**(1000+ 字):核心,像写小说一样还原场景
   - 人物内心活动(基于史料合理推断)
   - 关键决策点的拆解
   - 至少 1 处反转/悬念/精彩细节
   - 关键古文原文嵌入文中,白话翻译紧跟其后
4. **现代映射**(300 字):从这段历史能读出什么对今天有用的东西
5. **一句话收尾**(50 字):金句感,适合发朋友圈
6. **互文段落**(100 字):提到 2-3 篇相关已存在文章`;

const USER_PROMPT_TEMPLATE = `请基于下面这段【原文】和【历史背景】,写一篇 2000-3500 字的现代解读稿。

# 解读稿结构(强制)

1. **开篇钩子**(150 字)
2. **背景速览**(200 字)
3. **故事深读**(1000+ 字)
4. **现代映射**(300 字)
5. **一句话收尾**(50 字)
6. **互文段落**(100 字)

---

【原文】:
{classical_text}

---

【历史背景】:
{background}

---

【关键人物】(如有):
{key_figures}

---

直接输出 Markdown 正文,从 "## 一、" 开始(不要任何开场白或 "以下是解读稿")。
**重要**:不要返回任何 YAML frontmatter(那是脚本后处理加的)。
**重要**:文末必须有"互文段落",提到 2-3 篇已存在的同主题/同朝代文章编号(如"跟 22-胡编倭/36-太平天国 互文")。`;

// ---------------------------------------------------------------------------
// 解析 source.md
// ---------------------------------------------------------------------------

function parseSourceFile(sourcePath) {
  const content = fs.readFileSync(sourcePath, 'utf-8');

  // 提取原文
  let classical = '';
  if (content.includes('## 原文') && content.includes('## 历史背景')) {
    classical = content.split('## 原文')[1].split('## 历史背景')[0].trim();
  } else {
    classical = content; // fallback
  }
  classical = classical.replace(/^>\s*/gm, '').trim();

  // 提取历史背景
  let background = '';
  if (content.includes('## 历史背景')) {
    let bgSection = content.split('## 历史背景')[1];
    if (bgSection.includes('## 关键人物')) {
      bgSection = bgSection.split('## 关键人物')[0];
    }
    background = bgSection.replace(/^>\s*/gm, '').trim();
  }

  // 提取关键人物
  let keyFigures = '';
  if (content.includes('## 关键人物')) {
    const kfSection = content.split('## 关键人物')[1] || '';
    keyFigures = kfSection.trim();
  }

  return { classical, background, keyFigures };
}

// ---------------------------------------------------------------------------
// LLM 调(用 OPENAI 协议,DeepSeek/通义/智谱 都兼容)
// ---------------------------------------------------------------------------

async function callLlm(userPrompt) {
  const apiKey = process.env.LLM_API_KEY;
  const baseUrl = process.env.LLM_BASE_URL || 'https://api.deepseek.com';
  const model = process.env.LLM_MODEL || 'deepseek-chat';

  if (!apiKey) {
    throw new Error('LLM_API_KEY 没设(.env.local 或 .env)');
  }

  const client = new OpenAI({ apiKey, baseURL: baseUrl });

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 6000,
    temperature: 0.8,
  });

  return {
    content: completion.choices[0].message.content,
    usage: completion.usage,
    model,
  };
}

// ---------------------------------------------------------------------------
// 拿 cover prompt(从 publish-cover.mjs build 复用)
// ---------------------------------------------------------------------------

function runPublishCoverBuild(slug) {
  const r = spawnSync('node', [path.join(ROOT, 'scripts', 'publish-cover.mjs'), 'build', slug], {
    cwd: ROOT,
    encoding: 'utf-8',
  });
  if (r.status !== 0) {
    console.error(r.stdout);
    console.error(r.stderr);
    throw new Error('publish-cover build 失败');
  }
  // 提取 prompt(stdout 里 "========== [slug=XX] ==========" 后面到 "ABSOLUTELY NO TEXT" 那块)
  const out = r.stdout;
  const start = out.indexOf('========== [slug=');
  if (start === -1) throw new Error('publish-cover 输出格式变了,没法解析');
  return out.slice(start);
}

function runPublishAudioBuild(slug) {
  const r = spawnSync('node', [path.join(ROOT, 'scripts', 'publish-audio.mjs'), 'build', slug], {
    cwd: ROOT,
    encoding: 'utf-8',
  });
  if (r.status !== 0) {
    console.error(r.stdout);
    console.error(r.stderr);
    throw new Error('publish-audio build 失败');
  }
  return r.stdout;
}

// ---------------------------------------------------------------------------
// Frontmatter 生成
// ---------------------------------------------------------------------------

function buildFrontmatter({ slug, episode, dynasty, volume, title, source, llmUsage }) {
  const today = new Date().toISOString().split('T')[0];
  // 估算 readingTime:2000-3500 字 → 8-12 分钟
  const readingTime = 10;

  // 自动生成 tag(从 title 抽取 1-2 个关键词)
  const tags = extractTags(title, source);

  return `---
slug: ${slug}
classicalSlug: ${slug}
title: ${title}
subtitle: ${extractSubtitle(source, title)}
dynasty: ${dynasty}
volume: ${volume}
episode: ${episode}
excerpt: ${extractExcerpt(source)}
classicalQuote: ${extractClassicalQuote(source)}
readingTime: ${readingTime}
views: 0
publishedAt: ${today}
tags: [${tags.join(', ')}]
coverScene: "${extractCoverScene(source, title)}"
coverColor: "${extractCoverColor(dynasty)}"
coverMood: "${extractCoverMood(source, title)}"

---
`;
}

function extractTags(title, source) {
  // 简易:从 title 抽 2-3 个关键词
  const tags = [];
  if (title.includes('改革') || title.includes('变法')) tags.push('改革');
  if (title.includes('战争') || title.includes('之乱') || title.includes('之变')) tags.push('战争');
  if (title.includes('皇帝') || title.includes('帝') || title.includes('王')) tags.push('帝王');
  if (title.includes('朝代') || title.includes('唐') || title.includes('宋')) tags.push('朝代');
  if (source.includes('改革') || source.includes('变法')) tags.push('改革');
  if (source.includes('战争')) tags.push('战争');
  if (tags.length === 0) tags.push('历史', dynasty);
  return tags.slice(0, 4);
}

function extractSubtitle(source, title) {
  // 简版:用 title + 1 句背景
  const bg = source.split('## 历史背景')[1]?.split('##')[0]?.trim() || '';
  if (bg) {
    const firstSentence = bg.split(/[。\n]/).find((s) => s.length > 10 && s.length < 100);
    if (firstSentence) return firstSentence;
  }
  return title;
}

function extractExcerpt(source) {
  const bg = source.split('## 历史背景')[1]?.split('##')[0]?.trim() || '';
  if (bg) {
    return bg.split(/[。\n]/).slice(0, 2).join('。').slice(0, 200);
  }
  return '来自资治通鉴的深度解读';
}

function extractClassicalQuote(source) {
  // 找 > 引用的第一句
  const lines = source.split('\n');
  const quote = lines.find((l) => l.startsWith('>') && l.length > 10);
  if (quote) return quote.replace(/^>\s*/, '').slice(0, 100);
  return '古之所谓豪杰之士者,必有过人之处。';
}

function extractCoverScene(source, title) {
  // 简易:从 source/title 抽画面要素
  const dyn = source.includes('改革') ? 'court debate' : 'imperial scene';
  return `bird-eye view of ${title}, ${dyn}, traditional Chinese setting, ancient capital, dawn light, ${extractMoodAdjective(title)} mood`;
}

function extractMoodAdjective(title) {
  if (title.includes('改革') || title.includes('变法')) return 'reformist, ambitious';
  if (title.includes('之乱') || title.includes('战争')) return 'turbulent, fateful';
  if (title.includes('兴') || title.includes('盛世')) return 'grand, prosperous';
  if (title.includes('败') || title.includes('亡')) return 'doomed, twilight';
  return 'thoughtful, historical';
}

function extractCoverColor(dynasty) {
  const colors = {
    '秦汉': 'iron grey, ash, charcoal black, cinnabar red, dawn gold',
    '三国': 'iron grey, ash, charcoal black, fire crimson, ink',
    '南北朝': 'iron grey, ash, charcoal black, gold, river blue',
    '隋唐': 'cinnabar red, gold, jade green, cloud white, sunset amber',
    '宋': 'cinnabar red, ink black, ash grey, paper white, jade',
    '元': 'iron grey, ash, charcoal black, sand gold, steppe blue',
    '明清': 'cinnabar red, ink black, ash grey, jade green, autumn amber',
    '现代': 'industrial teal, cinnabar red, ash, hopeful gold, future white',
  };
  return colors[dynasty] || 'cinnabar red, ink black, ash, gold, dawn white';
}

function extractCoverMood(source, title) {
  if (title.includes('败') || title.includes('亡') || title.includes('之乱')) return 'doomed, karmic, end of an era';
  if (title.includes('改革') || title.includes('变法')) return 'ambitious, reformist, dawn of change';
  if (title.includes('盛世') || title.includes('兴')) return 'grand, prosperous, golden age';
  return 'thoughtful, karmic, historical weight';
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs();

  console.log('🚀 新文章 pipeline 启动');
  console.log('  slug:', args.slug);
  console.log('  episode:', args.episode);
  console.log('  dynasty:', args.dynasty);
  console.log('  volume:', args.volume);
  console.log('  title:', args.title);
  console.log('  source:', args.source || '(用 --topic 模式)');
  console.log('');

  // === Step 1:读 source.md ===
  let source = '';
  if (args.source) {
    if (!fs.existsSync(args.source)) {
      console.error(`❌ source 不存在:${args.source}`);
      process.exit(1);
    }
    source = fs.readFileSync(args.source, 'utf-8');
  } else {
    // 用 --topic 模式:让 LLM 自己生成 source 内容
    source = `## 历史背景\n${args.topic || args.title}\n\n## 关键人物\n(由 LLM 自由发挥)`;
  }

  const { classical, background, keyFigures } = parseSourceFile(source);

  if (!classical && !background) {
    console.error('❌ source 格式不对,需要 ## 原文 和 ## 历史背景 段落');
    process.exit(1);
  }

  // === Step 2:LLM 生成 ===
  console.log('⏳ Step 1/3: 调 LLM 生成解读稿...');
  const userPrompt = USER_PROMPT_TEMPLATE
    .replace('{classical_text}', classical || '(无原文,基于背景写)')
    .replace('{background}', background || '(无)')
    .replace('{key_figures}', keyFigures || '(无)');

  const { content: llmContent, usage, model } = await callLlm(userPrompt);
  console.log(`   模型:${model}`);
  console.log(`   tokens: ${usage.prompt_tokens} in / ${usage.completion_tokens} out / ${usage.total_tokens} total`);

  // === Step 3:写 article + frontmatter ===
  const frontmatter = buildFrontmatter({
    slug: args.slug,
    episode: args.episode,
    dynasty: args.dynasty,
    volume: args.volume,
    title: args.title,
    source,
    llmUsage: usage,
  });
  const articlePath = path.join(ROOT, 'content', 'articles', `${args.slug}.md`);
  fs.writeFileSync(articlePath, frontmatter + llmContent, 'utf-8');
  console.log(`\n✅ Step 2/3: article 写完 → ${articlePath}`);
  console.log(`   字数:${llmContent.length}`);

  // === Step 4:拿 cover prompt + tts text ===
  console.log(`\n⏳ Step 3/3: 拿 cover prompt + tts text...`);
  const coverPrompt = runPublishCoverBuild(args.slug);
  const audioText = runPublishAudioBuild(args.slug);

  // === Step 5:输出下一步指令 ===
  console.log('\n' + '='.repeat(60));
  console.log('✅ 文章生成完成!');
  console.log('='.repeat(60));
  console.log(`\n📁 article: ${articlePath}`);
  console.log(`📊 cost: ~¥${((usage.total_tokens * 0.001) / 1000).toFixed(4)} (DeepSeek-V3 估算)`);

  // 把 cover prompt + audio text 写到 tmp/,agent 跑 matrix 工具时读
  const tmpDir = path.join(ROOT, 'tmp');
  fs.mkdirSync(tmpDir, { recursive: true });
  fs.writeFileSync(path.join(tmpDir, `${args.slug}-cover-prompt.txt`), coverPrompt, 'utf-8');
  fs.writeFileSync(path.join(tmpDir, `${args.slug}-audio-text.txt`), extractAudioTextOnly(audioText), 'utf-8');
  console.log(`\n📋 下一步 — agent 在 conversation 里跑:`);
  console.log(`   1. image_synthesize(`);
  console.log(`        prompt = (读 tmp/${args.slug}-cover-prompt.txt)`);
  console.log(`        output_file_path = 'tmp/cover-${args.slug}-raw.jpg'`);
  console.log(`      )`);
  console.log(`   2. cp tmp/cover-${args.slug}-raw.jpg -> .worktrees/polish/tmp/`);
  console.log(`   3. node scripts/publish-cover.mjs publish ${args.slug}`);
  console.log(`   4. synthesize_speech(`);
  console.log(`        text = (读 tmp/${args.slug}-audio-text.txt)`);
  console.log(`        output_file_path = 'tmp/audio-${args.slug}-raw.mp3'`);
  console.log(`      )`);
  console.log(`   5. cp tmp/audio-${args.slug}-raw.mp3 -> .worktrees/polish/tmp/`);
  console.log(`   6. node scripts/publish-audio.mjs publish ${args.slug}`);
  console.log(`   7. node scripts/upload-audio-tcb.mjs --skip-existing  # (看是否需要加 --skip-existing flag)`);
  console.log(`   8. node scripts/upload-cover-tcb.cjs  # (覆盖, 已有 cover 跳过)`);
  console.log(`   9. git add + commit + push`);
}

function extractAudioTextOnly(audioBuildOutput) {
  // 提取 "--- text (前 200 字预览) ---" 之后的 text 段落
  const lines = audioBuildOutput.split('\n');
  const startIdx = lines.findIndex((l) => l.startsWith('--- text'));
  const endIdx = lines.findIndex((l, i) => i > startIdx && l.startsWith('=='));
  if (startIdx === -1) return audioBuildOutput;
  return lines.slice(startIdx + 1, endIdx > 0 ? endIdx : lines.length).join('\n').trim();
}

function parseArgs() {
  const args = {};
  for (let i = 2; i < process.argv.length; i++) {
    const a = process.argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2).replace(/-/g, '_');
      args[key] = process.argv[i + 1];
      i++;
    }
  }
  const required = ['slug', 'episode', 'dynasty', 'volume', 'title'];
  for (const r of required) {
    if (!args[r]) {
      console.error(`❌ 缺少 --${r}`);
      console.error(`用法: node scripts/generate-article.mjs --slug X --episode N --dynasty X --volume X --title "..." [--source path.md | --topic "..."]`);
      process.exit(1);
    }
  }
  if (!args.source && !args.topic) {
    console.error('❌ 必须 --source 或 --topic 之一');
    process.exit(1);
  }
  return args;
}

main().catch((err) => {
  console.error('💥 Fatal:', err.message);
  console.error(err.stack);
  process.exit(1);
});
