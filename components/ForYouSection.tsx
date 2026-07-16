'use client';

import { useEffect, useState } from 'react';
import { getFavorites, getRecent } from '@/lib/user-data';
import { recommend, type RecommendResult } from '@/lib/recommend';
import type { ArticleMeta } from '@/lib/types';
import ArticleCard from './ArticleCard';
import Link from 'next/link';

interface Props {
  allArticles: ArticleMeta[];
  /** trending 的 slug 列表(避免重复展示) */
  trendingSlugs: string[];
}

/**
 * "为你推荐" — 首页基于 localStorage 协同过滤
 *
 * 设计:
 * - 冷启动(0 阅读历史):显示 "开始读第一篇吧" 占位 CTA
 * - 有信号:显示 3 篇个性化推荐
 * - 必须 client component(localStorage 只在 browser 可用)
 *
 * 性能:
 * - recommend() 是纯函数,1ms 内算完 183 篇
 * - 不发请求,不用 analytics,纯本地
 * - 用户每次进首页都重算(响应 tags 变化)
 */
export default function ForYouSection({ allArticles, trendingSlugs }: Props) {
  const [result, setResult] = useState<RecommendResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 读 localStorage
    const favorites = getFavorites();
    const recent = getRecent();
    const readSlugs = recent.map((r) => r.slug);

    // 算推荐
    const r = recommend({
      allArticles,
      readSlugs,
      favoriteSlugs: favorites,
      excludeSlugs: trendingSlugs,
      topN: 3,
    });

    setResult(r);
    setLoading(false);
  }, [allArticles, trendingSlugs]);

  // 冷启动:没信号 → 显示 CTA
  if (!loading && result && !result.hasPersonalSignal) {
    return (
      <section className="mb-10 p-6 md:p-8 bg-gradient-to-br from-paper-card to-paper-deep border border-border rounded-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className="seal-gold">为你推荐</span>
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-ink mb-2">
          开始你的通鉴第一篇
        </h2>
        <p className="text-sm md:text-base text-ink-soft leading-relaxed mb-4 max-w-2xl">
          读完第一篇后,这里会显示基于你的兴趣定制的 3 篇推荐。
          我们用 tag 协同过滤(0 LLM/0 RAG/0 第三方),完全本地计算。
        </p>
        <Link
          href="/archive"
          className="inline-flex items-center gap-2 px-4 py-2 bg-cinnabar text-paper rounded-sm hover:bg-cinnabar-dark transition-colors text-sm font-medium"
        >
          浏览全部 {allArticles.length} 篇
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </section>
    );
  }

  // 加载中或无结果
  if (loading || !result || result.articles.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex items-end justify-between mb-4 md:mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="seal-gold">为你推荐</span>
            <span className="text-[10px] text-ink-mute">
              基于你的 {result.signalCount} 个 tag 兴趣
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-ink mb-1">
            读完这些,再读这些
          </h2>
          <p className="text-sm text-ink-mute">
            tag 协同过滤(本地计算,不上传)
          </p>
        </div>
        <Link
          href="/favorites"
          className="hidden md:inline-flex items-center gap-1.5 text-xs text-ink-soft hover:text-cinnabar transition-colors"
        >
          <span>我的收藏</span>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {result.articles.map((a) => (
          <ArticleCard key={a.slug} article={a} />
        ))}
      </div>
    </section>
  );
}
