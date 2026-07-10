/**
 * Embedding — 单文本 → 向量
 */
import { getRagConfig } from './config';

/**
 * 把一段文本转成 embedding 向量
 * - 用 OpenAI text-embedding-3-small(1536 维,便宜,$0.02/1M tokens)
 * - 长文本会被截断(API 限制 8192 tokens)
 */
export async function embedText(text: string): Promise<number[]> {
  const { embedding, embeddingModel } = getRagConfig();
  // 截断到 ~8K chars(粗略估算,API 内部会再 tokenize)
  const truncated = text.length > 28000 ? text.slice(0, 28000) : text;

  const res = await embedding.embeddings.create({
    model: embeddingModel,
    input: truncated,
    encoding_format: 'float',
  });
  return res.data[0].embedding;
}

/** 批量 embed(用于 build-embeddings 脚本) */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  const { embedding, embeddingModel } = getRagConfig();
  // OpenAI 一次最多 2048 inputs,这里单 article 50 篇不会超
  const truncated = texts.map((t) => (t.length > 28000 ? t.slice(0, 28000) : t));
  const res = await embedding.embeddings.create({
    model: embeddingModel,
    input: truncated,
    encoding_format: 'float',
  });
  // OpenAI 返回顺序与 input 顺序一致
  return res.data.map((d) => d.embedding);
}
