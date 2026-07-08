'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';

/**
 * 移动端汉堡菜单
 * - 仅在 md 以下(平板及以下)显示
 * - 点击展开全屏下拉菜单
 * - 路由切换或按 ESC 时自动关闭
 */
export default function MobileMenu() {
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

  const links = [
    { href: '/', label: '首页' },
    { href: '/#articles', label: '最新解读' },
    { href: '/#dynasties', label: '按朝代' },
    { href: '/unlock', label: '订阅' },
    { href: '/favorites', label: '我的收藏' },
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
      {/* 主题切换 — 仅 mobile 显示 */}
      <div className="md:hidden">
        <ThemeToggle />
      </div>

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
          <div className="md:hidden absolute top-16 left-0 right-0 bg-paper border-b border-border shadow-lg z-50">
            <nav className="px-6 py-4 space-y-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block px-3 py-3 text-base font-medium text-ink hover:bg-paper-deep hover:text-cinnabar rounded-sm transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 mt-3 border-t border-border-soft space-y-1">
                <Link
                  href="/unlock"
                  onClick={() => setOpen(false)}
                  className="block w-full text-center px-4 py-3 bg-cinnabar hover:bg-cinnabar-dark text-paper rounded-md font-medium text-sm"
                >
                  立即订阅
                </Link>
              </div>
            </nav>
          </div>
        </>
      )}
    </>
  );
}