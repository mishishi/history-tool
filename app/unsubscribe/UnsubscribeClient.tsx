'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function UnsubscribeClient() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const done = searchParams.get('done') === '1';
  const reason = searchParams.get('reason'); // 'invalid' / 'expired'
  const [busy, setBusy] = useState(false);
  const [finished, setFinished] = useState(done);
  const [error, setError] = useState<string | null>(null);

  const onUnsubscribe = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const j = await r.json();
      if (j.ok) {
        setFinished(true);
      } else {
        setError('操作失败,请稍后重试');
      }
    } catch {
      setError('网络异常,请稍后重试');
    } finally {
      setBusy(false);
    }
  };

  if (reason === 'invalid') {
    return (
      <section className="max-w-narrow mx-auto px-6 py-16 md:py-24 text-center">
        <div className="inline-flex w-16 h-16 items-center justify-center bg-gold-soft text-gold-dark rounded-sm mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-ink mb-3">
          链接无效或已过期
        </h1>
        <p className="text-ink-soft mb-8">
          订阅链接只能点一次。你这是重复点击了同一封邮件吗?
        </p>
        <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-cinnabar hover:bg-cinnabar-dark text-paper rounded-md transition-colors font-medium text-sm">
          回首页
        </Link>
      </section>
    );
  }

  if (finished) {
    return (
      <section className="max-w-narrow mx-auto px-6 py-16 md:py-24 text-center">
        <div className="inline-flex w-16 h-16 items-center justify-center bg-cinnabar/10 text-cinnabar rounded-sm mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-ink mb-3">
          好的,你已经走了
        </h1>
        <p className="text-ink-soft mb-8">
          {email && <><code className="px-2 py-1 bg-paper-deep rounded text-sm">{email}</code> 已从订阅列表移除。<br /></>}
          下一封信不会再送到你那里。
        </p>
        <p className="text-sm text-ink-mute mb-8">
          如果哪天反悔,回到首页随便哪篇文章底部都有「订阅」入口。
        </p>
        <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-paper border border-border hover:border-cinnabar text-ink rounded-md transition-colors font-medium text-sm">
          回首页
        </Link>
      </section>
    );
  }

  // 默认 — 没传 email,也不 done
  if (!email) {
    return (
      <section className="max-w-narrow mx-auto px-6 py-16 md:py-24 text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-ink mb-3">
          取消订阅
        </h1>
        <p className="text-ink-soft mb-8">
          找不到要处理的邮箱。每个订阅邮件底部的「不再收到」链接直达这里。
        </p>
        <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-cinnabar hover:bg-cinnabar-dark text-paper rounded-md transition-colors font-medium text-sm">
          回首页
        </Link>
      </section>
    );
  }

  return (
    <section className="max-w-narrow mx-auto px-6 py-16 md:py-24 text-center">
      <h1 className="text-2xl md:text-3xl font-bold text-ink mb-3">
        确认不再收到读通鉴?
      </h1>
      <p className="text-ink-soft mb-2">这个邮箱:</p>
      <p className="mb-8">
        <code className="px-3 py-1.5 bg-paper-deep rounded text-sm text-ink break-all">{email}</code>
      </p>

      {error && (
        <div className="mb-6 p-3 bg-cinnabar-soft border border-cinnabar/30 text-cinnabar text-sm rounded-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={onUnsubscribe}
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-cinnabar hover:bg-cinnabar-dark disabled:bg-ink-mute text-paper rounded-md transition-colors font-medium"
        >
          {busy ? '处理中…' : '是的,不再发送'}
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-paper border border-border text-ink hover:bg-paper-dark rounded-md transition-colors font-medium"
        >
          算了,继续发
        </Link>
      </div>
    </section>
  );
}
