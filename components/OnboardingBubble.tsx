'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const STORAGE_KEY = 'history-onboarding-dismissed';
const AUTO_DISMISS_MS = 12000; // 12s 后自动淡出

/**
 * 首次访问引导气泡 — 左下角
 * - 仅在首页 (/) 显示(用户入口)
 * - 介绍 3 个核心功能:⌘K 搜索 / 浮动 QR / 继续阅读
 * - 用户点 × 关闭,关闭后写 localStorage,7 天内不显示
 * - 12s 后自动淡出(用户没注意到 × 时兜底)
 */
export default function OnboardingBubble() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // SSR safe: window check
    if (typeof window === 'undefined') return;

    // 只在首页显示 — 其他页面(about/article)不打扰
    if (pathname !== '/') return;

    // 7 天内 dismiss 不再显示
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) {
      const ts = parseInt(dismissed, 10);
      const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - ts < SEVEN_DAYS) return;
    }

    // 延后 1.5s 出现,让用户先看完首屏
    const showTimer = setTimeout(() => setVisible(true), 1500);

    // 12s 后自动淡出
    const fadeTimer = setTimeout(() => {
      setFading(true);
      setTimeout(() => setVisible(false), 400);
    }, AUTO_DISMISS_MS);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(fadeTimer);
    };
  }, [pathname]);

  const dismiss = () => {
    setFading(true);
    setTimeout(() => {
      setVisible(false);
      try {
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
      } catch {
        // localStorage 被禁用时静默忽略
      }
    }, 300);
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed left-4 bottom-4 md:left-6 md:bottom-6 z-40 max-w-[280px] md:max-w-[300px] ${
        fading ? 'onboarding-fade-out' : 'onboarding-fade-in'
      }`}
      role="dialog"
      aria-label="新功能引导"
    >
      <div className="bg-paper-card border border-border rounded-sm shadow-lg p-4 relative">
        {/* 关闭按钮 */}
        <button
          onClick={dismiss}
          className="absolute top-2 right-2 p-1 text-ink-mute hover:text-ink transition-colors"
          aria-label="关闭引导"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 标题 */}
        <div className="flex items-center gap-1.5 mb-2.5">
          <span className="classical text-base text-cinnabar font-bold">新</span>
          <span className="text-xs font-semibold text-ink tracking-wider">读通鉴指南</span>
        </div>

        {/* 三个 tip */}
        <ul className="space-y-1.5 text-xs text-ink-soft leading-relaxed">
          <li className="flex items-start gap-2">
            <kbd className="shrink-0 mt-0.5 px-1.5 py-0.5 text-[10px] font-mono text-cinnabar border border-cinnabar/40 bg-cinnabar/5 rounded">
              ⌘ K
            </kbd>
            <span>快捷键搜索 50 篇文章</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="shrink-0 mt-0.5 w-4 h-4 rounded-sm bg-gold/15 text-gold-dark text-[10px] flex items-center justify-center">
              ▦
            </span>
            <span>右下角扫码订阅公众号</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="shrink-0 mt-0.5 w-4 h-4 rounded-sm bg-cinnabar/10 text-cinnabar text-[10px] flex items-center justify-center">
              ◐
            </span>
            <span>Header 胶囊继续阅读</span>
          </li>
        </ul>

        {/* 不再提示 */}
        <button
          onClick={dismiss}
          className="mt-2.5 text-[10px] text-ink-mute hover:text-ink-soft transition-colors"
        >
          不再提示 →
        </button>
      </div>

      {/* 指向 FAB 的小箭头 — 视觉提示"右下有 QR" */}
      <div
        className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-paper-card border-r border-b border-border rotate-[-45deg]"
        aria-hidden="true"
      />
    </div>
  );
}