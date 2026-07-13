#!/usr/bin/env node
/**
 * scripts/publish-audio.mjs
 *
 * 把新文章 TTS 音频发布到 public/audios/ + 生成时间戳 JSON
 *
 * 配合 mavis agent 用的工作流:
 *   1. `node scripts/publish-audio.mjs build 51-nanbei-juntianzhi`
 *      → 打印 TTS 请求参数(text + voice + speed + emotion)
 *   2. mavis 调 synthesize_speech(text=..., voice_id=..., output_file_path=tmp/audio-51-...-raw.mp3)
 *      如果 content policy 失败,先 sanitizeForTts 再试
 *   3. `node scripts/publish-audio.mjs publish 51-nanbei-juntianzhi`
 *      → 自动 ffprobe 验时长 + 移动到 public/audios/ + 生成 lib/audio-timestamps/{slug}.json
 *   4. `node scripts/publish-audio.mjs timestamps 51-nanbei-juntianzhi`
 *      → 只生成时间戳(MP3 已就位)
 *
 * 子命令:
 *   build       <slug> [...]   打印 TTS 请求参数
 *   publish     <slug> [...]   tmp/audio-{slug}-raw.mp3 → public/audios/ + 时间戳
 *   timestamps  <slug> [...]   只重新生成时间戳(MP3 已在 public/audios/)
 *   sanitize    <slug> [...]   打印中性化后的 text(给触发 content policy 的文章用)
 *   all         <slug> [...]   build + publish 合并(假设已合成)
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { TTS_CONFIG, buildTtsText, sanitizeForTts, extractSections, parseArticle } from '../lib/tts-text.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const AUDIO_DIR = path.join(ROOT, 'public', 'audios');
const TMP_DIR = path.join(ROOT, 'tmp');
const TS_DIR = path.join(ROOT, 'lib', 'audio-timestamps');
const ARTICLES_DIR = path.join(ROOT, 'content', 'articles');

// --- 子命令派发 ---
const [, , cmd, ...args] = process.argv;

if (!cmd || !['build', 'publish', 'timestamps', 'sanitize', 'all'].includes(cmd)) {
  console.error(`用法:
  node scripts/publish-audio.mjs build       <slug> [...]   打印 TTS 请求
  node scripts/publish-audio.mjs publish     <slug> [...]   raw mp3 → audios/ + 时间戳
  node scripts/publish-audio.mjs timestamps  <slug> [...]   只生成时间戳
  node scripts/publish-audio.mjs sanitize    <slug> [...]   打印中性化 text
  node scripts/publish-audio.mjs all         <slug> [...]   build + publish
`);
  process.exit(1);
}

if (args.length === 0) {
  console.error('错误:至少给 1 个 slug');
  process.exit(1);
}

main();

function main() {
  switch (cmd) {
    case 'build':       return buildRequests(args);
    case 'publish':     return publishAudios(args);
    case 'timestamps':  return regenerateTimestamps(args);
    case 'sanitize':    return printSanitized(args);
    case 'all': {
      buildRequests(args);
      return publishAudios(args);
    }
  }
}

// --- build: 打印 TTS 请求参数 ---
function buildRequests(slugs) {
  for (const slug of slugs) {
    const article = loadArticle(slug);
    const text = buildTtsText(article);
    const sanitized = sanitizeForTts(text);
    const sanitizedDiff = sanitized !== text;
    console.log(`\n========== [slug=${slug}] (${text.length} 字) ==========`);
    console.log(`voice_id: ${TTS_CONFIG.voice}`);
    console.log(`speed:    ${TTS_CONFIG.speed}`);
    console.log(`emotion:  ${TTS_CONFIG.emotion}`);
    console.log(`--- text (前 200 字预览) ---`);
    console.log(text.slice(0, 200) + (text.length > 200 ? '...' : ''));
    if (sanitizedDiff) {
      console.log(`--- ⚠️  sanitize 后会变 (${sanitized.length} 字) — 用 sanitize 子命令看完整版 ---`);
    }
    console.log('====================================\n');
  }
  console.error(`[publish-audio:build] ${slugs.length} request(s) 打印完成`);
  console.error(`复制 text 给 mavis 调 synthesize_speech,output_file_path 用:`);
  for (const slug of slugs) {
    console.error(`  tmp/audio-${slug}-raw.mp3`);
  }
}

// --- sanitize: 打印中性化后的 text ---
function printSanitized(slugs) {
  for (const slug of slugs) {
    const article = loadArticle(slug);
    const original = buildTtsText(article);
    const sanitized = sanitizeForTts(original);
    if (original === sanitized) {
      console.error(`[sanitize:${slug}] 无敏感词,跟原文相同`);
      continue;
    }
    console.log(`\n========== [slug=${slug}] sanitized ==========`);
    console.log(sanitized);
    console.log('====================================\n');
  }
}

// --- publish: raw mp3 → public/audios/ + 生成时间戳 ---
function publishAudios(slugs) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
  fs.mkdirSync(TMP_DIR, { recursive: true });

  for (const slug of slugs) {
    const rawPath = findRawAudio(slug);
    if (!rawPath) {
      console.error(`[publish:${slug}] ❌ 找不到 tmp/audio-${slug}-raw.mp3`);
      console.error(`  先用 mavis 调 synthesize_speech 跑出来:`);
      console.error(`  output_file_path: tmp/audio-${slug}-raw.mp3`);
      continue;
    }

    // ffprobe 验时长
    const duration = probeDuration(rawPath);
    if (!duration) {
      console.error(`[publish:${slug}] ❌ ffprobe 读不到时长(${rawPath})`);
      continue;
    }

    // 移动到 public/audios/
    const finalPath = path.join(AUDIO_DIR, `${slug}.mp3`);
    fs.renameSync(rawPath, finalPath);
    console.log(`[publish:${slug}] ✓ → ${path.relative(ROOT, finalPath)} (${duration}s)`);

    // 生成时间戳
    writeTimestamps(slug, duration);
    console.log(`[publish:${slug}] ✓ → lib/audio-timestamps/${slug}.json`);
  }
}

// --- timestamps: 只重新生成时间戳 ---
function regenerateTimestamps(slugs) {
  for (const slug of slugs) {
    const mp3 = path.join(AUDIO_DIR, `${slug}.mp3`);
    if (!fs.existsSync(mp3)) {
      console.error(`[ts:${slug}] ❌ ${path.relative(ROOT, mp3)} 不存在,先 publish`);
      continue;
    }
    const duration = probeDuration(mp3);
    if (!duration) {
      console.error(`[ts:${slug}] ❌ ffprobe 失败`);
      continue;
    }
    writeTimestamps(slug, duration);
    console.log(`[ts:${slug}] ✓ (${duration}s)`);
  }
}

// --- helpers ---
function loadArticle(slug) {
  const p = path.join(ARTICLES_DIR, `${slug}.md`);
  if (!fs.existsSync(p)) {
    console.error(`[publish-audio] ❌ 找不到 content/articles/${slug}.md`);
    process.exit(1);
  }
  const md = fs.readFileSync(p, 'utf8');
  const article = parseArticle(md);
  if (!article) {
    console.error(`[publish-audio] ❌ ${slug}.md 缺 frontmatter`);
    process.exit(1);
  }
  return article;
}

function findRawAudio(slug) {
  for (const ext of ['mp3', 'wav', 'm4a']) {
    const p = path.join(TMP_DIR, `audio-${slug}-raw.${ext}`);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function probeDuration(mp3Path) {
  try {
    const out = execSync(
      `ffprobe -v error -show_entries format=duration -of csv=p=0 "${mp3Path}"`,
      { encoding: 'utf8' },
    ).trim();
    return parseFloat(out);
  } catch {
    return 0;
  }
}

function writeTimestamps(slug, durationSec) {
  fs.mkdirSync(TS_DIR, { recursive: true });

  const article = loadArticle(slug);
  const sections = extractSections(article.body || '');

  // 段边界跟 buildTtsText 一致:excerpt + 各 section
  const allSegments = [];
  if (article.excerpt) allSegments.push({ id: 'excerpt', text: article.excerpt.replace(/\s+/g, ' ').trim() });
  for (const s of sections) allSegments.push({ id: s.id, text: s.text });

  // 按字数比例分配时间
  const totalChars = allSegments.reduce((sum, seg) => sum + seg.text.length, 0);
  let cumulative = 0;
  const out = allSegments.map((seg) => {
    const startSec = (cumulative / totalChars) * durationSec;
    cumulative += seg.text.length;
    const endSec = (cumulative / totalChars) * durationSec;
    return {
      id: seg.id,
      startSec: Math.round(startSec * 10) / 10,
      endSec: Math.round(endSec * 10) / 10,
      charCount: seg.text.length,
    };
  });

  const ts = { durationSec: Math.round(durationSec * 10) / 10, segments: out };
  fs.writeFileSync(
    path.join(TS_DIR, `${slug}.json`),
    JSON.stringify(ts, null, 2) + '\n',
  );
}
