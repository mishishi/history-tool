#!/usr/bin/env node
/**
 * scripts/generate-audios.mjs
 *
 * 批量生成 50 篇文章 TTS 音频
 * - 读 content/articles/*.md
 * - 提取 excerpt + body 前 ~1500 字
 * - matrix_synthesize_speech 跑 TTS (中文男声,0.95 速,neutral)
 * - 存到 public/audios/{slug}.mp3
 * - 跳过已存在的音频(可重复跑)
 *
 * 文本策略:
 * - excerpt (前 100 字) + body 段落 (累计到 ~1500 字)
 * - 中文 200-300 字/分钟 → 音频 ~5-7 分钟
 * - 清理 markdown (**bold** / # heading / [link](url) / 等等)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const ARTICLES_DIR = path.join(ROOT, 'content', 'articles');
const OUT_DIR = path.join(ROOT, 'public', 'audios');

const VOICE = 'male-qn-qingse'; // 青涩青年音色
const SPEED = 0.95;
const MAX_CHARS = 1500; // 截断长度
const MAX_CONCURRENT = 6; // 并发数(matrix TTS 没明确限流,6 保险)

/* ===== 文本处理 ===== */

/** 清理 markdown + HTML 标签,保留中文标点 */
function cleanText(s) {
  return s
    // 去掉 HTML 标签
    .replace(/<[^>]+>/g, '')
    // 去掉 markdown 强调 (** __)
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    // 去掉 markdown 链接 [text](url) → text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // 去掉 markdown 标题 (#)
    .replace(/^#+\s*/gm, '')
    // 去掉 markdown 引用 (>)
    .replace(/^>\s*/gm, '')
    // 去掉 markdown 列表 (- 或 * 开头)
    .replace(/^[\-\*]\s+/gm, '')
    // 去掉多余空白
    .replace(/\s+/g, ' ')
    .trim();
}

/** 从 markdown body 提取纯文本段落(前 N 段) */
function extractBodyParagraphs(body, maxChars) {
  // 按空行分段
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

/** 生成 TTS 文本:excerpt + body 前段 */
function buildTtsText(article) {
  const excerpt = cleanText(article.excerpt || '');
  const body = extractBodyParagraphs(article.body || '', MAX_CHARS);
  return `${excerpt}\n\n${body}`.trim();
}

/* ===== 矩阵 API ===== */

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

function sipsValidate(filepath) {
  try {
    const out = execSync(`sips -g pixelWidth -g pixelHeight "${filepath}" 2>&1 | tail -3`, { encoding: 'utf8' });
    // mp3 sips 返回 unknown 但 size > 0 算 OK
    const size = fs.statSync(filepath).size;
    return { ok: size > 1000, size };
  } catch {
    return { ok: false };
  }
}

/* ===== 主流程 ===== */

async function processOne(article, index, total) {
  const dest = path.join(OUT_DIR, `${article.slug}.mp3`);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
    return { slug: article.slug, status: 'skip', size: fs.statSync(dest).size };
  }

  const text = buildTtsText(article);
  console.error(`[${index + 1}/${total}] ${article.slug} (${text.length} 字) — TTS...`);

  let resp;
  try {
    resp = await callTts(text);
  } catch (e) {
    console.error(`  [fail] ${article.slug}: mcp error ${e.message?.slice(0, 100)}`);
    return { slug: article.slug, status: 'fail', error: 'mcp' };
  }

  if (resp.code !== 0 || !resp.output_url) {
    console.error(`  [fail] ${article.slug}: code=${resp.code} msg=${resp.message?.slice(0, 100)}`);
    return { slug: article.slug, status: 'fail', error: 'api' };
  }

  try {
    downloadCdn(resp.output_url, dest);
  } catch (e) {
    console.error(`  [download fail] ${article.slug}: ${e.message?.slice(0, 100)}`);
    return { slug: article.slug, status: 'fail', error: 'download' };
  }

  const v = sipsValidate(dest);
  if (!v.ok) {
    console.error(`  [validate fail] ${article.slug}: size=${v.size}`);
    try { fs.unlinkSync(dest); } catch {}
    return { slug: article.slug, status: 'fail', error: 'validate' };
  }

  console.error(`  [ok] ${article.slug} → ${path.basename(dest)} (${v.size} bytes)`);
  return { slug: article.slug, status: 'ok', size: v.size };
}

async function processBatch(items) {
  const results = await Promise.allSettled(items.map((item) => processOne(item.article, item.index, items.length)));
  return results.map((r) => (r.status === 'fulfilled' ? r.value : { status: 'fail', error: 'reject' }));
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const files = fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith('.md')).sort();
  console.error(`[generate-audios] found ${files.length} articles`);

  const articles = files.map((f, i) => {
    const raw = fs.readFileSync(path.join(ARTICLES_DIR, f), 'utf8');
    const { data, content } = matter(raw);
    return {
      slug: data.slug || f.replace(/\.md$/, ''),
      title: data.title || '',
      excerpt: data.excerpt || '',
      body: content,
    };
  });

  // 跳过已有音频
  const todo = articles.filter((a) => {
    const p = path.join(OUT_DIR, `${a.slug}.mp3`);
    return !(fs.existsSync(p) && fs.statSync(p).size > 1000);
  });
  const skipCount = articles.length - todo.length;
  if (skipCount > 0) console.error(`[skip] ${skipCount} 已存在`);

  let ok = 0, fail = 0, skip = 0;
  // 按 MAX_CONCURRENT 分批
  for (let i = 0; i < todo.length; i += MAX_CONCURRENT) {
    const batch = todo.slice(i, i + MAX_CONCURRENT);
    const indexed = batch.map((a, j) => ({ article: a, index: i + j }));
    console.error(`\n=== batch ${Math.floor(i / MAX_CONCURRENT) + 1}: ${batch.length} articles ===`);
    const results = await processBatch(indexed);
    for (const r of results) {
      if (r.status === 'ok') ok++;
      else if (r.status === 'skip') skip++;
      else fail++;
    }
    if (i + MAX_CONCURRENT < todo.length) {
      console.error('[sleep 2s between batches]');
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  console.error(`\n=== DONE ===`);
  console.error(`[generate-audios] ${ok} ok, ${fail} failed, ${skip} skipped (already exist)`);
  console.error(`[generate-audios] output: ${OUT_DIR}`);
}

main().catch((e) => {
  console.error('[generate-audios] fatal:', e);
  process.exit(1);
});
