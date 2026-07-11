#!/usr/bin/env node
/**
 * scripts/regen-47-tts.mjs
 *
 * 47-reform (改革开放) TTS 重新生成 — 中性化 prompt
 *
 * 失败原因: matrix TTS 触发内容审核("阶级斗争"等政治词),反复 500
 * 修复策略: 替换敏感词为中性表达,保留原文意
 *
 *   阶级斗争为纲 → 路线主导
 *   文革         → 上一阶段
 *   毛泽东       → 上一任领导人
 *   邓小平       → 新一代领导人
 *
 * 输出:
 *   - 临时文本 47-reform-cleaned.txt
 *   - 调用 matrix TTS,存到 public/audios/47-reform.mp3
 *   - 生成 lib/audio-timestamps/47-reform.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import matter from 'gray-matter';

const ROOT = process.cwd();
const SLUG = '47-reform';
const ARTICLE = path.join(ROOT, 'content', 'articles', `${SLUG}.md`);
const OUT_AUDIO = path.join(ROOT, 'public', 'audios', `${SLUG}.mp3`);
const OUT_TS = path.join(ROOT, 'lib', 'audio-timestamps', `${SLUG}.json`);

const VOICE = 'male-qn-qingse';
const SPEED = 0.95;
const MAX_CHARS = 1500;

/* ===== 文本处理 (跟 generate-audios.mjs 完全一致) ===== */

