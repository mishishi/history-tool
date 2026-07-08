// Server-only — 依赖 node:fs 读取文件系统
import 'server-only';
import { getAllArticles } from './articles';
import type { SearchDoc } from './search-client';

export function getSearchData(): SearchDoc[] {
  return getAllArticles().map((a) => ({
    slug: a.slug,
    title: a.title,
    subtitle: a.subtitle,
    excerpt: a.excerpt,
    dynasty: a.dynasty,
    episode: a.episode,
    publishedAt: a.publishedAt,
    tags: a.tags,
    haystack: [a.title, a.subtitle, a.excerpt, a.dynasty, ...a.tags]
      .filter(Boolean)
      .join(' '),
  }));
}

// 重新导出 client 工具,方便 server 代码统一 import
export { searchDocs, type SearchDoc, type ScoredDoc } from './search-client';
