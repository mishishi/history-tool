import type { MetadataRoute } from 'next';
import { getAllArticles } from '@/lib/articles';
import { getAllFigures } from '@/lib/figures';
import { SITE_URL } from '@/lib/site-config';

// 静态页 lastModified 用固定 build 时间,避免误导爬虫每周都改
const BUILD_DATE = new Date('2026-07-01');

export default function sitemap(): MetadataRoute.Sitemap {
  const articles = getAllArticles();

  // 收录的公开静态页(noindex 的 /subscribed / /unsubscribe / /unlock/success 不入 sitemap)
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: BUILD_DATE,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/unlock`,
      lastModified: BUILD_DATE,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/archive`,
      lastModified: BUILD_DATE,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/figures`,
      lastModified: BUILD_DATE,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: BUILD_DATE,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      // /favorites 是公开可访问页(robots meta noindex,但占位有利于站点结构理解)
      url: `${SITE_URL}/favorites`,
      lastModified: BUILD_DATE,
      changeFrequency: 'never',
      priority: 0.3,
    },
  ];

  // 全部文章页 — lastModified 用 publishedAt(项目目前没编辑流,publishedAt 即最后修改)
  const articlePages: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${SITE_URL}/article/${article.slug}`,
    lastModified: new Date(article.publishedAt),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  // 人物页(全部静态化) — 238 位,长尾 SEO 入口
  const figurePages: MetadataRoute.Sitemap = getAllFigures().map((f) => ({
    url: `${SITE_URL}/figures/${encodeURIComponent(f.name)}`,
    lastModified: BUILD_DATE,
    changeFrequency: 'monthly',
    priority: f.articleSlugs.length >= 2 ? 0.7 : 0.5,
  }));

  return [...staticPages, ...articlePages, ...figurePages];
}
