#!/usr/bin/env node
/**
 * scripts/generate-timestamps.mjs (v2 - 按 ## 大段落切)
 *
 * 段落粒度 = 大段落 (## 一、## 二、)
 * TTS 文本跟时间戳对齐:每段 = heading + 后续所有内容
 *
 * 段数 4-6 个,每段 60-90 秒,符合"段落同步高亮"的用户期望
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const ARTICLES_DIR = path.join(ROOT, 'content', 'articles');
const OUT_DIR = path.join(ROOT, 'lib', 'audio-timestamps');
const AUDIO_DIR = path.join(ROOT, 'public', 'audios');

const MAX_CHARS = 1500;

function cleanInline(s) {
  return s
    .replace(/<[^>]+>/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^>\s*/gm, '')
    .replace(/^[\-\*]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanHeading(s) {
  // heading 只要去 #,保留 "一、孙权集团的 9 成官员主张投降" 这种标题
  return s.replace(/^#+\s*/, '').trim();
}

function extractSections(body) {
  // 按 ## heading 切分(保留 heading 行作为每段开头)
  // lead 段(## 之前)id = "lead", ## 段 id = s1, s2, s3...
  const lines = body.split('\n');
  const sections = [];
  let current = null;
  let leadText = [];
  let sCounter = 0;

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (current) {
        current.text = current.text.join('\n').trim();
        sections.push(current);
      } else if (leadText.length > 0) {
        sections.push({ id: 'lead', heading: null, text: leadText.join('\n').trim() });
      }
      sCounter++;
      current = {
        id: `s${sCounter}`,
        heading: cleanHeading(line),
        text: [cleanHeading(line)],
      };
    } else {
      if (current) {
        current.text.push(line);
      } else {
        leadText.push(line);
      }
    }
  }
  if (current) {
    current.text = current.text.join('\n').trim();
    sections.push(current);
  } else if (leadText.length > 0) {
    sections.push({ id: 'lead', heading: null, text: leadText.join('\n').trim() });
  }

  // 清理 + 截断
  const out = [];
  let totalChars = 0;
  for (const s of sections) {
    if (totalChars >= MAX_CHARS) break;
    const cleaned = cleanInline(s.text);
    if (cleaned.length === 0) continue;
    out.push({ id: s.id, heading: s.heading, text: cleaned });
    totalChars += cleaned.length;
  }
  return out;
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

function buildTtsText(article) {
  const sections = extractSections(article.body);
  const parts = [];
  if (article.excerpt) parts.push(cleanInline(article.excerpt));
  for (const s of sections) {
    parts.push(s.text);
  }
  return parts.join('\n\n');
}

function computeTimestamps(slug) {
  const file = path.join(ARTICLES_DIR, `${slug}.md`);
  if (!fs.existsSync(file)) return null;

  const mp3 = path.join(AUDIO_DIR, `${slug}.mp3`);
  const durationSec = probeDuration(mp3);
  if (!durationSec) return null;

  const { data, content } = matter(fs.readFileSync(file, 'utf8'));
  const sections = extractSections(content);
  if (sections.length === 0) return null;

  // TTS 文本 (跟 generate-audios 一样) — 段边界
  // id 区分:excerpt(摘要) / intro(## 前引言) / s1+ (## 段)
  const allSegments = [];
  if (data.excerpt) allSegments.push({ id: 'excerpt', text: cleanInline(data.excerpt) });
  for (const s of sections) {
    allSegments.push({ id: s.id, text: s.text });
  }

  // 字数累加 → 时间戳
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
