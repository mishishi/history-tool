'use client';

import { useEffect, useState } from 'react';

/**
 * 全局网络状态 banner
 * - navigator.onLine === false 时,顶部显示「当前离线」
 * - online 事件恢复时,短暂显示「已恢复」绿色 banner 然后消失
 * - 5s 后自动隐藏
 */
export default function NetworkBanner() {
  const [state, setState] = useState<'online' | 'offline' | 'restored'>('online');
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    if (typeof navigator === 'undefined') return;

    // 初始检测
    if (!navigator.onLine) setState('offline');

    const onOffline = () => setState('offline');
    const onOnline = () => {
      setState('restored');
      setShowRestored(true);
      // 2.5s 后切回 online
      setTimeout(() => {
        setShowRestored(false);
        setState('online');
      }, 2500);
    };

    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);

    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  if (state === 'online') return null;

  if (state === 'offline') {
    return (
      <div
        role="status"
        aria-live="polite"
        // z-40 放在 modal(SearchModal z-60, ArticleToc drawer z-70, InstallPrompt z-60)下面,避免挡住 modal
        className="fixed top-0 left-0 right-0 z-40 bg-cinnabar text-paper px-4 py-2.5 text-xs md:text-sm text-center shadow-md flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728M5.636 18.364a9 9 0 010-12.728M12 9v4m0 4h.01" />
        </svg>
        <span>
          <strong>当前离线</strong> · 部分功能不可用,已打开的页面仍可阅读
        </span>
      </div>
    );
  }

  // restored
  if (showRestored) {
    return (
      <div
        role="status"
        aria-live="polite"
        // z-40 同上,不让 banner 盖住 modal
        className="fixed top-0 left-0 right-0 z-40 bg-cinnabar text-paper px-4 py-2 text-xs md:text-sm text-center shadow-md flex items-center justify-center gap-2 fade-in-up"
      >
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span>网络已恢复</span>
      </div>
    );
  }

  return null;
}