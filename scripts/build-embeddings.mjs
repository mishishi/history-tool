#!/usr/bin/env node
/**
 * 构建脚本:把 50 篇文章 embed 到 Upstash Vector
 *
 * 用法:
 *   1. .env.local 配 LLM_API_KEY / LLM_BASE_URL / UPSTASH_VECTOR_REST_URL / UPSTASH_VECTOR_REST_TOKEN
 *   2. npm run build-embeddings
 *   3. (可选)Vercel 部署后也跑一次,初始化 prod 的 vector DB
 *
 * 数据格式:每篇 article 一个 vector
 *   - id: classicalSlug (跟 articles 一样)
 *   - vector: 1536 维(默认 text-embedding-3-small)
 *   - metadata: { title, dynasty, era, slug, excerpt }
 *
 * 文本拼接策略:
 *   - title + subtitle + excerpt + tags + era + dynasty
 *   - 拼成 ~200-500 字短文,embedding 质量比塞整篇文章好
 *   - 整篇文章太长,semantic 会被稀释
 *
 * 幂等:重跑会覆盖已有 vector(用 upsert)
 */
import { config } from 'dotenv';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import OpenAI from 'openai';
import { Index } from '@upstash/vector';

// 加载 .env.local
config({ path: '.env.local' });
config({ path: '.env' });

const apiKey = process.env.LLM_API_KEY || process.env.EMBEDDING_API_KEY;
const baseURL = process.env.LLM_BASE_URL || process.env.EMBEDDING_BASE_URL || 'https://api.openai.com/v1';
const embeddingModel = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
const vectorUrl = process.env.UPSTASH_VECTOR_REST_URL;
const vectorToken = process.env.UPSTASH_VECTOR_REST_TOKEN;

if (!apiKey) {
  console.error('❌ LLM_API_KEY (or EMBEDDING_API_KEY) not set in .env.local');
  process.exit(1);
}
if (!vectorUrl || !vectorToken) {
  console.error('❌ UPSTASH_VECTOR_REST_URL / UPSTASH_VECTOR_REST_TOKEN not set in .env.local');
  process.exit(1);
}

const openai = new OpenAI({ apiKey, baseURL });
const index = new Index({ url: vectorUrl, token: vectorToken });

// 读所有 article
const ARTICLES_DIR = 'content/articles';
const files = readdirSync(ARTICLES_DIR).filter((f) => f.endsWith('.md'));
console.log(`📂 Found ${files.length} articles in ${ARTICLES_DIR}`);

// 拼每篇的"用于 embedding 的文本"
const records = files.map((file) => {
  const slug = file.replace(/\.md$/, '');
  const { data } = matter(readFileSync(join(ARTICLES_DIR, file), 'utf8'));
  const era = data.era || '';
  // 拼合字段:title + subtitle + excerpt + tags + era
  // excerpt / subtitle 太长会被 API 截断,这里用 ~400 字内
  const text = [
    data.title,
    data.subtitle,
    data.excerpt?.slice(0, 200),
    `朝代: ${data.dynasty}`,
    era ? `时代: ${era}` : '',
    `tags: ${(data.tags || []).join('、')}`,
    `卷: ${data.volume || ''}`,
  ]
    .filter(Boolean)
    .join(' | ');

  return {
    id: slug,
    text,
    metadata: {
      slug,
      title: data.title || '',
      dynasty: data.dynasty || '',
      era,
      excerpt: (data.excerpt || '').slice(0, 200),
    },
  };
});

console.log(`\n🔮 Embedding ${records.length} articles via ${embeddingModel}...`);

// 批量 embed(50 篇不超 OpenAI 单批 2048 上限)
const BATCH = 20;
let embedded = 0;
for (let i = 0; i < records.length; i += BATCH) {
  const batch = records.slice(i, i + BATCH);
  const startTime = Date.now();
  const res = await openai.embeddings.create({
    model: embeddingModel,
    input: batch.map((r) => r.text),
    encoding_format: 'float',
  });
  const vectors = res.data.map((d) => d.embedding);

  // upsert 到 Upstash
  await index.upsert(
    batch.map((r, j) => ({
      id: r.id,
      vector: vectors[j],
      metadata: r.metadata,
    })),
  );

  embedded += batch.length;
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`  ✓ ${embedded}/${records.length} (batch ${i / BATCH + 1}, ${elapsed}s)`);
}

console.log(`\n✅ Done! ${records.length} articles embedded.`);
console.log(`   Test: curl https://yourdomain.com/api/ask -d '{"question":"..."}'`);
