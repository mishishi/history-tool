#!/usr/bin/env node
/**
 * scripts/generate-timestamps.mjs (v2 - 按 ## 大段落切)
 *
 * 段落粒度 = 大段落 (## 一、## 二、)
 * TTS 文本跟时间戳对齐:每段 = heading + 后续所有内容
 *
 * 段数 4-6 个,每段 60-90 秒,符合"段落同步高亮"的用户期望
 *
 * 注: 文本/段落/中性化逻辑在 lib/tts-text.mjs,本脚本只负责批跑 public/audios/ 全部 mp3
 *     新的"单篇/自动"流程用 scripts/publish-audio.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { TTS_CONFIG, buildTtsText, extractSections, parseArticle } from '../lib/tts-text.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const ARTICLES_DIR = path.join(ROOT, 'content', 'articles');
const OUT_DIR = path.join(ROOT, 'lib', 'audio-timestamps');
const AUDIO_DIR = path.join(ROOT, 'public', 'audios');

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

function computeTimestamps(slug) {
  const file = path.join(ARTICLES_DIR, `${slug}.md`);
  if (!fs.existsSync(file)) return null;

  const mp3 = path.join(AUDIO_DIR, `${slug}.mp3`);
  const durationSec = probeDuration(mp3);
  if (!durationSec) return null;

  const md = fs.readFileSync(file, 'utf8');
  const article = parseArticle(md);
  if (!article) return null;

  const sections = extractSections(article.body || '');
  if (sections.length === 0) return null;

  const allSegments = [];
  if (article.excerpt) allSegments.push({ id: 'excerpt', text: article.excerpt.replace(/\s+/g, ' ').trim() });
  for (const s of sections) allSegments.push({ id: s.id, text: s.text });

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

  return { durationSec: Math.round(durationSec * 10) / 10, segments: out };
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const files = fs.readdirSync(AUDIO_DIR).filter((f) => f.endsWith('.mp3'));
  console.log(`[generate-timestamps] ${files.length} audio files`);

  for (const f of files) {
    const slug = f.replace(/\.mp3$/, '');
    const ts = computeTimestamps(slug);
    if (!ts) {
      console.error(`  [fail] ${slug}`);
      continue;
    }
    fs.writeFileSync(
      path.join(OUT_DIR, `${slug}.json`),
      JSON.stringify(ts, null, 2) + '\n',
    );
    const segs = ts.segments.map(s => `${s.id}:${s.startSec}-${s.endSec}s(${s.charCount})`).join(' | ');
    console.log(`  [ok] ${slug} — ${ts.segments.length} segments, ${ts.durationSec}s`);
    console.log(`         ${segs}`);
  }
}

main();
