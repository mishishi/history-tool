import { Suspense } from 'react';
import UnsubscribeClient from './UnsubscribeClient';

export const metadata = {
  title: '取消订阅 · 读通鉴',
  description: '管理读通鉴的邮件订阅',
  robots: { index: false, follow: false },
};

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <section className="max-w-narrow mx-auto px-6 py-16 text-center">
          <p className="text-ink-mute">加载中…</p>
        </section>
      }
    >
      <UnsubscribeClient />
    </Suspense>
  );
}
