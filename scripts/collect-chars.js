#!/usr/bin/env node
/**
 * 收集全站所需的 Chinese characters
 * 范围:content/articles + content/classics + app/ + components/ + lib/ + scripts/ + 内容里涉及的常量字符串
 * 输出:scripts/fonts/chars.txt
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SOURCES = [
  'content/articles',
  'content/classics',
  'app',
  'components',
  'lib',
  // 静态文案常驻字符串(印章 hero 等)
  'app/globals.css',
];

const EXCLUDE = [
  'node_modules',
  '.next',
  '.git',
  'public',
  'scripts/fonts/out',
];

const EXTS = new Set(['.md', '.mdx', '.tsx', '.ts', '.css', '.js', '.mjs', '.json']);

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDE.includes(entry.name)) continue;
    if (entry.name.startsWith('.')) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(p, files);
    } else if (EXTS.has(path.extname(entry.name))) {
      files.push(p);
    }
  }
  return files;
}

const charSet = new Set();

for (const src of SOURCES) {
  const full = path.isAbsolute(src) ? src : path.join(ROOT, src);
  const files = fs.existsSync(full) && fs.statSync(full).isDirectory() ? walk(full) : [full];
  for (const f of files) {
    if (!fs.existsSync(f)) continue;
    const txt = fs.readFileSync(f, 'utf8');
    for (const ch of txt) {
      const code = ch.codePointAt(0);
      // CJK 基本区 + 扩展 A/B + 标点 + 全角符号
      if (
        (code >= 0x4e00 && code <= 0x9fff) ||        // CJK 基本
        (code >= 0x3400 && code <= 0x4dbf) ||        // CJK 扩展 A
        (code >= 0x20000 && code <= 0x2a6df) ||     // CJK 扩展 B
        (code >= 0xf900 && code <= 0xfaff) ||        // CJK 兼容
        (code >= 0x3000 && code <= 0x303f) ||        // CJK 标点
        (code >= 0xff00 && code <= 0xffef) ||        // 全角
        (code >= 0x2e80 && code <= 0x2eff)           // 偏旁部首
      ) {
        charSet.add(ch);
      }
    }
  }
}

const sorted = Array.from(charSet).sort();
const out = path.join(ROOT, 'scripts', 'fonts', 'chars.txt');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, sorted.join(''), 'utf8');
console.log(`Unique CJK chars: ${sorted.length}`);
console.log(`Output: ${out}`);
