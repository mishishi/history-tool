'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface VerifyResult {
  ok: boolean;
  paid?: boolean;
  plan?: string | null;
  product?: string | null;
  amount?: number | null;
  currency?: string | null;
  customerEmail?: string | null;
  error?: string;
}

export default function UnlockSuccessClient() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [data, setData] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setData({ ok: false, error: 'no_session' });
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const r = await fetch(`/api/verify-session/${encodeURIComponent(sessionId)}`);
        const j = await r.json();
        setData(j);
      } catch {
        setData({ ok: false, error: 'network' });
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId]);

  if (loading) {
    return (
      <section className="max-w-narrow mx-auto px-6 py-16 text-center">
        <div className="inline-block w-12 h-12 border-4 border-cinnabar/20 border-t-cinnabar rounded-full animate-spin mb-6"></div>
        <h1 className="text-2xl font-semibold text-ink mb-2">正在核对付款…</h1>
        <p className="text-ink-soft">跟 Stripe 拿回执中</p>
      </section>
    );
  }

  if (!data || data.error === 'no_session' || data.error === 'network') {
    return (
      <section className="max-w-narrow mx-auto px-6 py-16 text-center">
        <div className="inline-flex w-16 h-16 items-center justify-center bg-gold-soft text-gold-dark rounded-sm mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-ink mb-3">回执没拿到</h1>
        <p className="text-ink-soft mb-8">
          可能是网络异常。这个页面应该 Stripe 付款成功后自动跳过来。
        </p>
        <Link
          href="/unlock"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-cinnabar hover:bg-cinnabar-dark text-paper rounded-md transition-colors font-medium text-sm"
        >
          回订阅页
        </Link>
      </section>
    );
  }

  if (!data.paid) {
    return (
      <section className="max-w-narrow mx-auto px-6 py-16 text-center">
        <h1 className="text-2xl font-bold text-ink mb-3">付款状态未确认</h1>
        <p className="text-ink-soft mb-8">
          我们没收到 Stripe 的付款确认。如果已经扣款,过几分钟再来这里看看。
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-cinnabar hover:bg-cinnabar-dark text-paper rounded-md transition-colors font-medium text-sm"
        >
          回首页
        </Link>
      </section>
    );
  }

  // paid = true
  const amount = data.amount != null && data.currency ? `${(data.amount / 100).toFixed(2)} ${data.currency.toUpperCase()}` : '';

  return (
    <section className="max-w-narrow mx-auto px-6 py-16 md:py-20">
      <div className="text-center mb-12">
        <div className="inline-flex w-20 h-20 items-center justify-center bg-cinnabar text-paper rounded-sm mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-ink mb-3 leading-tight">
          收到 ✓ 谢谢支持
        </h1>
        <p className="text-ink-soft text-lg">
          {data.customerEmail && (
            <>回执已发到 <code className="px-2 py-1 bg-paper-deep rounded text-sm">{data.customerEmail}</code></>
          )}
          {amount && <> · {amount}</>}
        </p>
      </div>

      {/* 三件小事说明 */}
      <div className="border-t border-border pt-10 mb-10">
        <h2 className="text-lg font-semibold text-ink mb-6 text-center">
          接下来你可以
        </h2>
        <div className="space-y-4">
          {[
            {
              num: '①',
              title: '开始读',
              desc: '选一篇今晚就读,所有 50 篇现已对你永久开放。',
              cta: { href: '/#articles', label: '选一篇开始读' },
            },
            {
              num: '②',
              title: '顺手订邮件',
              desc: '每周三上午 9 点,新解读自动到你邮箱;免费,也能退。',
              cta: { href: '/unlock#newsletter', label: '填邮箱订阅' },
            },
            {
              num: '③',
              title: '有问题找主编',
              desc: '你这次付款的邮件里有一个「回执号」,有问题直接回那封信。',
              cta: null,
            },
          ].map((item) => (
            <div
              key={item.num}
              className="flex gap-4 p-5 bg-paper-card border border-border rounded-sm"
            >
              <div className="shrink-0 text-2xl font-bold text-cinnabar leading-none pt-1">
                {item.num}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-ink mb-1">{item.title}</h3>
                <p className="text-sm text-ink-soft leading-relaxed mb-2">{item.desc}</p>
                {item.cta && (
                  <Link
                    href={item.cta.href}
                    className="inline-flex items-center gap-1 text-sm text-cinnabar hover:text-cinnabar-dark transition-colors font-medium"
                  >
                    {item.cta.label}
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-cinnabar hover:bg-cinnabar-dark text-paper rounded-md transition-colors font-medium"
        >
          回首页
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
