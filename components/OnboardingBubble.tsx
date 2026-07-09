'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const STORAGE_KEY = 'dt-onboarding-dismissed';
const AUTO_DISMISS_MS = 12000; // 12s 后自动淡出

interface Props {
  /** 文章总数 — 用于显示「快捷键搜索 N 篇文章」 */
  articleCount: number;
}

/**
 * 首次访问引导气泡 — 左下角
 * - 仅在首页 (/) 显示(用户入口)
 * - 介绍 3 个核心功能:⌘K 搜索 / 浮动 QR / 继续阅读
 * - 用户点 × 关闭,关闭后写 localStorage,7 天内不显示
 * - 12s 后自动淡出(用户没注意到 × 时兜底)
 */
export default function OnboardingBubble({ articleCount }: Props) {
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
      className={`fixed left-4 md:left-6 z-40 max-w-[280px] md:max-w-[300px] ${
        fading ? 'onboarding-fade-out' : 'onboarding-fade-in'
      }`}
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
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
            <span>快捷键搜索 {articleCount} 篇文章</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="shrink-0 mt-0.5 w-4 h-4 rounded-sm bg-gold/15 text-gold-dark flex items-center justify-center">
              {/* QR icon */}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h6.75v6.75H3V4.5zM14.25 4.5H21v6.75h-6.75V4.5zM3 14.25h6.75V21H3v-6.75zM14.25 14.25H21V21h-6.75v-6.75zM14.25 14.25h.008v.008h-.008v-.008zM17.625 17.625h.008v.008h-.008v-.008zM17.625 20.25h.008v.008h-.008v-.008zM20.25 17.625h.008v.008h-.008v-.008z" />
              </svg>
            </span>
            <span>右下角扫码继续在手机读</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="shrink-0 mt-0.5 w-4 h-4 rounded-sm bg-cinnabar/10 text-cinnabar flex items-center justify-center">
              {/* 时钟/继续 icon */}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
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