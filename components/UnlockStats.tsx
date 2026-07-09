'use client';

import CountUp from './CountUp';

/**
 * unlock 页底部"信任标识"区 — 4 个数字接入 CountUp
 * 2,800+ 订阅用户 / 12 已发布 / 23 人物长卷 / 4.9 评分
 */
export default function UnlockStats() {
  return (
    <div className="grid md:grid-cols-4 gap-8 text-center">
      <div>
        <div className="text-3xl font-bold text-cinnabar mb-2">
          <CountUp
            to={2800}
            suffix="+"
            className="tabular-nums"
          />
        </div>
        <div className="text-xs text-ink-soft">订阅用户</div>
      </div>
      <div>
        <div className="text-3xl font-bold text-cinnabar mb-2">
          <CountUp to={12} className="tabular-nums" />
        </div>
        <div className="text-xs text-ink-soft">已发布深度解读</div>
      </div>
      <div>
        <div className="text-3xl font-bold text-cinnabar mb-2">
          <CountUp to={23} className="tabular-nums" />
        </div>
        <div className="text-xs text-ink-soft">人物长卷</div>
      </div>
      <div>
        <div className="text-3xl font-bold text-cinnabar mb-2">
          <CountUp to={4.9} decimals={1} className="tabular-nums" />
        </div>
        <div className="text-xs text-ink-soft flex items-center justify-center gap-1">
          ★★★★★ <span className="ml-1">用户评分</span>
        </div>
      </div>
    </div>
  );
}