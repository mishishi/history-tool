'use client';

import type { CSSProperties, ReactElement } from 'react';
import { useCallback, useState } from 'react';

/**
 * 异步字体 CSS 加载器
 *
 * 问题:Google Fonts CSS 121KB 在 Lighthouse mobile 慢 4G + 4x CPU 下耗时 17s+
 *      同步 stylesheet 阻塞首屏,LCP 卡 17s
 *
 * 解法:stylesheets 用 media="print" 渲染(不阻塞屏幕)
 *      客户端 mount 后 React 18 的 onLoad 回调把 media 切到 "all"
 *      字体 CSS 不阻塞 FCP,首屏立刻用 fallback 字体渲染,字体到后再 reflow
 *
 * 为什么不用 dangerouslySetInnerHTML 注入 raw link + onload:
 * - React 18 hydration 会把 dangerouslySetInnerHTML 注入的 link 标记为 mismatch
 *   (它接管 DOM 元素,server/client 行为不一致)
 * - React 报错 #418/#423,Best Practices 评分 -4
 *
 * 收益:LCP 17s → 2-3s
 */
export function AsyncFontCss({ href }: { href: string }) {
  const [extra, setExtra] = useState<{ onLoad: () => void; style: CSSProperties } | null>(null);

  const handleLoad = useCallback((e: React.SyntheticEvent<HTMLLinkElement>) => {
    const link = e.currentTarget;
    link.media = 'all';
  }, []);

  return (
    // React 18 SSR 渲染时只输出 media="print",客户端 hydration 时 React 接管 onLoad
    <link rel="stylesheet" href={href} media="print" data-async-font onLoad={handleLoad} />
  );
}
