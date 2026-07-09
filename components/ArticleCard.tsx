'use client';

import Link from 'next/link';
import { useEffect, useState, type CSSProperties } from 'react';
import type { ArticleMeta } from '@/lib/types';
import { getProgress, subscribe } from '@/lib/user-data';
import { formatRelativeDate } from '@/lib/date';
import { findDynasty } from '@/lib/dynasties';
import ArticleCover from './ArticleCover';

interface ArticleCardProps {
  article: ArticleMeta;
  variant?: 'default' | 'compact';
  /** stagger 序号:从 0 开始,每张卡片延迟 index * 60ms 进入视口 */
  index?: number;
  /** 是否显示朝代封面(默认 true,可在 404 兜底等场景关闭) */
  showCover?: boolean;
}

/**
 * 文章卡片(首页列表用)
 * - server props: article meta + index
 * - client side: 读 localStorage 的进度,显示「已读」/「阅读中」
 *
 * 顶部 1px accent 用品牌主色 cinnabar — 之前按朝代映射不同颜色(T=ink/战国=cinnabar/其他=gold),
 * 没有文档说明,用户也无法预测,简化为统一品牌色更清晰。
 */
export default function ArticleCard({ article, variant = 'default', index = 0, showCover = true }: ArticleCardProps) {
  // 进度状态(0-100)— 默认 0,挂载后从 localStorage 读
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    setProgress(getProgress(article.slug));
    const unsub = subscribe(() => setProgress(getProgress(article.slug)));
    return unsub;
  }, [article.slug]);

  // stagger 入场 — 第 0 张立即,后面每张延后 60ms
  const staggerStyle: CSSProperties =
    index > 0
      ? ({ ['--stagger-delay' as string]: `${index * 60}ms` } as CSSProperties)
      : {};

  const isRead = progress >= 95;
  const isInProgress = progress > 0 && progress < 95;

  return (
    <Link
      href={`/article/${article.slug}`}
      style={staggerStyle}
      className="article-card stagger-card group block relative bg-paper-card border border-border hover:border-cinnabar rounded-sm overflow-hidden"
    >
      {/* 顶部朝代封面 — 替代之前的 1px accent(更有视觉) */}
      {showCover &&
        (() => {
          const dynasty = findDynasty(article.dynasty);
          if (!dynasty) return null;
          return <ArticleCover article={article} dynasty={dynasty} compact />;
        })()}
      <div className={`p-6 ${variant === 'compact' ? 'p-5' : ''}`}>
        {/* 标签行 */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="seal-gold">{article.dynasty}</span>
          <span className="text-xs text-ink-mute">{article.volume}</span>
          <span className="text-xs text-ink-mute">·</span>
          <span className="text-xs text-ink-mute">{article.readingTime} 分钟</span>

          {/* 已读 ✓ 标记 */}
          {isRead && (
            <span className="ml-auto inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-cinnabar border border-cinnabar/40 bg-cinnabar/5 rounded-sm font-medium">
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              <span>已读</span>
            </span>
          )}
        </div>

        {/* 标题 */}
        <h3 className={`text-lg font-semibold mb-3 group-hover:text-cinnabar transition-colors leading-snug ${isRead ? 'text-ink-soft' : 'text-ink'}`}>
          {article.title}
        </h3>

        {/* 副标题(摘要) */}
        {article.excerpt && (
          <p className="text-sm text-ink-soft leading-relaxed mb-4 line-clamp-2">
            {article.excerpt}
          </p>
        )}

        {/* 古文引子 */}
        {article.classicalQuote && (
          <blockquote className="classical text-sm text-ink-soft italic border-l-2 border-gold/40 pl-3 line-clamp-2">
            「{article.classicalQuote}」
          </blockquote>
        )}

        {/* meta */}
        <div className="mt-5 pt-4 border-t border-border-soft flex items-center justify-between text-xs text-ink-mute">
          <span>{formatRelativeDate(article.publishedAt)}</span>
          <span>{article.views >= 1000 ? `${(article.views / 1000).toFixed(1)}k 阅读` : `${article.views} 阅读`}</span>
        </div>
      </div>

      {/* 底部阅读进度条 — 只在阅读中显示 */}
      {isInProgress && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-paper-deep">
          <div
            className="h-full bg-gradient-to-r from-cinnabar to-gold transition-[width] duration-300"
            style={{ width: `${progress}%` }}
            aria-label={`已读 ${Math.round(progress)}%`}
          />
        </div>
      )}

      {/* 已读 ✓ 角标 — 右上角浮动 */}
      {isRead && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-cinnabar text-paper flex items-center justify-center shadow-md" aria-label="已读完">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </Link>
  );
}