#!/usr/bin/env node
// 把 50 篇文章的 metadata 导出成 public/article-data.json
// 解决 OG image 等 runtime 不能 fs.readdir 的问题
// 同时给客户端用 — 一次性 fetch 拿全 metadata,避免重复读 fs

import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import matter from 'gray-matter';

const ARTICLES_DIR = 'content/articles';
const OUT = 'public/article-data.json';

mkdirSync(dirname(OUT), { recursive: true });

const files = readdirSync(ARTICLES_DIR).filter((f) => f.endsWith('.md'));

const articles = files.map((file) => {
  const slug = file.replace(/\.md$/, '');
  const filePath = join(ARTICLES_DIR, file);
  const fileContents = readFileSync(filePath, 'utf8');
  const { data } = matter(fileContents);

  return {
    slug,
    title: data.title || '',
    subtitle: data.subtitle || '',
    dynasty: data.dynasty || '战国',
    volume: data.volume || '',
    episode: data.episode || 1,
    excerpt: data.excerpt || '',
    classicalSlug: data.classicalSlug || slug,
    readingTime: data.readingTime || 8,
    views: data.views || 0,
    publishedAt: data.publishedAt || new Date().toISOString(),
  };
}).sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

writeFileSync(OUT, JSON.stringify(articles, null, 2));

console.log(`✓ Generated ${articles.length} article metadata`);
console.log(`  Output: ${OUT} (${(Buffer.byteLength(JSON.stringify(articles)) / 1024).toFixed(1)}KB)`);
