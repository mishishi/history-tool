/**
 * scripts/batch-generate.mjs
 *
 * 批量生成文章 (article + cover + TTS + timestamps)
 *
 * 读 content-pipeline/articles-batch.json 配置,逐篇跑:
 *   1. 写 article.md (frontmatter + body)
 *   2. publish-cover build → 拿 cover prompt
 *   3. publish-audio build → 拿 TTS text
 *   4. agent 跑 matrix image_synthesize + cp + publish-cover publish
 *   5. agent 跑 matrix synthesize_speech + cp + publish-audio publish
 *   6. (外部) upload TCB + commit + push
 *
 * 每篇独立 commit。失败 1 篇不影响其他。
 *
 * 用法:
 *   node scripts/batch-generate.mjs
 *   # 默认读 content-pipeline/articles-batch.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { buildFrontmatter } from '/Users/zhurenbao/.mavis/skills/content-pipeline/lib/frontmatter.mjs';
import { buildTtsText, parseArticle } from '/Users/zhurenbao/.mavis/skills/content-pipeline/lib/tts-text.mjs';

const ROOT = path.resolve('.');
const configPath = path.join(ROOT, 'content-pipeline', 'articles-batch.json');
if (!fs.existsSync(configPath)) {
  console.error(`❌ config 不存在: ${configPath}`);
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
// 兼容两种格式: array 或 { articles: [...] }
const articles = Array.isArray(config) ? config : (config.articles || []);

console.log(`🚀 batch-generate: 准备跑 ${articles.length} 篇\n`);

let success = 0, failed = 0, skipped = 0;
for (const a of articles) {
  const { slug, episode, dynasty, volume, title, sourceFile, bodyFile, skip, skipReason } = a;
  const articlePath = path.join(ROOT, 'content', 'articles', `${slug}.md`);
  const sourcePath = path.join(ROOT, sourceFile);
  const bodyPath = path.join(ROOT, bodyFile);

  if (skip) {
    console.log(`⏭️  [${slug}] 跳过:${skipReason || 'no reason'}`);
    skipped++;
    continue;
  }

  if (fs.existsSync(articlePath)) {
    console.log(`⏭️  [${slug}] article 已存在,跳过`);
    skipped++;
    continue;
  }

  try {
    console.log(`\n━━━ [${slug}] ${title} ━━━`);

    if (!fs.existsSync(sourcePath)) throw new Error(`source 文件不存在: ${sourcePath}`);
    if (!fs.existsSync(bodyPath)) throw new Error(`body 文件不存在: ${bodyPath}`);
    const source = fs.readFileSync(sourcePath, 'utf-8');
    const body = fs.readFileSync(bodyPath, 'utf-8');

    // === 1. 写 article ===
    const frontmatter = buildFrontmatter({ slug, episode, dynasty, volume, title, source });
    fs.writeFileSync(articlePath, frontmatter + body, 'utf-8');
    console.log(`  ✅ article: ${body.length} 字`);

    // === 2. cover prompt ===
    const coverOut = execSync(
      `node /Users/zhurenbao/.mavis/skills/content-pipeline/scripts/publish-cover.mjs --root ${ROOT} build ${slug}`,
      { encoding: 'utf-8' }
    );
    fs.writeFileSync(path.join(ROOT, 'tmp', `${slug}-cover-prompt.txt`), coverOut, 'utf-8');
    console.log(`  ✅ cover prompt`);

    // === 3. TTS text ===
    execSync(
      `node /Users/zhurenbao/.mavis/skills/content-pipeline/scripts/publish-audio.mjs --root ${ROOT} build ${slug}`,
      { encoding: 'utf-8' }
    );
    const article = parseArticle(fs.readFileSync(articlePath, 'utf-8'));
    const audioText = buildTtsText(article);
    fs.writeFileSync(path.join(ROOT, 'tmp', `${slug}-audio-text.txt`), audioText, 'utf-8');
    console.log(`  ✅ TTS text: ${audioText.length} 字`);

    // === 4-5. 等 agent 跑 matrix ===
    console.log(`  ⏳ 下一步:agent 跑 image_synthesize + cp + publish-cover`);

    success++;
  } catch (err) {
    console.error(`  ❌ [${slug}] 失败: ${err.message}`);
    failed++;
  }
}

console.log(`\n${'='.repeat(40)}`);
console.log(`✅ ${success} 写完,⏭️ ${skipped} 跳过,❌ ${failed} 失败`);
console.log(`下一步:agent 跑 cover + audio matrix 工具,然后 publish + commit`);
