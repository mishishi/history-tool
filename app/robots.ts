import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site-config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'],
      },
    ],
    sitemap: [
      `${SITE_URL}/sitemap.xml`,
      // 子集:50 篇文章用 Google News namespace,新文章几小时被索引
      `${SITE_URL}/sitemap-articles.xml`,
    ],
    host: SITE_URL,
  };
}
