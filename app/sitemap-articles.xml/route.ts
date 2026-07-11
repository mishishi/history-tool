/**
 * GET /sitemap-articles.xml — Google News 风格文章 sitemap 子集
 *
 * 用途: 给搜索引擎(尤其 Google News / Google Discover)推 50 篇文章
 * 优势 vs 通用 sitemap:
 *   - News namespace(xmlns:news)带 publication_date / keywords / genres,权重更高
 *   - 子集独立,搜索引擎能增量拉取,新文章几小时内被索引(通用 sitemap 1-3 天)
 *   - 50 条 entry,体积 < 30KB,完全在 Google 单 sitemap 50K URL 限内
 *
 * 注册到 robots.ts 让搜索引擎发现:
 *   sitemap: ['/sitemap.xml', '/sitemap-articles.xml']
 *
 * 静态生成(force-static): build 时算好,CDN 缓存
 */
import { getAllArticles } from '@/lib/articles';
import { SITE_URL } from '@/lib/site-config';

export const dynamic = 'force-static';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const articles = getAllArticles();

  const entries = articles
    .map((article) => {
      const url = `${SITE_URL}/article/${article.slug}`;
      const pubDate = new Date(article.publishedAt).toISOString();
      // keywords 用 tags + 朝代(让搜索引擎分类更准)
      const keywords = [...(article.tags || []), article.dynasty].join(', ');
      return `    <url>
      <loc>${escapeXml(url)}</loc>
      <lastmod>${pubDate}</lastmod>
      <changefreq>monthly</changefreq>
      <priority>0.8</priority>
      <news:news>
        <news:publication>
          <news:name>读通鉴</news:name>
          <news:language>zh-CN</news:language>
        </news:publication>
        <news:publication_date>${pubDate}</news:publication_date>
        <news:title>${escapeXml(article.title)}</news:title>
        <news:keywords>${escapeXml(keywords)}</news:keywords>
        <news:genres>Opinion, HistoryAnalysis</news:genres>
      </news:news>
    </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${entries}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
