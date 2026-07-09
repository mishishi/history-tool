'use client';

import { useEffect, useState } from 'react';

/**
 * SW 注册 + 版本更新提示
 * - 新 SW 激活时**不立即 reload**(用户可能正在阅读长文,读到一半被刷会丢进度)
 * - 派发 sw-updated 事件 + 内部显示底部 banner
 * - 用户点「立即刷新」才 reload,否则下次访问自然用新 SW
 */
export default function ServiceWorkerRegistrar() {
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        // 已有 waiting 的新 SW(用户从其他 tab 切回时可能触发)
        if (reg.waiting) {
          setUpdated(true);
          window.dispatchEvent(new CustomEvent('sw-updated'));
        }

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'activated' &&
              navigator.serviceWorker.controller
            ) {
              // 新 SW 激活 — 提示用户刷新,不再硬性 reload
              setUpdated(true);
              window.dispatchEvent(new CustomEvent('sw-updated'));
            }
          });
        });
      } catch (err) {
        // SW 注册失败不算致命,只警告
        console.warn('[SW] register failed:', err);
      }
    };

    // 等 window 加载完再注册,避免阻塞首屏
    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register, { once: true });
    }
  }, []);

  if (!updated) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-[55] animate-[slideUp_0.3s_ease-out]"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 6.5rem)' }}
    >
      <div className="bg-ink text-paper px-4 py-3 rounded-md shadow-xl flex items-center gap-3 text-sm">
        <svg className="w-4 h-4 text-cinnabar shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span className="flex-1">新版本已就绪,刷新查看</span>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-3 py-1 bg-cinnabar hover:bg-cinnabar-dark text-paper text-xs rounded-sm font-medium transition-colors"
        >
          刷新
        </button>
        <button
          type="button"
          onClick={() => setUpdated(false)}
          aria-label="稍后再说"
          className="text-paper/70 hover:text-paper text-xs"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
