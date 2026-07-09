'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Seal from '@/components/Seal';

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
        <div className="hero-rule mb-5"></div>
        <div className="hero-episode mb-8">DU TONGJIAN · 异 常</div>

        <div className="relative inline-block mb-8">
          <div className="text-[110px] md:text-[160px] font-bold text-cinnabar leading-none tracking-tight classical">
            404
          </div>
          <div className="absolute -top-3 -right-3 md:-top-4 md:-right-4">
            <Seal variant="gold">回 执</Seal>
          </div>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-ink mb-3 leading-tight">
          付款回执没拿到
        </h1>
        <p className="text-base text-ink-soft leading-relaxed mb-2 max-w-lg mx-auto">
          这个页面应该由 Stripe 付款成功后自动跳过来。
        </p>
        <p className="text-sm text-ink-mute mb-8 max-w-lg mx-auto">
          可能是网络抽风,或者你没从 Stripe 走完流程。先试试刷新;如果已经扣款,回邮箱找收据。
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-cinnabar hover:bg-cinnabar-dark text-paper rounded-md transition-colors font-medium text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            刷新重试
          </button>
          <Link
            href="/unlock"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-paper-card border border-border hover:border-cinnabar text-ink rounded-md transition-colors font-medium text-sm"
          >
            回订阅页
          </Link>
          <a
            href="mailto:hello@du-tongjian.com"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-paper-card border border-border hover:border-cinnabar text-ink rounded-md transition-colors font-medium text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            联系客服
          </a>
        </div>

        <div className="text-xs text-ink-mute leading-relaxed max-w-md mx-auto bg-paper-deep border border-border-soft rounded-sm p-4">
          <p className="font-medium text-ink mb-1">已经扣款怎么办?</p>
          <p>
            Stripe 会给扣款邮箱发一封收据。回邮件点「回执号」,
            带着那封信联系我们,24 小时内会开通订阅。
          </p>
        </div>
      </section>
    );
  }

  if (!data.paid) {
    return (
      <section className="max-w-narrow mx-auto px-6 py-16 text-center">
        <div className="inline-flex w-16 h-16 items-center justify-center bg-gold-soft text-gold-dark rounded-sm mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-ink mb-3">付款状态未确认</h1>
        <p className="text-ink-soft leading-relaxed mb-2 max-w-md mx-auto">
          我们没收到 Stripe 的付款确认。可能是支付还在处理中。
        </p>
        <p className="text-sm text-ink-mute mb-8 max-w-md mx-auto">
          如果已扣款,过 1-2 分钟再来这里刷一下;或回邮箱找收据。
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-cinnabar hover:bg-cinnabar-dark text-paper rounded-md transition-colors font-medium text-sm"
          >
            刷新查看
          </button>
          <a
            href="mailto:hello@du-tongjian.com"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-paper-card border border-border hover:border-cinnabar text-ink rounded-md transition-colors font-medium text-sm"
          >
            联系客服
          </a>
        </div>
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
