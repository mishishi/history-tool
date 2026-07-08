'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function ReadingProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  // 只在文章页显示
  const isArticle = pathname?.startsWith('/article/');

  useEffect(() => {
    if (!isArticle) {
      setVisible(false);
      return;
    }

    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;
      const max = docHeight - winHeight;

      if (max <= 0) {
        setProgress(0);
        setVisible(false);
        return;
      }

      const pct = Math.min(100, Math.max(0, (scrollTop / max) * 100));
      setProgress(pct);
      // 滚到 5% 之后才显示进度条(避免顶部小滚动就显示)
      setVisible(scrollTop > 50);
    };

    onScroll(); // 初始化
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [isArticle]);

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
