'use client';

import { useState } from 'react';

type Status = 'idle' | 'submitting' | 'sent' | 'error';

export default function SubscribeForm() {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(''); // honeypot
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string>('');

  const validate = (): string | null => {
    const v = email.trim();
    if (!v) return '邮箱不能为空';
    // 简单 email 校验,不依赖 zod 在客户端
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return '邮箱格式不对';
    if (!consent) return '请同意隐私条款后再提交';
    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'submitting') return;

    const err = validate();
    if (err) {
      setStatus('error');
      setMessage(err);
      return;
    }

    setStatus('submitting');
    setMessage('');

    try {
      const r = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), website, consent }),
      });
      const j = await r.json();
      if (r.ok && j.ok) {
        setStatus('sent');
        setMessage(`确认邮件已发到 ${email.trim()}。点里面的链接就订阅成功。`);
        setEmail('');
        setConsent(false);
      } else if (r.status === 409) {
        setStatus('error');
        setMessage('这个邮箱已经订阅过了,不用重复。');
      } else if (r.status === 429) {
        setStatus('error');
        setMessage(j.error || '请求过于频繁,请稍后再试');
      } else {
        setStatus('error');
        setMessage(j.error || '提交失败,请稍后再试');
      }
    } catch {
      setStatus('error');
      setMessage('网络异常,请检查连接后重试');
    }
  };

  if (status === 'sent') {
    return (
      <div className="p-6 bg-cinnabar/5 border border-cinnabar/20 rounded-sm">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-cinnabar text-paper rounded-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-ink mb-1">检查你的邮箱 📬</h4>
            <p className="text-sm text-ink-soft leading-relaxed">{message}</p>
            <p className="text-xs text-ink-mute mt-3">
              没收到?看看垃圾箱,或者等几分钟后重新提交。
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4"
      noValidate
    >
      <div>
        <label htmlFor="subscribe-email" className="block text-sm font-medium text-ink mb-2">
          邮箱地址
        </label>
        <input
          id="subscribe-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === 'error') setStatus('idle');
          }}
          placeholder="you@example.com"
          className="w-full px-4 py-3 bg-paper-card border border-border rounded-md text-ink placeholder:text-ink-mute focus:outline-none focus:border-cinnabar focus:ring-2 focus:ring-cinnabar/20 transition-colors"
        />
      </div>

      {/* honeypot — 隐藏字段,肉眼看不到 */}
      <div className="absolute opacity-0 pointer-events-none -z-10" aria-hidden="true">
        <label>
          如果你不是机器人请留空
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </div>

      <label className="flex items-start gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => {
            setConsent(e.target.checked);
            if (status === 'error') setStatus('idle');
          }}
          className="mt-1 w-4 h-4 accent-cinnabar shrink-0"
        />
        <span className="text-sm text-ink-soft leading-relaxed select-none">
          我同意读通鉴把我输入的邮箱用于每周推送解读文章。每封信底部都有「不再收到」,随时能退订。
        </span>
      </label>

      {status === 'error' && message && (
        <div className="p-3 bg-cinnabar-soft border border-cinnabar/30 text-cinnabar text-sm rounded-sm">
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-cinnabar hover:bg-cinnabar-dark disabled:bg-ink-mute text-paper rounded-md transition-colors font-medium"
      >
        {status === 'submitting' ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            提交中…
          </>
        ) : (
          <>
            订阅每周精读
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </>
        )}
      </button>
    </form>
  );
}