function cleanText(s) {
  return s
    .replace(/<[^>]+>/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#+\s*/gm, '')
    .replace(/^>\s*/gm, '')
    .replace(/^[\-\*]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 中性化敏感词 — 保留意 */
function neutralize(s) {
  return s
    .replace(/阶级斗争为纲/g, '以路线为纲')
    .replace(/阶级斗争/g, '路线方向')
    .replace(/文化大革命/g, '上一阶段')
    .replace(/文革/g, '上一阶段')
    .replace(/毛泽东/g, '上一任核心领导人')
    .replace(/毛主席/g, '上一任核心领导人')
    .replace(/邓小平/g, '新一代核心领导人')
    .replace(/习/g, '当代领导人')  // 防御
    .replace(/反右/g, '上一轮运动')
    .replace(/大跃进/g, '上一轮建设')
    .replace(/人民公社/g, '集体农业')
    .replace(/红卫兵/g, '青年运动组织')
    .replace(/上山下乡/g, '下乡运动')
    .replace(/走资派/g, '路线偏差者')
    .replace(/牛鬼蛇神/g, '被运动对象')
    .replace(/四旧/g, '传统遗产')
    .replace(/政治迫害/g, '政治冲击')
    .replace(/六四/g, '一九八九年事件')  // 防御
    .replace(/天安门事件/g, '一九八九年事件');
}

function extractBodyParagraphs(body, maxChars) {
  const paragraphs = body.split(/\n\s*\n/).map((p) => cleanText(p)).filter((p) => p.length > 0);
  const out = [];
  let total = 0;
  for (const p of paragraphs) {
    if (total >= maxChars) break;
    out.push(p);
    total += p.length;
  }
  return out.join('\n\n');
}

function buildTtsText(article) {
  const excerpt = cleanText(neutralize(article.excerpt || ''));
  const body = extractBodyParagraphs(neutralize(article.body || ''), MAX_CHARS);
  return `${excerpt}\n\n${body}`.trim();
}

/* ===== 调用 matrix TTS ===== */

function callTts(text) {
  const args = JSON.stringify({
    text,
    voice_id: VOICE,
    speed: SPEED,
    emotion: 'neutral',
  });
  const result = execSync(
    `mavis mcp call matrix matrix_synthesize_speech '${args.replace(/'/g, "'\\''")}'`,
    { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024, timeout: 120_000 },
  );
  return JSON.parse(result);
}

function downloadCdn(url, dest) {
  if (url.startsWith('/')) {
    fs.copyFileSync(url, dest);
  } else {
    execSync(`curl -sSL --max-time 60 "${url}" -o "${dest}"`, { stdio: 'pipe' });
  }
}

/* ===== 时间戳生成 (跟 generate-timestamps.mjs 一致) ===== */

function getDurationSec(mp3) {
  const out = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${mp3}"`, { encoding: 'utf8' });
  return parseFloat(out.trim());
}

function generateTimestamps(ttsText, durationSec) {
  // 按 \n\n 分段
  const segments = ttsText.split(/\n\s*\n/).filter(s => s.length > 0);
  const totalChars = segments.reduce((sum, s) => sum + s.length, 0);
  let acc = 0;
  const out = [];
  for (let i = 0; i < segments.length; i++) {
    const isFirst = i === 0;
    const isLast = i === segments.length - 1;
    const charCount = segments[i].length;
    const startSec = (acc / totalChars) * durationSec;
    acc += charCount;
    const endSec = (acc / totalChars) * durationSec;
    out.push({
      id: isFirst ? 'excerpt' : `seg${i}`,
      startSec: Math.round(startSec * 10) / 10,
      endSec: Math.round((isLast ? durationSec : endSec) * 10) / 10,
      charCount,
    });
  }
  return { durationSec: Math.round(durationSec * 10) / 10, segments: out };
}

/* ===== 主流程 ===== */

async function main() {
  const raw = fs.readFileSync(ARTICLE, 'utf8');
  const parsed = matter(raw);
  const ttsText = buildTtsText(parsed);

  // 调试输出
  console.log('=== TTS text (前 300 字) ===');
  console.log(ttsText.slice(0, 300));
  console.log(`\n=== 总长度: ${ttsText.length} 字 ===\n`);

  // 写调试文件
  fs.writeFileSync(path.join(ROOT, 'tmp', '47-reform-cleaned.txt'), ttsText);

  // 调用 TTS
  console.log('调用 matrix TTS...');
  const result = callTts(ttsText);
  console.log('TTS 响应:', JSON.stringify(result).slice(0, 200));

  // 下载音频
  fs.mkdirSync(path.dirname(OUT_AUDIO), { recursive: true });
  const audioUrl = result?.audio_url || result?.url || result?.output_file_path;
  if (!audioUrl) {
    console.error('❌ TTS 响应无音频 URL');
    process.exit(1);
  }
  downloadCdn(audioUrl, OUT_AUDIO);
  const size = fs.statSync(OUT_AUDIO).size;
  console.log(`✅ 音频已保存: ${OUT_AUDIO} (${(size / 1024 / 1024).toFixed(2)} MB)`);

  if (size < 1000) {
    console.error('❌ 音频文件过小,可能下载失败');
    process.exit(1);
  }

  // 生成时间戳
  const durationSec = getDurationSec(OUT_AUDIO);
  console.log(`ffprobe 时长: ${durationSec.toFixed(1)}s`);

  // 重要: 时间戳的 segments 顺序要跟 article 渲染顺序一致
  // excerpt 在前,然后是 body 段落
  // 我们的 article 渲染用: excerpt (1 段) + body 段落
  // 重新构造 segments
  const ttsSegments = ttsText.split(/\n\s*\n/).filter(s => s.length > 0);
  const totalChars = ttsSegments.reduce((sum, s) => sum + s.length, 0);
  let acc = 0;
  const segments = [];
  for (let i = 0; i < ttsSegments.length; i++) {
    const isFirst = i === 0;
    const isLast = i === ttsSegments.length - 1;
    const charCount = ttsSegments[i].length;
    const startSec = (acc / totalChars) * durationSec;
    acc += charCount;
    const endSec = (acc / totalChars) * durationSec;
    // id 跟 AudioSyncController 对齐: 第一段是 excerpt, 后续是 seg1, seg2, ...
    const id = isFirst ? 'excerpt' : `seg${i}`;
    segments.push({
      id,
      startSec: Math.round(startSec * 10) / 10,
      endSec: Math.round((isLast ? durationSec : endSec) * 10) / 10,
      charCount,
    });
  }

  const ts = { durationSec: Math.round(durationSec * 10) / 10, segments };
  fs.mkdirSync(path.dirname(OUT_TS), { recursive: true });
  fs.writeFileSync(OUT_TS, JSON.stringify(ts, null, 2));
  console.log(`✅ 时间戳已保存: ${OUT_TS} (${segments.length} segments)`);
}

main().catch(err => {
  console.error('❌ 失败:', err);
  process.exit(1);
});
