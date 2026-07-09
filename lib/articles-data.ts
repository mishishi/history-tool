// Edge-compatible article data — 预生成,不依赖 fs
// 由 build 时跑 scripts/build-article-data.mjs 生成到 public/article-data.json
// 客户端和 OG image 都通过 fetch 拿

export interface ArticleMeta {
  slug: string;
  title: string;
  subtitle: string;
  dynasty: string;
  volume: string;
  episode: number;
  excerpt: string;
  readingTime: number;
  views: number;
  publishedAt: string;
  classicalSlug: string;
}

const FALLBACK: ArticleMeta[] = [];

let _cache: ArticleMeta[] | null = null;

export async function loadArticles(): Promise<ArticleMeta[]> {
  if (_cache) return _cache;
  try {
    // 相对路径,从 public 拉 — 跨环境一致,不再硬编码域名
    const res = await fetch('/article-data.json', {
      cache: 'force-cache',
    });
    if (!res.ok) return FALLBACK;
    _cache = (await res.json()) as ArticleMeta[];
    return _cache;
  } catch {
    return FALLBACK;
  }
}

export async function getArticleMeta(slug: string): Promise<ArticleMeta | null> {
  const articles = await loadArticles();
  return articles.find((a) => a.slug === slug) ?? null;
}
