'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/**
 * 跨页切换动效 — key={pathname} 强制 children 重挂,触发 .page-enter 动画
 * - layout 顶层组件(Header/Footer/ReadingPrefs/KeyboardShortcuts)不重挂
 * - 只 children 子树(路由内容)重挂,触发 fadeInUp 0.45s
 * - 尊重 prefers-reduced-motion:globals.css 已处理
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  );
}
