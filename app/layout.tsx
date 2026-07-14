import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/react';
import { inter } from './fonts';
import { AsyncFontCss } from '@/components/AsyncFontCss';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ReadingProgress from '@/components/ReadingProgress';
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar';
import InstallPrompt from '@/components/InstallPrompt';
import OnboardingBubble from '@/components/OnboardingBubble';
import ThemeInitScript from '@/components/ThemeInitScript';
import ReadingPrefsScript from '@/components/ReadingPrefsScript';
import KeyboardShortcuts from '@/components/KeyboardShortcuts';
import ReadingPrefs from '@/components/ReadingPrefs';
import PageTransition from '@/components/PageTransition';
import SelectionToolbar from '@/components/SelectionToolbar';
import SectionErrorBoundary from '@/components/SectionErrorBoundary';
import ScrollToTop from '@/components/ScrollToTop';
import MobileQRButton from '@/components/MobileQRButton';
import NetworkBanner from '@/components/NetworkBanner';
import { getSearchData } from '@/lib/search';
import { SITE_URL } from '@/lib/site-config';

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
  metadataBase: new URL(SITE_URL + '/'),
  title: '读通鉴 — 把资治通鉴讲成你听得懂的故事',
  description: '我们用 AI 把司马光写给皇帝的这部书,翻译成当代人能读懂、能用上的东西。资治通鉴不只是历史,它是 1362 年里所有关键决策的复盘。',
  keywords: ['资治通鉴', '历史', 'AI 解读', '司马光', '古代史', '管理智慧'],
  authors: [{ name: '读通鉴 · 主编 Jason' }],
  applicationName: '读通鉴',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: '读通鉴',
    // iOS PWA standalone 模式:状态栏透明 + 白色文字,适配 dark mode header
    statusBarStyle: 'black-translucent',
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
        { url: `${SITE_URL}/feed.xml`, title: '读通鉴 RSS' },
      ],
    },
    canonical: SITE_URL,
  },
  // 站长平台验证 — GSC + 百度(部署后填入 token,留空字符串也行)
  // 百度: 站长平台 → 站点管理 → 验证网站 → HTML 标签验证 → 复制 content 值
  // Google: Search Console → 添加资源 → URL 前缀 → HTML 标签 → 复制 content 值
  verification: {
    // google: 'your-gsc-token',
    // baidu: 'your-baidu-token',
  },
  openGraph: {
    title: '读通鉴 — 把资治通鉴讲成你听得懂的故事',
    description: '用 AI 重读 1362 年。每周一篇深度解读。',
    type: 'website',
    locale: 'zh_CN',
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
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
        {/* 阅读偏好脚本 — 同步应用字号/行高/字体到 <html>,防正文区「瞬变」 */}
        <ReadingPrefsScript />
        {/* 字体 preconnect — 提前建立 TCP,消除 DNS 解析延迟 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        {/* 字体 stylesheet 异步加载
            渲染时 media="print"(不阻塞屏幕),客户端 mount 后切到 media="all"
            Lighthouse mobile 慢 4G 下 Google Fonts CSS 121KB 耗时 17s+,异步后不影响首屏
            LXGW WenKai 用单一 lxgwwenkaiscreen.css(873 行,0 @import,97 unicode-range 拆分)
            跳过 style.css 的 5-@import 链(慢 4G 串行 5s+) */}
        <AsyncFontCss href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;600;700&display=swap" />
        <AsyncFontCss href="https://cdn.jsdelivr.net/npm/lxgw-wenkai-screen-webfont@1.7.0/lxgwwenkaiscreen.css" />
        {/* iOS PWA 适配 */}
        <meta name="mobile-web-app-capable" content="yes" />
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
        {/* Skip-links — a11y:键盘 Tab 第一个元素,跳到主内容或页脚 */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:bg-cinnabar focus:text-paper focus:text-sm focus:font-medium focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-cinnabar focus:ring-offset-2 focus:ring-offset-paper"
        >
          跳到主内容
        </a>
        <a
          href="#site-footer"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-[8.5rem] focus:z-[100] focus:px-4 focus:py-2 focus:bg-cinnabar focus:text-paper focus:text-sm focus:font-medium focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-cinnabar focus:ring-offset-2 focus:ring-offset-paper"
        >
          跳到页脚
        </a>
        <NetworkBanner />
        <ReadingProgress />
        <Header docs={searchDocs} />
        <main id="main-content" className="flex-1" tabIndex={-1}>
          <PageTransition>{children}</PageTransition>
        </main>
        <Footer />
        {/* PWA:Service Worker 注册 + 桌面安装引导 */}
        <ServiceWorkerRegistrar />
        <InstallPrompt />
        <ScrollToTop />
        {/* 全站浮动 QR 按钮 — 桌面端右下角一键扫码继续读 */}
        <MobileQRButton />
        {/* 阅读偏好浮窗 — 只在文章页显示 */}
        <SectionErrorBoundary name="阅读偏好">
          <ReadingPrefs />
        </SectionErrorBoundary>
        {/* 选段引用工具条 — 只在文章页激活 */}
        <SectionErrorBoundary name="选段工具条">
          <SelectionToolbar />
        </SectionErrorBoundary>
        {/* 全局键盘快捷键(? 打开面板,文章页 j/k 翻页,+/- 调字号) */}
        <SectionErrorBoundary name="快捷键面板">
          <KeyboardShortcuts />
        </SectionErrorBoundary>
        {/* 主题切换(在 Header 内部,Header 已是 page-level catch 范围) */}
        {/* 首次访问引导 — 左下角气泡 */}
        <OnboardingBubble articleCount={searchDocs.length} />
        {/* Vercel Analytics — 真实用户数据(转化率/停留/跳出)
            部署到 Vercel 后 Dashboard 自动出数据,无需配置 */}
        <Analytics />
      </body>
    </html>
  );
}