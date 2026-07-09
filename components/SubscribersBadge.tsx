'use client';

import CountUp from './CountUp';
import { MARKETING_STATS } from '@/lib/site-config';

/**
 * 订阅用户数 — 数字从 0 涨到 MARKETING_STATS.subscribers,后跟 +
 * 进入视口时触发 1.5s easeOutExpo 动画
 */
export default function SubscribersBadge() {
  return (
    <div className="flex items-center gap-1.5">
      <svg className="w-4 h-4 text-gold" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
      <span>
        <CountUp to={MARKETING_STATS.subscribers} suffix="+" className="tabular-nums font-semibold text-ink-soft" />
        <span className="ml-1">订阅用户</span>
      </span>
    </div>
  );
}