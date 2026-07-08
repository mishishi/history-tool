'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        // SW 更新时,提示用户刷新(或自动激活)
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'activated' &&
              navigator.serviceWorker.controller
            ) {
              // 新 SW 激活了 — 自动刷新页面拿最新内容
              console.log('[SW] New version activated, reloading…');
              window.location.reload();
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

  return null;
}
