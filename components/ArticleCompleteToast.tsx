'use client';

import { useEffect, useRef, useState } from 'react';
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
 * - 滚到 90% 先亮 Toast(给"接近读完"反馈,不写 progress)
 * - 真·滚到底 + 停留 1s 才算 100% 读完,触发 setProgress + localStorage 标记
 * - localStorage(不是 sessionStorage):关 tab 重访同一文章不复弹
 * - 3.5s 自动消失(用户可点 × 立即关闭)
 * - 含下一篇跳转 CTA
 */
export default function ArticleCompleteToast({ slug, title, nextSlug, nextTitle }: Props) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 已完成的文章不显示(用 localStorage,关 tab 重访不复弹)
    try {
      const completed = localStorage.getItem(`dt-article-completed-${slug}`);
      if (completed) return;
    } catch {
      /* ignore */
    }

    let reachedBottom = false;
    let stayTimer: ReturnType<typeof setTimeout> | null = null;

    const markComplete = () => {
      try {
        setProgress(slug, 100);
        localStorage.setItem(`dt-article-completed-${slug}`, '1');
      } catch {
        /* ignore */
      }
      setVisible(true);
    };

    const onScroll = () => {
      const scrolledPx = window.scrollY + window.innerHeight;
      const total = document.body.scrollHeight;

      // 90% 阈值:先亮 Toast(给"接近读完"反馈),但不写 progress
      const nearBottom = scrolledPx >= total * 0.9;
      if (nearBottom && !visible) {
        setVisible(true);
      }

      // 真·滚到底(scrollY + viewport ≥ scrollHeight,容差 8px 避免小数抖动)
      const atBottom = scrolledPx >= total - 8;
      if (!atBottom) return;
      if (reachedBottom) return;

      // 真·100%:滚到底 + 停留 1s 才算"读完"(防误触发)
      reachedBottom = true;
      if (stayTimer) clearTimeout(stayTimer);
      stayTimer = setTimeout(markComplete, 1000);
    };

    // 初始化:如果已经接近底部,直接触发
    if (window.scrollY + window.innerHeight >= document.body.scrollHeight * 0.9) {
      onScroll();
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (stayTimer) clearTimeout(stayTimer);
    };
  }, [slug]);

  // 出现 3.5s 后自动消失 — 但用户 hover 时暂停消失
  const [hovered, setHovered] = useState(false);
  useEffect(() => {
    if (!visible || hovered) return;
    const t = setTimeout(() => {
      setExiting(true);
      setTimeout(() => setVisible(false), 300);
    }, 3500);
    return () => clearTimeout(t);
  }, [visible, hovered]);

  // 分享状态:copied=true 时 1.8s 内显示"已复制"
  const [copied, setCopied] = useState(false);
  const copyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onShare = async () => {
    if (typeof window === 'undefined') return;
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (copyTimeout.current) clearTimeout(copyTimeout.current);
      copyTimeout.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      // 兜底
      window.prompt('复制以下链接分享:', url);
    }
  };

  useEffect(() => {
    return () => {
      if (copyTimeout.current) clearTimeout(copyTimeout.current);
    };
  }, []);

  const close = () => {
    setExiting(true);
    setTimeout(() => setVisible(false), 300);
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed left-1/2 -translate-x-1/2 z-[65] max-w-[calc(100vw-2rem)] transition-opacity duration-300 bottom-fab-3 ${
        exiting ? 'opacity-0' : 'opacity-100'
      }`}
      role="status"
      aria-live="polite"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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

        {/* 分享 — 复制链接(取代 Web Share,后者在桌面端不可用) */}
        <button
          onClick={onShare}
          className="flex items-center gap-1 px-2 py-1.5 ml-1 text-xs text-ink-soft hover:text-cinnabar transition-colors shrink-0"
          aria-label="复制链接分享"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="hidden sm:inline">已复制</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a3 3 0 10-4.5-2.684m4.5 2.684a3 3 0 100-5.368M6.316 10.658L4.5 12m12.684 0L18.5 12m-9.032-1.342L8 12m6.5-1.342L13.5 12" />
              </svg>
              <span className="hidden sm:inline">分享</span>
            </>
          )}
        </button>

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