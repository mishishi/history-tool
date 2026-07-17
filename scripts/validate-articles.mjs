#!/usr/bin/env node
/**
 * 预构建验证 — 扫所有文章 markdown frontmatter
 *
 * 用途 (2026-07-17):
 * - Vercel 环境的 js-yaml 比本地更严,某些 plain unquoted scalar 带 ( ) ,
 *   或 ** 中文标点 会解析失败,导致 "Failed to collect page data for /xxx"
 * - 之前:只在 build 时炸,难定位
 * - 现在:build 前先跑这个脚本,任何文章 YAML 解析失败 → 立即 exit 1
 *   显示具体文件 + 行号 + 列号,1 分钟内定位修复
 *
 * 用法:
 *   node scripts/validate-articles.mjs        # 默认扫 content/articles + content/classics
 *   node scripts/validate-articles.mjs --dir=content/articles
 *
 * 集成:
 *   package.json: "prebuild": "node scripts/validate-articles.mjs"
 *   pre-commit: .githooks/pre-commit 也调一下
 *
 * 退出码:
 *   0 全部通过
 *   1 有文件解析失败
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// 解析 --dir= 参数(支持多目录)
const args = process.argv.slice(2);
const dirArgs = args
  .filter((a) => a.startsWith('--dir='))
  .map((a) => a.slice('--dir='.length));
const TARGET_DIRS =
  dirArgs.length > 0
    ? dirArgs.map((d) => path.resolve(ROOT, d))
    : [
        path.join(ROOT, 'content/articles'),
        path.join(ROOT, 'content/classics'),
      ];

let pass = 0;
let fail = 0;
const fails = [];

for (const dir of TARGET_DIRS) {
  if (!fs.existsSync(dir)) {
    console.warn(`[skip] ${dir} 不存在`);
    continue;
  }

  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
  for (const file of files) {
    const filePath = path.join(dir, file);
    const rel = path.relative(ROOT, filePath);
    const raw = fs.readFileSync(filePath, 'utf8');
    try {
      matter(raw);
      pass++;
    } catch (e) {
      fail++;
      const msg = e?.message || String(e);
      const mark = e?.mark;
      const detail = mark
        ? `pos ${mark.position}, line ${mark.line}, col ${mark.column}`
        : '';
      fails.push({ file: rel, msg, detail });
    }
  }
}

console.log('');
console.log('==============================================');
console.log(`  验证结果: ${pass} 通过, ${fail} 失败`);
console.log('==============================================');

if (fails.length > 0) {
  console.log('');
  console.log('失败文件:');
  for (const { file, msg, detail } of fails) {
    console.log(`  ✗ ${file}`);
    console.log(`    ${msg}`);
    if (detail) console.log(`    ${detail}`);
  }
  console.log('');
  console.log('修复方法:');
  console.log('  - 字段含 ( ) , 特殊字符 → 用 >- block scalar 包:');
  console.log('      subtitle: >-');
  console.log('        这是一段含(括号),的文本');
  console.log('  - 字段含 ** 加粗 → 用 >- block scalar 包:');
  console.log('      excerpt: >-');
  console.log('        **关键** 词');
  console.log('  - 字段是中文长文本 → 同上,>- block scalar');
  console.log('');
  process.exit(1);
}

console.log('✅ 全部文章 YAML 通过验证');
process.exit(0);
