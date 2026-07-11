'use client';

import { useEffect, useRef, useState } from 'react';
import FavoriteButton from './FavoriteButton';
import Seal from './Seal';
import ArticleCover from './ArticleCover';
import type { ArticleMeta } from '@/lib/types';
import { formatDate } from '@/lib/date';
import { findDynasty } from '@/lib/dynasties';

interface Props {
  article: ArticleMeta;
  /**
   * 滚动视差强度(0-1),默认 0.4 — 滚到一半时 hero 上移约视口高度的 20%
   * 设为 0 关闭视差
   */
  parallax?: number;
}

/**
 * 文章页 Hero(杂志感开篇)
 * - 滚动视差:整体 translateY 随 scrollY 反向偏移,文字淡出
 * - 顶部/底部细金线
 * - DU TONGJIAN · 第 N 期 uppercase tracking
 * - 大字号标题 + 副标题 + 古文引子 + meta + 收藏按钮
 *
 * 视差停止条件:scrolledRatio >= 1(滚到 hero 完全离开视口)
 */
export default function ArticleHero({ article, parallax = 0.4 }: Props) {
  const [scrollY, setScrollY] = useState(0);
  const [heroHeight, setHeroHeight] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // 监听系统 reduce-motion 设置变化,用户切设置后视差立即响应
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduceMotion(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // 减震偏好:JS 视差也直接关
    if (reduceMotion) {
      setScrollY(0);
      return;
    }

    const measure = () => {
      setHeroHeight(el.offsetHeight);
    };
    measure();
    window.addEventListener('resize', measure);

    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', onScroll);
    };
  }, [reduceMotion]);

  // 视差计算:hero 还可见时才有视差
  const scrolledRatio = heroHeight > 0 ? Math.min(scrollY / heroHeight, 1) : 0;
  const offset = scrolledRatio * heroHeight * parallax; // 上移距离
  const opacity = Math.max(1 - scrolledRatio * 1.4, 0); // 1.4x 加速淡出

  return (
    <header
      ref={ref}
      className="article-hero relative"
      style={{
        transform: `translateY(-${offset}px)`,
        opacity,
        transition: 'transform 0.05s linear',
        willChange: 'transform, opacity',
      }}
    >
      {/* 顶部细金线 */}
      <div className="hero-rule mb-5"></div>

      {/* 封面图 — 文章页 LCP 元素,必须 eager */}
      {(() => {
        const dynasty = findDynasty(article.dynasty);
        if (!dynasty) return null;
        return <ArticleCover article={article} dynasty={dynasty} eager />;
      })()}

      <div className="text-center fade-in-up">
        {/* 期刊编号 */}
        <div className="hero-episode mb-6">
          DU TONGJIAN · 第 {article.episode} 期
        </div>

        {/* 朝代徽标 + 卷次 */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <Seal variant="gold">{article.dynasty}</Seal>
          <span className="text-xs text-ink-mute tracking-wide">资治通鉴 · {article.volume}</span>
        </div>

        {/* 主标题 */}
        <h1 className="text-4xl md:text-[52px] font-bold text-ink leading-[1.18] mb-7 tracking-tight">
          {article.title}
        </h1>

        {/* 副标题 */}
        {article.subtitle && (
          <p className="text-base md:text-lg text-ink-soft leading-relaxed mb-7 max-w-2xl mx-auto">
            {article.subtitle}
          </p>
        )}

        {/* 古文引子 */}
        {article.classicalQuote && (
          <blockquote className="classical text-base md:text-lg text-gold-dark italic leading-relaxed mb-10 max-w-2xl mx-auto">
            「{article.classicalQuote}」
          </blockquote>
        )}

        {/* meta 行 */}
        <div className="flex items-center justify-center gap-5 text-xs text-ink-mute mb-5">
          <span>{formatDate(article.publishedAt)}</span>
          <span className="w-1 h-1 rounded-full bg-ink-mute"></span>
          <span>{article.readingTime} 分钟阅读</span>
          <span className="w-1 h-1 rounded-full bg-ink-mute"></span>
          <span>{article.views >= 1000 ? `${(article.views / 1000).toFixed(1)}k` : article.views} 人已读</span>
        </div>

        {/* 操作:收藏 */}
        <div className="flex justify-center">
          <FavoriteButton slug={article.slug} title={article.title} />
        </div>
      </div>

      {/* 底部细金线 */}
      <div className="hero-rule mt-2"></div>
    </header>
  );
}