'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import MobileMenu from './MobileMenu';
import SearchButton from './SearchButton';
import ThemeToggle from './ThemeToggle';
import ContinueReadingButton from './ContinueReadingButton';
import type { SearchDoc } from '@/lib/search-client';

export default function Header({ docs }: { docs: SearchDoc[] }) {
  // 滚动状态:scrollY > 50 时 header 背景加深 + 加 shadow
  // 给"上下文切换"提供视觉反馈(读长文时,header 不再与内容混在一起)
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    onScroll(); // 初始化(防止刷新到 scrollY > 50 时 header 还是半透)
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 backdrop-blur-md transition-all duration-200 border-b ${
        scrolled
          ? 'bg-paper/95 shadow-sm border-border'
          : 'bg-paper/70 border-transparent'
      }`}
    >
      <div className="max-w-wide mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* 品牌 */}
        <Link href="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-cinnabar text-paper rounded-sm shadow-sm group-hover:bg-cinnabar-dark transition-colors">
            <span className="classical text-lg sm:text-xl font-bold">鉴</span>
          </div>
          <div className="hidden xs:block sm:block">
            <div className="text-sm sm:text-base font-semibold text-ink leading-tight">读通鉴</div>
            <div className="text-[9px] text-ink-mute tracking-[0.2em] uppercase leading-tight">Du Tongjian</div>
          </div>
        </Link>

        {/* 中间导航 — 桌面 */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium">
          <Link href="/" className="text-ink hover:text-cinnabar transition-colors">
            首页
          </Link>
          <Link href="/#articles" className="text-ink-soft hover:text-cinnabar transition-colors">
            最新解读
          </Link>
          <Link href="/#dynasties" className="text-ink-soft hover:text-cinnabar transition-colors">
            按朝代
          </Link>
          <Link href="/unlock" className="text-ink-soft hover:text-cinnabar transition-colors">
            订阅
          </Link>
          <Link href="/favorites" className="text-ink-soft hover:text-cinnabar transition-colors">
            收藏
          </Link>
        </nav>

        {/* 右侧 — 桌面 */}
        <div className="hidden md:flex items-center gap-2">
          {/* 继续阅读 — 只在有未读完文章时出现 */}
          <ContinueReadingButton docs={docs} />
          <Link
            href="/favorites"
            aria-label="我的收藏"
            title="我的收藏"
            className="p-2 text-ink-soft hover:text-cinnabar transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </Link>
          <ThemeToggle />
          <SearchButton docs={docs} />
          <Link
            href="/unlock"
            className="px-4 py-1.5 bg-cinnabar hover:bg-cinnabar-dark text-paper text-sm rounded-md transition-colors font-medium"
          >
            订阅
          </Link>
        </div>

        {/* 右侧 — 移动端:只保留 继续阅读 + 汉堡 */}
        <div className="md:hidden flex items-center gap-1">
          <ContinueReadingButton docs={docs} />
          <MobileMenu docs={docs} />
        </div>
      </div>
    </header>
  );
}