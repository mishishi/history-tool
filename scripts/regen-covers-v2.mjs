#!/usr/bin/env node
/**
 * scripts/regen-covers-v2.mjs
 *
 * 用 coverScene 重生成 50 张封面 (Step 2 - 全量)
 * - 读 tmp/cover-scenes.jsonl
 * - 拼统一 prompt (青绿山水 + 敦煌 + coverScene 主导)
 * - 8-way parallel × 7 批 (50 张)
 * - 下载到 tmp/cover-v2/{slug}.webp
 * - sips 验证 width/height
 * - 失败重试一次
 *
 * ⚠️  DEPRECATED (2026-07-13): `mavis` CLI 已被 MiniMax Code 3.0.48 主动移除。
 *   matrix image gen 改走 MCP native tools,直接让 mavis agent 用
 *   image_synthesize(prompt=统一拼接) 跑单张,8-way parallel 由 agent 调度。
 *   保留此文件供回滚参考 — 直接跑会立刻抛错。
 */
throw new Error(
  '[regen-covers-v2] DEPRECATED: mavis CLI 已被 MiniMax Code 3.0.48 移除。\n' +
  '  → matrix image gen 现在走 native MCP tools。\n' +
  '  → 让 mavis agent 用 image_synthesize(input_file_paths=[]) 跑单张。\n' +
  '  详见 scripts/regen-covers-v2.mjs 顶部 DEPRECATED 注释。'
);

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const SCENES = path.join(ROOT, 'tmp/cover-scenes.jsonl');
const OUT_DIR = path.join(ROOT, 'tmp/cover-v2');

const STYLE_HEADER = 'Chinese blue-green landscape painting qinglv shanshui, Dunhuang Mogao cave mural inspired';
const BAN_LIST = 'ABSOLUTELY NO TEXT OF ANY KIND ANYWHERE. No Chinese characters. No English letters. No Japanese, Korean, Arabic, Latin alphabet. No calligraphic strokes, no seal stamps, no signets, no annotations, no writing on walls, scrolls, banners, clothing, or anywhere';
const COMPOSITION = 'bird-eye panoramic view, foreground tiny lone figure in vermilion robes for scale and human reference, heavy gold contour outlines, flat mineral color fills, no atmospheric perspective, decorative cloud bands';

function buildPrompt(scene, color, mood) {
  return [
    `${STYLE_HEADER}. ${color} mineral color palette. ${mood} quality.`,
    `SCENE: ${scene}.`,
    `COMPOSITION: ${COMPOSITION}.`,
    BAN_LIST,
  ].join(' ');
}

async function callMatrix(prompts) {
  const args = JSON.stringify({
    requests: prompts.map((prompt) => ({
      prompt,
      aspect_ratio: '16:9',
      resolution: '1K',
    })),
  });
  const result = execSync(
    `mavis mcp call matrix matrix_generate_image '${args.replace(/'/g, "'\\''")}'`,
    { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024, timeout: 180_000 }
  );
  return JSON.parse(result);
}

function sipsValidate(filepath) {
  try {
    const out = execSync(`sips -g pixelWidth -g pixelHeight "${filepath}" 2>&1 | tail -3`, {
      encoding: 'utf8',
    });
    const w = out.match(/pixelWidth:\s*(\d+)/)?.[1];
    const h = out.match(/pixelHeight:\s*(\d+)/)?.[1];
    if (w && h && parseInt(w) > 1000 && parseInt(h) > 500) {
      return { ok: true, w: parseInt(w), h: parseInt(h) };
    }
    return { ok: false, w, h };
  } catch {
    return { ok: false };
  }
}

function downloadCdn(url, dest) {
  if (url.startsWith('/')) {
    // 本地路径 — matrix MCP daemon 把图落到 cwd 下了,直接 cp
    fs.copyFileSync(url, dest);
  } else {
    execSync(`curl -sSL --max-time 60 "${url}" -o "${dest}"`, { stdio: 'pipe' });
  }
}

