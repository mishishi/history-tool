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
      // 滚到 5% 之后才显示进度条(避免顶部小滚动就显示)
      setVisible(scrollTop > 50);

      // 节流存到 localStorage: setProgress 内部还有 1% 节流
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
    <div
      className="fixed top-0 left-0 right-0 z-[55] h-[2px] bg-transparent pointer-events-none"
      aria-hidden="true"
    >
      <div
        className="h-full bg-cinnabar transition-[width] duration-100 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
