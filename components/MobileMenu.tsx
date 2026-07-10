'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';
import SearchButton from './SearchButton';
import type { SearchDoc } from '@/lib/search-client';

interface Props {
  docs: SearchDoc[];
}

/**
 * 移动端汉堡菜单
 * - 仅在 md 以下(平板及以下)显示
 * - 点击展开全屏下拉菜单
 * - 路由切换或按 ESC 时自动关闭
 * - 包含 5 个导航链接 + 主题切换 + 搜索 + 收藏 + 立即订阅 CTA
 */
export default function MobileMenu({ docs }: Props) {
  const [open, setOpen] = useState(false);

  // 路由切换关闭 — 通过监听 hashchange / popstate
  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener('hashchange', close);
    window.addEventListener('popstate', close);
    return () => {
      window.removeEventListener('hashchange', close);
      window.removeEventListener('popstate', close);
    };
  }, []);

  // 按 ESC 关闭
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // 打开时锁滚动
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const navLinks = [
    { href: '/', label: '首页' },
    { href: '/archive', label: '通鉴目录' },
    { href: '/figures', label: '人物长卷' },
    { href: '/#articles', label: '最新解读' },
    { href: '/#dynasties', label: '按朝代' },
    { href: '/about', label: '关于我们' },
  ];

  return (
    <>
      {/* 汉堡按钮 — 仅 mobile 显示 */}
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden p-2 rounded-md hover:bg-paper-deep text-ink-soft hover:text-ink transition-colors"
        aria-label="菜单"
        aria-expanded={open}
      >
        {open ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* 全屏下拉 — 移动端 */}
      {open && (
        <>
          {/* 半透明遮罩 */}
          <div
            className="md:hidden fixed inset-0 top-16 bg-ink/30 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          {/* 菜单本体 */}
          <div className="md:hidden absolute top-16 left-0 right-0 bg-paper border-b border-border shadow-xl z-50 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <nav className="px-6 py-4 space-y-1" aria-label="移动端导航">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block px-3 py-3 text-base font-medium text-ink hover:bg-paper-deep hover:text-cinnabar rounded-sm transition-colors"
                >
                  {link.label}
                </Link>
              ))}

              {/* 工具区:搜索 / 收藏 / 主题切换 */}
              <div className="pt-3 mt-3 border-t border-border-soft space-y-1">
                <div className="px-3 py-2 flex items-center gap-2">
                  <span className="text-xs text-ink-mute tracking-widest uppercase shrink-0">搜 索</span>
                  <div className="flex-1">
                    <SearchButton docs={docs} />
                  </div>
                </div>
                <Link
                  href="/favorites"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-3 text-sm text-ink-soft hover:bg-paper-deep hover:text-cinnabar rounded-sm transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>我的收藏</span>
                </Link>
                <div className="flex items-center gap-2 px-3 py-3 text-sm text-ink-soft">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  <span>主题</span>
                  <div className="ml-auto">
                    <ThemeToggle />
                  </div>
                </div>
              </div>

              {/* CTA:立即订阅 */}
              <div className="pt-3 mt-3">
                <Link
                  href="/unlock"
                  onClick={() => setOpen(false)}
                  className="block w-full text-center px-4 py-3 bg-cinnabar hover:bg-cinnabar-dark text-paper rounded-md font-medium text-sm transition-colors"
                >
                  立即订阅每周精读
                </Link>
              </div>
            </nav>
          </div>
        </>
      )}
    </>
  );
}