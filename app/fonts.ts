import { Inter } from 'next/font/google';

/**
 * 字体策略 (2026-07-10 重构)
 *
 * 关键洞察:
 *  - Google Fonts 的 Noto Serif SC 拆成 70+ 个 unicode-range woff2,浏览器**按需下载**(只下命中的 5-10 个)
 *  - LXGW WenKai Screen 在 jsDelivr 同样按 unicode-range 拆分
 *  - 我用 next/font/local 把 2792 chars 集中到 5 个 woff2(每个 500KB)反而要**全下**
 *  - 慢 4G 模拟下 5 个 500KB woff2 串行下载 12-25s,LCP 17s
 *
 * 正确策略:
 *  - 走 Google Fonts 的 unicode-range 拆分(浏览器只下当前页命中的几个 woff2)
 *  - stylesheet 用 `media="print" onload` 异步加载,不阻塞首屏渲染
 *  - preconnect 提前建连,消除 DNS+TCP+TLS 延迟
 *  - font-display=swap 让 FCP 不等字体
 *
 * 字重裁剪:
 *  - Noto Serif SC 用 400;500;600;700(全站 font-bold/font-semibold/font-medium/font-normal 实际用)
 *  - 删 300/900(全网零使用)
 *  - LXGW WenKai 屏幕版(用 400 weight)
 */

export const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});
