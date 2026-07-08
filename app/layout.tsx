import type { Metadata, Viewport } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ReadingProgress from '@/components/ReadingProgress';
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar';
import InstallPrompt from '@/components/InstallPrompt';
import { getSearchData } from '@/lib/search';

// Next 14 要求 themeColor 在 viewport export 里
export const viewport: Viewport = {
  themeColor: '#B23A3A',
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
    <html lang="zh-CN">
      <head>
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
        <ReadingProgress />
        <Header docs={searchDocs} />
        <main className="flex-1">{children}</main>
        <Footer />
        {/* PWA:Service Worker 注册 + 桌面安装引导 */}
        <ServiceWorkerRegistrar />
        <InstallPrompt />
      </body>
    </html>
  );
}