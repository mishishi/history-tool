import { Suspense } from 'react';
import { getAllArticles } from '@/lib/articles';
import SuccessClient from './SuccessClient';

export const metadata = {
  title: '订阅成功 · 读通鉴',
  description: '感谢支持读通鉴',
  robots: { index: false, follow: false },
};

export default function UnlockSuccessPage() {
  const articleCount = getAllArticles().length;
  return (
    <Suspense
      fallback={
        <section className="max-w-narrow mx-auto px-6 py-16 text-center">
          <p className="text-ink-mute">加载中…</p>
        </section>
      }
    >
      <SuccessClient articleCount={articleCount} />
    </Suspense>
  );
}
