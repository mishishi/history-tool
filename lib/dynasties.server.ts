/**
 * Server-side 朝代操作 — 只在 server 端用
 *
 * 包含 fs 依赖(getAllArticles), 千万不能在 client component 直接 import
 * (会触发 webpack 'Reading from "node:fs" is not handled' 错误)
 *
 * 调用方: app/page.tsx, app/archive/page.tsx, lib/timeline.ts, app/opengraph-image.tsx
 * 全是 server-side, 安全
 */
import 'server-only';
import { getAllArticles } from './articles';
import { DYNASTY_CONFIG, findDynasty, type Dynasty } from './dynasties';

/**
 * 给 9 个朝代加 count 字段(实时算, 加新文章自动同步)
 * 取代手填 count, 避免脱节
 */
export function getDynastiesWithCount(): Dynasty[] {
  const articles = getAllArticles();
  const counts = new Map<string, number>();
  for (const a of articles) {
    const d = findDynasty(a.dynasty);
    if (!d) continue;
    counts.set(d.slug, (counts.get(d.slug) ?? 0) + 1);
  }
  return DYNASTY_CONFIG.map((c) => ({ ...c, count: counts.get(c.slug) ?? 0 }));
}
