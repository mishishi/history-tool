#!/usr/bin/env node
/**
 * scripts/build-cover-manifest.mjs
 *
 * 读 public/covers/*.webp,生成 lib/cover-slugs.ts
 * 让 ArticleCover 在 build 时知道哪些 slug 有 AI 封面,
 * 避免 runtime fs IO (Edge Runtime 安全)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const COVERS_DIR = path.join(ROOT, 'public/covers');
const OUT = path.join(ROOT, 'lib/cover-slugs.ts');

const files = fs.existsSync(COVERS_DIR)
  ? fs.readdirSync(COVERS_DIR).filter(f => f.endsWith('.webp'))
  : [];

const slugs = files.map(f => f.replace(/\.webp$/, '')).sort();
const slugList = slugs.map(s => `  '${s}',`).join('\n');

const content = `/**
 * 自动生成 — scripts/build-cover-manifest.mjs
 * 列出所有有 AI 生成封面的 article slug
 * ArticleCover 用它判断用 webp 还是 fallback SVG
 *
 * 不要手改!跑 npm run prebuild 或 npm run build 自动重新生成
 */
export const COVER_SLUGS: ReadonlySet<string> = new Set([
${slugList}
]);

export function hasCover(slug: string): boolean {
  return COVER_SLUGS.has(slug);
}
`;

fs.writeFileSync(OUT, content);
console.error(`[build-cover-manifest] wrote ${slugs.length} slugs to ${OUT}`);
