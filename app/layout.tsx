import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: '读通鉴 — 把资治通鉴讲成你听得懂的故事',
  description: '我们用 AI 把司马光写给皇帝的这部书,翻译成当代人能读懂、能用上的东西。资治通鉴不只是历史,它是 1362 年里所有关键决策的复盘。',
  keywords: ['资治通鉴', '历史', 'AI 解读', '司马光', '古代史', '管理智慧'],
  authors: [{ name: '读通鉴 · 主编 Jason' }],
  openGraph: {
    title: '读通鉴 — 把资治通鉴讲成你听得懂的故事',
    description: '用 AI 重读 1362 年。每周一篇深度解读。',
    type: 'website',
    locale: 'zh_CN',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="pattern-bg min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}