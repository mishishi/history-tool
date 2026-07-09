'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { setProgress } from '@/lib/user-data';

interface Props {
  /** 当前文章 slug(用于写进度) */
  slug: string;
  /** 当前文章标题 */
  title: string;
  /** 下一篇 slug(可选) */
  nextSlug?: string;
  /** 下一篇标题(可选) */
  nextTitle?: string;
}

/**
 * 文章页阅读完成反馈 Toast
 * - 滚动到 90% 时触发(给点容差,避免"差一点"没触发)
 * - 自动 setProgress(slug, 100) 标记完成
 * - 首次阅读触发,已完成文章不再触发
 * - 3.5s 自动消失(用户可点 × 立即关闭)
 * - 含下一篇跳转 CTA
 */
export default function ArticleCompleteToast({ slug, title, nextSlug, nextTitle }: Props) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 已完成的文章不显示
    try {
      const completed = sessionStorage.getItem(`dt-article-completed-${slug}`);
      if (completed) return;
    } catch {
      /* ignore */
    }

    const onScroll = () => {
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.body.scrollHeight;
      // 滚到 90% + 触发
      if (scrolled / total >= 0.9) {
        setVisible(true);
        // 标记完成(同时更新 user-data 进度)
        try {
          setProgress(slug, 100);
          sessionStorage.setItem(`dt-article-completed-${slug}`, '1');
        } catch {
          /* ignore */
        }
      }
    };

    // 初始化:如果已经接近底部,直接触发
    if (window.scrollY + window.innerHeight >= document.body.scrollHeight * 0.9) {
      onScroll();
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [slug]);

  // 出现 3.5s 后自动消失
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => {
      setExiting(true);
      setTimeout(() => setVisible(false), 300); // fade-out 动画时长
    }, 3500);
    return () => clearTimeout(t);
  }, [visible]);

  const close = () => {
    setExiting(true);
    setTimeout(() => setVisible(false), 300);
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed left-1/2 -translate-x-1/2 bottom-20 md:bottom-24 z-[65] max-w-[calc(100vw-2rem)] transition-opacity duration-300 ${
        exiting ? 'opacity-0' : 'opacity-100'
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 pl-3 pr-2 py-2 bg-paper-card border border-border rounded-full shadow-lg">
        {/* 印章感 ✓ */}
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-cinnabar/10 text-cinnabar shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* 文案 */}
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="text-xs text-ink-mute shrink-0">已读完</span>
          <span className="text-sm font-semibold text-ink truncate max-w-[200px] sm:max-w-[280px]">
            {title}
          </span>
        </div>

        {/* 下一篇 CTA 或「已是最新」 */}
        {nextSlug && nextTitle ? (
          <Link
            href={`/article/${nextSlug}`}
            className="flex items-center gap-1.5 pl-3 pr-2.5 py-1.5 ml-1 bg-cinnabar hover:bg-cinnabar-dark text-paper text-xs font-medium rounded-full transition-colors shrink-0"
          >
            <span className="hidden sm:inline truncate max-w-[160px]">{nextTitle}</span>
            <span className="sm:hidden">下一篇</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ) : (
          <span className="pl-3 pr-2 py-1.5 ml-1 text-xs text-ink-mute shrink-0">
            已是最新一篇
          </span>
        )}

        {/* 关闭 */}
        <button
          onClick={close}
          className="p-1 text-ink-mute hover:text-ink shrink-0"
          aria-label="关闭提示"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}