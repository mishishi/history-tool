#!/usr/bin/env node
/**
 * scripts/publish-cover.mjs
 *
 * 把新文章封面发布到 public/covers/ + 更新 cover-slugs.ts
 *
 * 配合 mavis agent 用的工作流:
 *   1. `node scripts/publish-cover.mjs build 51-nanbei-juntianzhi`
 *      → 打印统一 prompt,复制去让 mavis 用 image_synthesize 调
 *   2. mavis 调 image_synthesize(prompt=..., output_file_path=tmp/cover-51-nanbei-juntianzhi-raw.jpg)
 *   3. `node scripts/publish-cover.mjs publish 51-nanbei-juntianzhi`
 *      → 自动 cwebp 转 webp + 复制到 public/covers/ + 更新 cover-slugs.ts
 *   4. (可选) `node scripts/publish-cover.mjs all 51-nanbei-juntianzhi`
 *      → build + publish 一步,但需要 mavis 先把 raw 图放到 tmp/
 *
 * 子命令:
 *   build    <slug> [...]   打印 prompt 到 stdout (供 mavis 复制)
 *   publish  <slug> [...]   tmp/cover-{slug}-raw.* → public/covers/{slug}.webp + 更新 manifest
 *   all      <slug> [...]   build + publish 合并
 *   add      <slug> [...]   只更新 cover-slugs.ts (webp 已就位)
 *
 * 副产物:
 *   tmp/cover-{slug}-raw.{jpg,png}    mavis image_synthesize 输出
 *   tmp/cover-{slug}.webp             publish 中间产物(可删)
 *   public/covers/{slug}.webp         最终交付
 *   lib/cover-slugs.ts                manifest(自动追加)
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildCoverPrompt, parseFrontmatter } from '../lib/cover-prompt.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const COVER_DIR = path.join(ROOT, 'public', 'covers');
const TMP_DIR = path.join(ROOT, 'tmp');
const COVER_SLUGS_FILE = path.join(ROOT, 'lib', 'cover-slugs.ts');
const ARTICLES_DIR = path.join(ROOT, 'content', 'articles');

// --- 子命令派发 ---
const [, , cmd, ...args] = process.argv;

if (!cmd || !['build', 'publish', 'all', 'add'].includes(cmd)) {
  console.error(`用法:
  node scripts/publish-cover.mjs build   <slug> [...]   打印 prompt
  node scripts/publish-cover.mjs publish <slug> [...]   raw 图 → covers/
  node scripts/publish-cover.mjs all     <slug> [...]   build + publish
  node scripts/publish-cover.mjs add     <slug> [...]   只更新 cover-slugs.ts
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
    case 'build': return buildPrompts(args);
    case 'publish': return publishCovers(args);
    case 'all': {
      buildPrompts(args);
      return publishCovers(args);
    }
    case 'add': return addToManifest(args);
  }
}

// --- build: 打印 prompt ---
function buildPrompts(slugs) {
  for (const slug of slugs) {
    const article = loadArticle(slug);
    const prompt = buildCoverPrompt(article);
    // 输出格式:易于复制,每条前面带 [slug=XX] 标识
    console.log(`\n========== [slug=${slug}] ==========`);
    console.log(prompt);
    console.log('====================================\n');
  }
  console.error(`[publish-cover:build] ${slugs.length} prompt(s) 打印完成`);
  console.error(`复制上面 prompt 给 mavis 调 image_synthesize,output_file_path 用:`);
  for (const slug of slugs) {
    console.error(`  tmp/cover-${slug}-raw.jpg`);
  }
}

// --- publish: raw 图 → webp → public/covers + 更新 manifest ---
function publishCovers(slugs) {
  fs.mkdirSync(COVER_DIR, { recursive: true });
  fs.mkdirSync(TMP_DIR, { recursive: true });

  for (const slug of slugs) {
    // 1. 找 raw 图(支持 .jpg / .jpeg / .png)
    const rawPath = findRawImage(slug);
    if (!rawPath) {
      console.error(`[publish:${slug}] ❌ 找不到 tmp/cover-${slug}-raw.{jpg,jpeg,png}`);
      console.error(`  先用 mavis 调 image_synthesize 跑出来:`);
      console.error(`  output_file_path: tmp/cover-${slug}-raw.jpg`);
      continue;
    }

    // 2. sips 验证尺寸
    const sizeOk = validateSize(rawPath);
    if (!sizeOk.ok) {
      console.error(`[publish:${slug}] ❌ 图太小: ${sizeOk.w}x${sizeOk.h} (需 1376x768 ± 5%)`);
      continue;
    }

    // 3. cwebp 转 webp
    const webpTmp = path.join(TMP_DIR, `cover-${slug}.webp`);
    try {
      execSync(`cwebp -q 85 "${rawPath}" -o "${webpTmp}" 2>/dev/null`, { stdio: 'pipe' });
    } catch (e) {
      console.error(`[publish:${slug}] ❌ cwebp 转换失败: ${e.message?.slice(0, 100)}`);
      continue;
    }

    // 4. 移动到 public/covers/
    const webpFinal = path.join(COVER_DIR, `${slug}.webp`);
    fs.renameSync(webpTmp, webpFinal);

    // 5. 删 raw(jpg/jpeg/png)
    try { fs.unlinkSync(rawPath); } catch {}

    console.log(`[publish:${slug}] ✓ → ${path.relative(ROOT, webpFinal)} (${sizeOk.w}x${sizeOk.h})`);

    // 6. 追加到 cover-slugs.ts
    if (!isInCoverSlugs(slug)) {
      addToCoverSlugs(slug);
      console.log(`[publish:${slug}] ✓ → lib/cover-slugs.ts (新增)`);
    } else {
      console.log(`[publish:${slug}] ↻ lib/cover-slugs.ts (已在)`);
    }
  }
}

// --- add: 只更新 cover-slugs.ts (webp 已就位) ---
function addToManifest(slugs) {
  for (const slug of slugs) {
    const webp = path.join(COVER_DIR, `${slug}.webp`);
    if (!fs.existsSync(webp)) {
      console.error(`[add:${slug}] ❌ ${path.relative(ROOT, webp)} 不存在,先 publish`);
      continue;
    }
    if (isInCoverSlugs(slug)) {
      console.log(`[add:${slug}] ↻ 已在 cover-slugs.ts`);
      continue;
    }
    addToCoverSlugs(slug);
    console.log(`[add:${slug}] ✓ 已添加`);
  }
}

// --- helpers ---
function loadArticle(slug) {
  const path_ = path.join(ARTICLES_DIR, `${slug}.md`);
  if (!fs.existsSync(path_)) {
    console.error(`[publish-cover] ❌ 找不到 content/articles/${slug}.md`);
    process.exit(1);
  }
  const md = fs.readFileSync(path_, 'utf8');
  const fm = parseFrontmatter(md);
  if (!fm) {
    console.error(`[publish-cover] ❌ ${slug}.md 缺 frontmatter`);
    process.exit(1);
  }
  return fm;
}

function findRawImage(slug) {
  for (const ext of ['jpg', 'jpeg', 'png', 'webp']) {
    const p = path.join(TMP_DIR, `cover-${slug}-raw.${ext}`);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function validateSize(filepath) {
  try {
    const out = execSync(
      `sips -g pixelWidth -g pixelHeight "${filepath}" 2>&1 | tail -3`,
      { encoding: 'utf8' }
    );
    const w = parseInt(out.match(/pixelWidth:\s*(\d+)/)?.[1] || '0');
    const h = parseInt(out.match(/pixelHeight:\s*(\d+)/)?.[1] || '0');
    // matrix 输出 1376x768 (±5% 容差)
    const ok = w >= 1300 && w <= 1450 && h >= 720 && h <= 810;
    return { ok, w, h };
  } catch {
    return { ok: false, w: 0, h: 0 };
  }
}

function isInCoverSlugs(slug) {
  if (!fs.existsSync(COVER_SLUGS_FILE)) return false;
  const content = fs.readFileSync(COVER_SLUGS_FILE, 'utf8');
  return content.includes(`'${slug}'`);
}

function addToCoverSlugs(slug) {
  const content = fs.readFileSync(COVER_SLUGS_FILE, 'utf8');
  // 在 COVER_SLUGS 数组最后一行(在 'XX-bri',)前插入新 slug
  // 找最后一个 'XX-foo',\n]); 块,在它前面插入
  const slugLine = `  '${slug}',`;
  const newContent = content.replace(
    /^( {2}'[^']+',)\n(\]\);)$/m,
    `$1\n${slugLine}\n$2`
  );
  if (newContent === content) {
    // fallback: 如果正则没匹配,简单 append 到 ])
    const fallback = content.replace(
      /(\n\]\);)/,
      `\n${slugLine}\n]);`
    );
    fs.writeFileSync(COVER_SLUGS_FILE, fallback);
  } else {
    fs.writeFileSync(COVER_SLUGS_FILE, newContent);
  }
}
