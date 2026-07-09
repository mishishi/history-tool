'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { recordVisit, setProgress } from '@/lib/user-data';

export default function ReadingProgress() {
  const pathname = usePathname();
  const [progress, setVisual] = useState(0);
  const [visible, setVisible] = useState(false);

  // 只在文章页显示
  const isArticle = pathname?.startsWith('/article/');
  const slug = isArticle ? pathname!.split('/')[2] : null;

  useEffect(() => {
    if (!isArticle || !slug) {
      setVisible(false);
      return;
    }

    // 记录这次访问到最近列表(只触发一次)
    recordVisit(slug);

    let rafId: number | null = null;
    let lastSaved = -1;

    const compute = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;
      const max = docHeight - winHeight;

      if (max <= 0) {
        setVisual(0);
        setVisible(false);
        return;
      }

      const pct = Math.min(100, Math.max(0, (scrollTop / max) * 100));
      setVisual(pct);
      // 滚到 80px 之后才显示进度条(避免顶部小滚动就显示)
      setVisible(scrollTop > 80);

      // 节流存到 localStorage
      if (Math.abs(pct - lastSaved) >= 2 || pct === 0 || pct === 100) {
        setProgress(slug, pct);
        lastSaved = pct;
      }
    };

    const onScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        compute();
        rafId = null;
      });
    };

    compute();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [isArticle, slug]);

  if (!isArticle || !visible) return null;

  return (
    <>
      {/* 顶部细金线作为「轨道」 */}
      <div
        className="fixed top-0 left-0 right-0 z-[55] h-[2px] bg-gradient-to-r from-transparent via-border to-transparent pointer-events-none"
        aria-hidden="true"
      />

      {/* 进度条本体 — 朱红→金渐变 */}
      <div
        className="fixed top-0 left-0 right-0 z-[56] h-[3px] bg-transparent pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="h-full bg-gradient-to-r from-cinnabar to-gold shadow-[0_0_8px_rgba(178,58,58,0.4)] transition-[width] duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 右侧百分比气泡(只读中显示,完成时显示「✓ 已读完」) */}
      {progress >= 100 ? (
        <div
          className="fixed top-2 right-3 z-[57] px-2.5 py-1 bg-cinnabar text-paper text-[10px] font-medium rounded-full shadow-md pointer-events-none tracking-wider flex items-center gap-1"
          role="status"
          aria-live="polite"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
          <span>已读完</span>
        </div>
      ) : progress > 5 ? (
        <div
          className="fixed top-2 right-3 z-[57] px-2.5 py-1 bg-ink/90 backdrop-blur-sm text-paper text-[10px] font-medium rounded-full shadow-md pointer-events-none tabular-nums"
          role="status"
          aria-live="polite"
          aria-label={`阅读进度 ${Math.round(progress)}%`}
        >
          {Math.round(progress)}%
        </div>
      ) : null}
    </>
  );
}