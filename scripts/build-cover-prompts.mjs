#!/usr/bin/env node
/**
 * scripts/build-cover-prompts.mjs
 *
 * 读 content/articles/*.md 的 frontmatter,生成 50 张 cover prompt JSON
 *
 * Prompt 模板:统一青绿山水 + 敦煌壁画风,每篇从 excerpt 提取场景
 * - 朝代色调从 lib/cover-prompt.mjs 拿 (共享)
 * - 主体:俯瞰 + 朱红小人物(可叠加印章/标题)
 * - 强化 ban list 防 matrix 自加文字
 *
 * 输出:tmp/cover-prompts.jsonl (每行 {slug, prompt})
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCoverPrompt, parseFrontmatter } from '../lib/cover-prompt.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// --- 主流程 ---
const ARTICLES_DIR = path.join(ROOT, 'content/articles');
const OUT = path.join(ROOT, 'tmp/cover-prompts.jsonl');

fs.mkdirSync(path.dirname(OUT), { recursive: true });

const files = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.md')).sort();
console.error(`[build-cover-prompts] found ${files.length} articles`);

const out = fs.createWriteStream(OUT);
let skipped = 0;
for (const f of files) {
  const md = fs.readFileSync(path.join(ARTICLES_DIR, f), 'utf8');
  const fm = parseFrontmatter(md);
  if (!fm || !fm.slug || !fm.title || !fm.excerpt) {
    console.error(`[skip] ${f} (missing frontmatter)`);
    skipped++;
    continue;
  }
  const prompt = buildCoverPrompt(fm);
  out.write(JSON.stringify({ slug: fm.slug, dynasty: fm.dynasty, episode: fm.episode, prompt }) + '\n');
}
out.end();

out.on('finish', () => {
  console.error(`[build-cover-prompts] wrote ${files.length - skipped} prompts to ${OUT}`);
});
