import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ReadingProgress from '@/components/ReadingProgress';
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar';
import InstallPrompt from '@/components/InstallPrompt';
import OnboardingBubble from '@/components/OnboardingBubble';
import ThemeInitScript from '@/components/ThemeInitScript';
import ScrollToTop from '@/components/ScrollToTop';
import MobileQRButton from '@/components/MobileQRButton';
import NetworkBanner from '@/components/NetworkBanner';
import { getSearchData } from '@/lib/search';

/**
 * 字体优化策略:
 * - Inter(拉丁字符)走 next/font — 自动 host + preload + size-adjust 无 FOIT
 * - Noto Serif SC(中文)走 Google Fonts CDN + preconnect — 文件太大(>10MB),next/font 不友好
 * - LXGW WenKai(中文古典字体)走 jsDelivr CDN + preconnect
 * 效果:首屏 FOIT 0ms(字体文件预下载,首次 paint 已就位)
 */
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

// Next 14 要求 themeColor 在 viewport export 里
export const viewport: Viewport = {
  // iOS 让 env(safe-area-inset-*) 生效必须 viewport-fit=cover
  viewportFit: 'cover',
  // 状态栏颜色按主题切换:light 朱红,dark 黑
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#B23A3A' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5, // a11y — 不要禁用缩放
};

export const metadata: Metadata = {
  metadataBase: new URL('https://history-tool.vercel.app/'),
  title: '读通鉴 — 把资治通鉴讲成你听得懂的故事',
  description: '我们用 AI 把司马光写给皇帝的这部书,翻译成当代人能读懂、能用上的东西。资治通鉴不只是历史,它是 1362 年里所有关键决策的复盘。',
  keywords: ['资治通鉴', '历史', 'AI 解读', '司马光', '古代史', '管理智慧'],
  authors: [{ name: '读通鉴 · 主编 Jason' }],
  applicationName: '读通鉴',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: '读通鉴',
    statusBarStyle: 'default',
    startupImage: '/icons/apple-touch-icon.png',
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: '/icons/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
  alternates: {
    types: {
      'application/rss+xml': [
        { url: 'https://history-tool.vercel.app/feed.xml', title: '读通鉴 RSS' },
      ],
    },
  },
  openGraph: {
    title: '读通鉴 — 把资治通鉴讲成你听得懂的故事',
    description: '用 AI 重读 1362 年。每周一篇深度解读。',
    type: 'website',
    locale: 'zh_CN',
    images: [
      {
        url: 'https://history-tool.vercel.app/opengraph-image',
        width: 1200,
        height: 630,
        alt: '读通鉴 — 用 AI 重读 1362 年',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const searchDocs = getSearchData();
  return (
      <html lang="zh-CN" className={inter.variable}>
      <head>
        {/* 主题脚本必须在第一次 paint 前执行(防暗模式闪烁) */}
        <ThemeInitScript />
        {/* 字体 preconnect — 提前建立 TCP,消除 DNS 解析延迟 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        {/* 字体 stylesheet — 放在 preconnect 之后,优先解析 */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@300;400;500;600;700;900&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/lxgw-wenkai-screen-webfont@1.7.0/style.css"
        />
        {/* iOS PWA 适配 */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="读通鉴" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        {/* Android/Chrome PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#B23A3A" />
        {/* 防止电话号码识别 */}
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="pattern-bg min-h-screen flex flex-col">
        <NetworkBanner />
        <ReadingProgress />
        <Header docs={searchDocs} />
        <main className="flex-1">{children}</main>
        <Footer />
        {/* PWA:Service Worker 注册 + 桌面安装引导 */}
        <ServiceWorkerRegistrar />
        <InstallPrompt />
        <ScrollToTop />
        {/* 全站浮动 QR 按钮 — 桌面端右下角一键扫码继续读 */}
        <MobileQRButton />
        {/* 首次访问引导 — 左下角气泡 */}
        <OnboardingBubble />
      </body>
    </html>
  );
}