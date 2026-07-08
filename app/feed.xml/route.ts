import { getAllArticles } from '@/lib/articles';

const SITE_URL = 'https://history-tool.vercel.app';
const SITE_TITLE = '读通鉴 — 把资治通鉴讲成你听得懂的故事';
const SITE_DESCRIPTION =
  '我们用 AI 把司马光写给皇帝的这部书,翻译成当代人能读懂、能用上的东西。资治通鉴不只是历史,它是 1362 年里所有关键决策的复盘。';

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
  const buildDate = new Date().toUTCString();

  const items = articles
    .map((article) => {
      const url = `${SITE_URL}/article/${article.slug}`;
      const pubDate = new Date(article.publishedAt).toUTCString();
      const description = article.excerpt || article.subtitle || article.title;

      return `
    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <author>hello@du-tongjian.com (读通鉴 · 主编 Jason)</author>
      <category>${escapeXml(article.dynasty)}</category>
      <description>${escapeXml(description)}</description>
    </item>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <managingEditor>hello@du-tongjian.com (读通鉴 · 主编 Jason)</managingEditor>
    <webMaster>hello@du-tongjian.com (读通鉴 · 主编 Jason)</webMaster>
    <copyright>© 2026 读通鉴 · 资治通鉴原文属公共领域</copyright>
    <image>
      <url>${SITE_URL}/opengraph-image</url>
      <title>${escapeXml(SITE_TITLE)}</title>
      <link>${SITE_URL}</link>
    </image>${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
