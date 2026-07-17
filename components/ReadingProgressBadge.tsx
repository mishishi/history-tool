'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PROGRESS_PREFIX } from '@/lib/user-data';
import { subscribe } from '@/lib/user-data';

interface Props {
  /** 全站文章总数(从 getAllArticles().length 来) */
  total: number;
}

/**
 * 已读阈值 — 用户决策 (2026-07-17)
 *
 * ≥80% 算"已读"——最宽容的算法。
 * 理由:用户表示想"鼓励读比完全没读强",所以不卡"必须滚到底+停留 1s"。
 * ArticleCompleteToast 的 100% 阈值保留(那是"完成 toast"的强信号);
 * 这里的"已读"是一个更软的"你大致过了一遍"信号。
 *
 * 跟 ArticleCard 的 ✓ 角标(95%)区分:
 * - 95%:卡片视觉,严格(让 ✓ 有分量)
 * - 80%:Header 计数,宽容(让数字好看)
 */
const READ_THRESHOLD = 80;

export default function ReadingProgressBadge({ total }: Props) {
  const [count, setCount] = useState(0);

  // 扫描 localStorage 找所有 dt-progress-* 键,数满足阈值的
  const refresh = () => {
    if (typeof window === 'undefined') return;
    let n = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith(PROGRESS_PREFIX)) continue;
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const pct = Number(raw);
        if (Number.isFinite(pct) && pct >= READ_THRESHOLD) n++;
      }
    } catch {
      /* 隐私模式 / 容量超限 → 当 0 篇处理 */
    }
    setCount(n);
  };

  useEffect(() => {
    refresh();
    // 订阅 user-data 变化(其他组件写进度时同步)
    return subscribe(refresh);
  }, []);

  // 0 篇已读不显示(避免"已读 0/183"打击感)
  if (count === 0) return null;

  const pct = total > 0 ? Math.min(100, Math.round((count / total) * 100)) : 0;

  return (
    <Link
      href="/archive"
      aria-label={`已读 ${count} 篇,共 ${total} 篇`}
      title={`已读 ${count} / ${total} 篇 · ${pct}%`}
      className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm border border-border hover:border-cinnabar hover:bg-cinnabar/5 transition-colors"
    >
      <svg
        className="w-4 h-4 text-cinnabar"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
      <span className="text-xs font-medium text-ink-soft group-hover:text-cinnabar tabular-nums transition-colors">
        <span className="text-cinnabar font-semibold">{count}</span>
        <span className="text-ink-mute"> / {total}</span>
      </span>
    </Link>
  );
}
