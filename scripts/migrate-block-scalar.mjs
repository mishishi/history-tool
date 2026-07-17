#!/usr/bin/env node
/**
 * 把不安全的多词 plain scalar 转成 >- block scalar
 *
 * 背景 (2026-07-17):
 * - Vercel 环境的 js-yaml 比本地更严,某些 plain unquoted scalar 带 ( ) ,
 *   或 ** 中文标点 会解析失败
 * - 之前的 fix(commit bc96f2d)只转了 16 篇文章的 subtitle/excerpt
 * - 还有 105 篇文章 + 13+ cover 字段没转
 *
 * 转换规则:
 * - subtitle: / classicalQuote: / excerpt: / coverScene: / coverColor: / coverMood:
 *   如果是 plain unquoted(不以 > | " ' [ 开头),转成 >- block scalar
 * - 把原行(只有单行值)替换为 2 行:第一行是 `field: >-`,第二行缩进原值
 *
 * 干跑(不写文件):
 *   node scripts/migrate-block-scalar.mjs --dry-run
 * 实际执行:
 *   node scripts/migrate-block-scalar.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ARTICLES_DIR = path.join(ROOT, 'content/articles');

const DRY_RUN = process.argv.includes('--dry-run');

const FIELDS_TO_MIGRATE = [
  'subtitle',
  'classicalQuote',
  'excerpt',
  'coverScene',
  'coverColor',
  'coverMood',
];

// 已经是安全标量(> / | / " / ' / [)开头的 → 跳过
const SAFE_PREFIX = /^([-|>]|"|'|\[)/;

let modified = 0;
let scanned = 0;
const changes = [];

function migrateFile(filePath) {
  scanned++;
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  // 找 frontmatter 范围
  let fmStart = -1;
  let fmEnd = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === '---') {
      if (fmStart < 0) fmStart = i;
      else {
        fmEnd = i;
        break;
      }
    }
  }
  if (fmStart < 0 || fmEnd < 0) return;

  // 收集需要替换的行索引 + 替换内容
  // 用 splice-replace 模式:直接修改 lines 数组
  const replacements = [];
  for (let i = fmStart + 1; i < fmEnd; i++) {
    const line = lines[i];
    const m = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)$/);
    if (!m) continue;
    const [, field, value] = m;
    if (!FIELDS_TO_MIGRATE.includes(field)) continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    if (SAFE_PREFIX.test(trimmed)) continue;

    // 记录替换:删原行,插入 2 行
    replacements.push({
      lineIndex: i,
      field,
      value: trimmed,
      old: line,
    });
  }

  if (replacements.length === 0) return;

  // 从后往前替换,避免 index shift
  for (let i = replacements.length - 1; i >= 0; i--) {
    const { lineIndex, field, value, old } = replacements[i];
    lines.splice(lineIndex, 1, `${field}: >-`, `  ${value}`);
    changes.push({ file: path.relative(ROOT, filePath), field, old: old.slice(0, 60) });
  }

  modified++;
  if (!DRY_RUN) {
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  }
}

const files = fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith('.md'));
for (const f of files) {
  migrateFile(path.join(ARTICLES_DIR, f));
}

console.log('');
console.log('==============================================');
console.log(`  扫描: ${scanned} 文件`);
console.log(`  改动: ${modified} 文件${DRY_RUN ? ' (dry-run, 未写)' : ''}`);
console.log('==============================================');

if (changes.length > 0) {
  console.log('');
  console.log(`变更: ${changes.length} 处`);
  for (const c of changes.slice(0, 8)) {
    console.log(`  ${c.file}: ${c.field}`);
    console.log(`    - ${c.old}${c.old.length >= 60 ? '...' : ''}`);
  }
  if (changes.length > 8) {
    console.log(`  ... +${changes.length - 8} more`);
  }
  console.log('');
  console.log(DRY_RUN ? '🔍 Dry run 完成' : '✅ 已修改');
  console.log('');
  console.log('下一步:');
  console.log('  1. node scripts/validate-articles.mjs  # 验证');
  console.log('  2. npx next build                       # 验证 build');
}
