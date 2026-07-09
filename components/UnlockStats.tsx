'use client';

import CountUp from './CountUp';
import { MARKETING_STATS } from '@/lib/site-config';

/**
 * unlock 页底部"信任标识"区 — 4 个数字接入 CountUp
 * 数字从 lib/site-config 的 MARKETING_STATS 取
 *
 * 注:已发布深度解读数字从父组件 server 注入为 prop,避免 client component
 * 引入 lib/articles(用了 node:fs,server-only)破坏 build
 */
export default function UnlockStats({ articleCount }: { articleCount: number }) {
  return (
    <div className="grid md:grid-cols-4 gap-8 text-center">
      <div>
        <div className="text-3xl font-bold text-cinnabar mb-2">
          <CountUp
            to={MARKETING_STATS.subscribers}
            suffix="+"
            className="tabular-nums"
          />
        </div>
        <div className="text-xs text-ink-soft">订阅用户</div>
      </div>
      <div>
        <div className="text-3xl font-bold text-cinnabar mb-2">
          <CountUp to={articleCount} className="tabular-nums" />
        </div>
        <div className="text-xs text-ink-soft">已发布深度解读</div>
      </div>
      <div>
        <div className="text-3xl font-bold text-cinnabar mb-2">
          <CountUp to={MARKETING_STATS.figuresCount} className="tabular-nums" />
        </div>
        <div className="text-xs text-ink-soft">人物长卷</div>
      </div>
      <div>
        <div className="text-3xl font-bold text-cinnabar mb-2">
          <CountUp to={MARKETING_STATS.ratings} decimals={1} className="tabular-nums" />
        </div>
        <div className="text-xs text-ink-soft flex items-center justify-center gap-1">
          ★★★★★ <span className="ml-1">用户评分</span>
        </div>
      </div>
    </div>
  );
}