/**
 * 音频段落时间戳生成器
 *
 * 用途: 文章页 audio sync 文本高亮
 * 原理: 按字数比例估算时间戳
 *   - 读 article.md 提取 excerpt + body 段落 (跟 generate-audios.mjs 完全一致)
 *   - 用 ffprobe 读实际 mp3 时长
 *   - 每段 startTime = 前面段落字数累加 / 总字数 × 总时长
 *   - endTime = (前面 + 本段) / 总字数 × 总时长
 *
 * 精度: 估算会有 1-3 秒偏差(取决于 TTS 标点/停顿),但段落级别足够
 *
 * 输出: lib/audio-timestamps/{slug}.json
 *   {
 *     durationSec: 363.2,
 *     segments: [
 *       { id: "excerpt", startSec: 0, endSec: 5.2, charCount: 80 },
 *       { id: "lead", startSec: 5.2, endSec: 18.5, charCount: 200 },
 *       ...
 *     ]
 *   }
 *
 * 文章页用 segments[i].id 对应到 paragraph DOM 的 id="seg-{slug}-{id}"
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import matter from 'gray-matter';

const ROOT = process.cwd();
const ARTICLES_DIR = path.join(ROOT, 'content', 'articles');
const OUT_DIR = path.join(ROOT, 'lib', 'audio-timestamps');

const MAX_CHARS = 1500; // 跟 generate-audios.mjs 一致

/* ===== 文本处理 (跟 generate-audios.mjs 一致) ===== */

function cleanText(s: string): string {
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

function extractBodyParagraphs(body: string, maxChars: number): string[] {
  const paragraphs = body
    .split(/\n\s*\n/)
    .map((p) => cleanText(p))
    .filter((p) => p.length > 0);
  const out: string[] = [];
  let total = 0;
  for (const p of paragraphs) {
    if (total >= maxChars) break;
    out.push(p);
    total += p.length;
  }
  return out;
}

interface Article {
  slug: string;
  excerpt: string;
  body: string;
}

function loadArticle(slug: string): Article | null {
  const file = path.join(ARTICLES_DIR, `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, 'utf8');
  const { data, content } = matter(raw);
  return {
    slug: data.slug || slug,
    excerpt: data.excerpt || '',
    body: content,
  };
}

/* ===== 段落切分 ===== */

export interface AudioSegment {
  id: string;
  startSec: number;
  endSec: number;
  charCount: number;
}

export interface AudioTimestamp {
  durationSec: number;
  segments: AudioSegment[];
}

/** ffprobe 读 mp3 时长 */
function probeDuration(mp3Path: string): number {
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

/** 估算时间戳 */
export function computeTimestamps(slug: string): AudioTimestamp | null {
  const article = loadArticle(slug);
  if (!article) return null;

  const mp3 = path.join(ROOT, 'public', 'audios', `${slug}.mp3`);
  const durationSec = probeDuration(mp3);
  if (!durationSec) return null;

  // 切分段落:excerpt 一段, body 段按空行分
  const segments: { id: string; text: string }[] = [];
  if (article.excerpt) {
    segments.push({ id: 'lead', text: cleanText(article.excerpt) });
  }
  const bodySegs = extractBodyParagraphs(article.body, MAX_CHARS);
  bodySegs.forEach((p, i) => segments.push({ id: `p${i + 1}`, text: p }));

  // 字数累加 → 时间戳
  const totalChars = segments.reduce((s, seg) => s + seg.text.length, 0);
  let cumulative = 0;
  const out: AudioSegment[] = segments.map((seg) => {
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

/** 读已存的 timestamps JSON(避免每次重新计算) */
export function getTimestamps(slug: string): AudioTimestamp | null {
  const file = path.join(OUT_DIR, `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as AudioTimestamp;
  } catch {
    return null;
  }
}

/** 生成 + 写入 JSON (build-time 跑一次) */
export function generateTimestampsFile(slug: string): boolean {
  const ts = computeTimestamps(slug);
  if (!ts) return false;
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, `${slug}.json`),
    JSON.stringify(ts, null, 2) + '\n',
  );
  return true;
}

/** 批量生成所有有音频的文章的 timestamps */
export function generateAllTimestamps(): { ok: string[]; fail: string[] } {
  const audioDir = path.join(ROOT, 'public', 'audios');
  if (!fs.existsSync(audioDir)) return { ok: [], fail: [] };
  const files = fs.readdirSync(audioDir).filter((f) => f.endsWith('.mp3'));
  const ok: string[] = [];
  const fail: string[] = [];
  for (const f of files) {
    const slug = f.replace(/\.mp3$/, '');
    if (generateTimestampsFile(slug)) ok.push(slug);
    else fail.push(slug);
  }
  return { ok, fail };
}
