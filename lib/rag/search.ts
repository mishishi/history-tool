/**
 * 向量搜索 — Upstash Vector 上 top-k 检索
 *
 * Upstash Vector 模式:每个 vector 关联一个 metadata (record)
 * 我们存:{id: "article-slug", values: [...], metadata: {title, dynasty, era, excerpt}}
 */
import { Index } from '@upstash/vector';
import { embedText } from './embed';

let _index: Index | null = null;
function getIndex(): Index {
  if (_index) return _index;
  const url = process.env.UPSTASH_VECTOR_REST_URL;
  const token = process.env.UPSTASH_VECTOR_REST_TOKEN;
  if (!url || !token) {
    throw new Error('Upstash Vector env vars not set. Run scripts/build-embeddings.mjs to populate.');
  }
  _index = new Index({ url, token });
  return _index;
}

export interface SearchHit {
  id: string;
  slug: string;
  title: string;
  dynasty: string;
  era: string;
  excerpt: string;
  /** 相似度分数(0-1) */
  score: number;
}

/**
 * 查询 top-k 相关文章
 * - embed 问题
 * - 在 Upstash Vector 上 topK 查询
 * - 返回结构化结果
 */
export async function searchArticles(query: string, topK = 3): Promise<SearchHit[]> {
  const queryVec = await embedText(query);
  const index = getIndex();

  const results = await index.query({
    vector: queryVec,
    topK,
    includeMetadata: true,
  });

  return results
    .filter((r) => r.metadata && typeof r.metadata === 'object')
    .map((r) => {
      const m = r.metadata as Record<string, string>;
      return {
        id: String(r.id),
        slug: m.slug || String(r.id),
        title: m.title || '',
        dynasty: m.dynasty || '',
        era: m.era || '',
        excerpt: m.excerpt || '',
        score: r.score,
      };
    });
}
