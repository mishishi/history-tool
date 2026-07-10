/**
 * RAG 配置 — OpenAI-compatible 客户端
 *
 * 设计成"任意 OpenAI-compatible"接口:OpenAI / DeepSeek / 智谱 / 通义千问 / 月之暗面 都用同一份代码
 * 用户只需配 3 个 env:
 * - LLM_API_KEY
 * - LLM_BASE_URL (默认 OpenAI)
 * - LLM_MODEL (默认 gpt-4o-mini)
 * - EMBEDDING_MODEL (默认 text-embedding-3-small)
 * - EMBEDDING_BASE_URL / EMBEDDING_API_KEY (可选,embedding 通常跟 chat 同源)
 * - UPSTASH_VECTOR_REST_URL
 * - UPSTASH_VECTOR_REST_TOKEN
 */
import OpenAI from 'openai';

export interface RagConfig {
  chat: OpenAI;
  embedding: OpenAI;
  model: string;
  embeddingModel: string;
}

let _cached: RagConfig | null = null;

export function getRagConfig(): RagConfig {
  if (_cached) return _cached;

  const apiKey = process.env.LLM_API_KEY;
  const baseURL = process.env.LLM_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.LLM_MODEL || 'gpt-4o-mini';

  const embeddingApiKey = process.env.EMBEDDING_API_KEY || apiKey;
  const embeddingBaseURL = process.env.EMBEDDING_BASE_URL || baseURL;
  const embeddingModel = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';

  if (!apiKey) {
    throw new Error('LLM_API_KEY not set. See README for setup.');
  }
  if (!embeddingApiKey) {
    throw new Error('EMBEDDING_API_KEY not set.');
  }

  _cached = {
    chat: new OpenAI({ apiKey, baseURL }),
    embedding: new OpenAI({ apiKey: embeddingApiKey, baseURL: embeddingBaseURL }),
    model,
    embeddingModel,
  };
  return _cached;
}

/** 检查配置是否完整(用于 UI 显示"AI 问典暂未配置"提示) */
export function isRagConfigured(): boolean {
  return !!(
    process.env.LLM_API_KEY &&
    process.env.UPSTASH_VECTOR_REST_URL &&
    process.env.UPSTASH_VECTOR_REST_TOKEN
  );
}
