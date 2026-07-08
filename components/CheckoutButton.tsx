'use client';

import { useState } from 'react';

export default function CheckoutButton({
  plan = 'single',
  label = '试读一篇',
  variant = 'outline',
}: {
  plan?: 'single';
  label?: string;
  variant?: 'outline' | 'solid';
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onClick = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const j = await r.json();
      if (!j.ok || !j.url) {
        setErr(j.error || '暂时付不了,稍后再试');
        setBusy(false);
        return;
      }
      window.location.href = j.url;
    } catch {
      setErr('网络异常,请稍后重试');
      setBusy(false);
    }
  };

  const base =
    'w-full py-3 rounded-md transition-colors font-medium text-sm flex items-center justify-center gap-2';
  const style =
    variant === 'solid'
      ? 'bg-cinnabar hover:bg-cinnabar-dark text-paper shadow-md'
      : 'border border-border hover:border-cinnabar text-ink hover:text-cinnabar';

  return (
    <div className="w-full">
      <button
        onClick={onClick}
        disabled={busy}
        className={`${base} ${style} ${busy ? 'opacity-60 cursor-wait' : ''}`}
      >
        {busy ? '正在跳到 Stripe…' : label}
      </button>
      {err && (
        <p className="mt-2 text-xs text-cinnabar text-center">{err}</p>
      )}
    </div>
  );
}
