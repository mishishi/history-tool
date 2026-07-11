#!/usr/bin/env node
/**
 * scripts/inject-cover-scenes.mjs
 *
 * 把 tmp/cover-scenes.jsonl 的 coverScene 字段写回 50 篇文章 frontmatter
 * 让 coverScene 成为 article 元数据,改文案后只需重跑 build-cover-prompts.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const SCENES = path.join(ROOT, 'tmp/cover-scenes.jsonl');
const ARTICLES = path.join(ROOT, 'content/articles');

const scenes = {};
for (const line of fs.readFileSync(SCENES, 'utf8').trim().split('\n')) {
  const j = JSON.parse(line);
  scenes[j.slug] = { scene: j.scene, color: j.color, mood: j.mood };
}

let injected = 0, skipped = 0;
for (const f of fs.readdirSync(ARTICLES).filter((f) => f.endsWith('.md'))) {
  const p = path.join(ARTICLES, f);
  let md = fs.readFileSync(p, 'utf8');
  const slug = f.replace(/\.md$/, '');
  const sc = scenes[slug];
  if (!sc) { skipped++; continue; }

  // 检查是否已有 coverScene 字段
  if (/^coverScene:/m.test(md)) {
    console.log(`  [skip] ${f} — already has coverScene`);
    skipped++;
    continue;
  }

  // 在 frontmatter 闭合 --- 前插入 coverScene 字段(用 | 字符串字面量支持长文本)
  const coverSceneBlock = [
    `coverScene: ${JSON.stringify(sc.scene)}`,
    `coverColor: ${JSON.stringify(sc.color)}`,
    `coverMood: ${JSON.stringify(sc.mood)}`,
  ].join('\n');

  // frontmatter 闭合 --- 之前插入
  const newMd = md.replace(/^(---\n[\s\S]*?)(\n---\n)/m, (m, fm, end) => {
    return `${fm}\n${coverSceneBlock}${end}`;
  });

  if (newMd === md) {
    console.log(`  [warn] ${f} — no frontmatter match`);
    skipped++;
  } else {
    fs.writeFileSync(p, newMd);
    console.log(`  [ok] ${f} — injected 3 fields`);
    injected++;
  }
}

console.log(`\n[inject-cover-scenes] ${injected} injected, ${skipped} skipped`);