function convertToWebp(jpgPath) {
  const webpPath = jpgPath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  execSync(`cwebp -q 85 "${jpgPath}" -o "${webpPath}" 2>/dev/null`, { stdio: 'pipe' });
  return webpPath;
}

function cleanupJpg(jpgPath) {
  try {
    fs.unlinkSync(jpgPath);
  } catch {}
}

async function processBatch(batch, batchIdx) {
  console.error(`\n=== batch ${batchIdx + 1}: ${batch.length} requests ===`);
  const prompts = batch.map((item) => buildPrompt(item.scene, item.color, item.mood));

  // 调用 matrix
  let resp;
  try {
    resp = await callMatrix(prompts);
  } catch (e) {
    console.error(`[batch ${batchIdx + 1}] mcp call failed: ${e.message?.slice(0, 200)}`);
    return { ok: 0, failed: batch.length };
  }

  if (resp.code !== 0) {
    console.error(`[batch ${batchIdx + 1}] matrix code=${resp.code} msg=${resp.message?.slice(0, 200)}`);
    return { ok: 0, failed: batch.length };
  }

  const items = resp.success_items || [];
  console.error(`[batch ${batchIdx + 1}] matrix returned ${items.length} success_items`);

  // 配对: matrix 返回的 output_url 顺序对应 requests 顺序
  let okCount = 0;
  for (let i = 0; i < batch.length; i++) {
    const item = batch[i];
    const mItem = items[i];
    if (!mItem || !mItem.is_success || !mItem.output_url) {
      console.error(`  [skip] ${item.slug} — no success item`);
      continue;
    }

    const cdnUrl = mItem.output_url;
    const jpgTmp = path.join(OUT_DIR, `${item.slug}-raw.jpg`);

    try {
      downloadCdn(cdnUrl, jpgTmp);
    } catch (e) {
      console.error(`  [download fail] ${item.slug}: ${e.message?.slice(0, 100)}`);
      continue;
    }

    const v = sipsValidate(jpgTmp);
    if (!v.ok) {
      console.error(`  [validate fail] ${item.slug}: ${v.w}x${v.h}`);
      cleanupJpg(jpgTmp);
      continue;
    }

    // 转 webp + 存
    const webpPath = path.join(OUT_DIR, `${item.slug}.webp`);
    try {
      const finalPath = convertToWebp(jpgTmp);
      fs.renameSync(finalPath, webpPath);
      cleanupJpg(jpgTmp);
      console.error(`  [ok] ${item.slug} ${v.w}x${v.h} → ${path.basename(webpPath)}`);
      okCount++;
    } catch (e) {
      console.error(`  [convert fail] ${item.slug}: ${e.message?.slice(0, 100)}`);
    }
  }

  return { ok: okCount, failed: batch.length - okCount };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const lines = fs.readFileSync(SCENES, 'utf8').trim().split('\n');
  const items = lines.map((l) => JSON.parse(l));
  console.error(`[regen-covers-v2] total ${items.length} articles`);

  // 8 张一批
  const BATCH_SIZE = 8;
  const batches = [];
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    batches.push(items.slice(i, i + BATCH_SIZE));
  }

  let totalOk = 0;
  let totalFailed = 0;
  for (let b = 0; b < batches.length; b++) {
    const { ok, failed } = await processBatch(batches[b], b);
    totalOk += ok;
    totalFailed += failed;
    // 批间 sleep 5s 防 RPM 限流
    if (b < batches.length - 1) {
      console.error('[sleep 5s between batches]');
      await new Promise((r) => setTimeout(r, 5000));
    }
  }

  console.error(`\n=== DONE ===`);
  console.error(`[regen-covers-v2] ${totalOk}/${items.length} ok, ${totalFailed} failed`);
  console.error(`[regen-covers-v2] output: ${OUT_DIR}`);
}

main().catch((e) => {
  console.error('[regen-covers-v2] fatal:', e);
  process.exit(1);
});
