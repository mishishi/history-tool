'use client';

import CountUp from './CountUp';

interface Props {
  to: number;
  unit: string;
  desc: string;
}

/**
 * 统计卡片 — 进入视口时数字从 0 涨到 to,1.5s easeOutExpo
 * 用于 about 页"50 篇 / 1362 年 / 1 人 + AI"展示
 */
export default function StatsCard({ to, unit, desc }: Props) {
  return (
    <div className="p-6 bg-paper-card border border-border rounded-sm">
      <div className="flex items-baseline gap-1 mb-2">
        <CountUp
          to={to}
          className="classical text-3xl font-bold text-cinnabar tabular-nums"
        />
        <span className="text-sm text-ink-soft">{unit}</span>
      </div>
      <p className="text-xs text-ink-mute">{desc}</p>
    </div>
  );
}