// 纯客户端可用的搜索工具(不依赖 node:fs)
// 实际搜索数据由 server 端通过 props 传入

export interface SearchDoc {
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  dynasty: string;
  episode: number;
  publishedAt: string;
  tags: string[];
  haystack: string;
}

export interface ScoredDoc extends SearchDoc {
  score: number;
}

/**
 * 轻量搜索:字段加权 + 标题位置加权
 * 对 50 篇完全够用,延迟 < 1ms
 */
export function searchDocs(
  docs: SearchDoc[],
  query: string,
  limit = 8
): ScoredDoc[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: ScoredDoc[] = [];

  for (const doc of docs) {
    let score = 0;
    const titleLow = doc.title.toLowerCase();
    const haystackLow = doc.haystack.toLowerCase();

    if (titleLow === q) score += 100;
    else if (titleLow.includes(q)) score += 50;
    else if (doc.subtitle.toLowerCase().includes(q)) score += 20;
    else if (doc.excerpt.toLowerCase().includes(q)) score += 10;
    else if (haystackLow.includes(q)) score += 5;
    else continue;

    if (titleLow.startsWith(q)) score += 20;

    if (q.length <= 8 && titleLow.includes(q)) {
      score += Math.max(0, 20 - q.length * 2);
    }

    results.push({ ...doc, score });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}
