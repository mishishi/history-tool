/**
 * 资治通鉴朝代时间线数据层
 *
 * 按主朝代分组 50 篇文章
 * - 用 findDynasty(article.dynasty) 把 30 种 dynasty 字符串归类到 8 主朝代
 * - 每组内按 episode 升序(早 → 晚)
 * - 时间线 X 轴 = 朝代,Y 轴 = 同一朝代内时间顺序
 *
 * TimelineArticle 扩展自 ArticleMeta,加入 keyFigures 用于 preview drawer
 * (避免 drawer 打开时再去 fetch classic 文件,体验更顺)
 */
import 'server-only';
import { getAllArticles, getClassicBySlug } from './articles';
import { findDynasty, type Dynasty } from './dynasties';
import { getDynastiesWithCount } from './dynasties.server';
import type { ArticleMeta, KeyFigure } from './types';

export interface TimelineArticle extends ArticleMeta {
  /** 关联 classic 文件的 keyFigures(供 preview drawer 用) */
  keyFigures: KeyFigure[];
}

export interface TimelineColumn {
  dynasty: Dynasty;
  articles: TimelineArticle[];
}

export function getTimelineColumns(): TimelineColumn[] {
  const articles = getAllArticles();
  const dynastiesWithCount = getDynastiesWithCount();
  // Map<主朝代 slug, articles[]>
  const byDynasty = new Map<string, TimelineArticle[]>();
  for (const d of dynastiesWithCount) byDynasty.set(d.slug, []);
  // 兜底 bucket:无法归类的文章
  const orphanKey = '__other__';

  for (const a of articles) {
    const d = findDynasty(a.dynasty);
    const slug = d?.slug || orphanKey;
    if (!byDynasty.has(slug)) byDynasty.set(slug, []);
    // 关联 keyFigures(可能为空)
    const classic = getClassicBySlug(a.classicalSlug);
    byDynasty.get(slug)!.push({
      ...a,
      keyFigures: classic?.keyFigures || [],
    });
  }

  // 每组内按 episode 升序
  for (const list of byDynasty.values()) {
    list.sort((a, b) => a.episode - b.episode);
  }

  // 按朝代顺序输出列(count 实时算)
  const out: TimelineColumn[] = [];
  for (const d of dynastiesWithCount) {
    const list = byDynasty.get(d.slug) || [];
    if (list.length === 0) continue; // 跳过空列
    out.push({ dynasty: d, articles: list });
  }
  // 兜底 bucket 追加(如果有未归类)
  const orphan = byDynasty.get(orphanKey);
  if (orphan && orphan.length > 0) {
    out.push({
      dynasty: {
        name: '其他',
        period: '',
        slug: 'other',
        count: orphan.length,
        primary: '#666666',
        secondary: '#999999',
        motif: 'ring',
        aliases: [],
      },
      articles: orphan,
    });
  }
  return out;
}

/** 时间线总览(SEO 友好) */
export interface TimelineMeta {
  totalArticles: number;
  totalDynasties: number;
  yearSpan: string; // 例 "前 453 - 公元 2013"
}

export function getTimelineMeta(columns: TimelineColumn[]): TimelineMeta {
  const totalArticles = columns.reduce((s, c) => s + c.articles.length, 0);
  return {
    totalArticles,
    totalDynasties: columns.length,
    yearSpan: '前 403 - 2013', // 资治通鉴时间跨度(战国初到 2013 一带一路)
  };
}
