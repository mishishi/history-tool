'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Seal from '@/components/Seal';
import { SUPPORT_EMAIL } from '@/lib/site-config';

/**
 * 全局错误兜底(Next.js App Router)
 * - 任何页面渲染抛错时,显示这个 fallback
 * - 提供 reset 重试 + 回到首页两个出口
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 生产环境可以上报到 Sentry 等监控
    console.error('[du-tongjian] 页面渲染错误:', error);
  }, [error]);

  return (
    <section className="max-w-narrow mx-auto px-6 py-16 md:py-24 text-center">
      {/* 期刊式顶部装饰 */}
      <div className="hero-rule mb-5"></div>
      <div className="hero-episode mb-8">DU TONGJIAN · 提 醒</div>

      {/* 大字号 + 朱红印章 */}
      <div className="relative inline-block mb-8">
        <div className="text-[120px] md:text-[180px] font-bold text-cinnabar leading-none tracking-tight classical">
          翻 车
        </div>
        <div className="absolute -top-3 -right-3 md:-top-4 md:-right-4">
          <Seal>已 救</Seal>
        </div>
      </div>

      <h1 className="text-2xl md:text-3xl font-bold text-ink mb-4 leading-tight">
        这一卷,翻散架了
      </h1>
      <p className="classical text-base md:text-lg text-ink-soft leading-relaxed mb-10 max-w-xl mx-auto">
        「人有旦夕祸福,<br />
        月有阴晴圆缺。」<br />
        <span className="text-sm text-ink-mute not-italic">—— 苏轼 · 水调歌头</span>
      </p>

      {/* 错误信息(开发模式可见) */}
      {error.digest && (
        <div className="mb-8 px-4 py-2 inline-block bg-paper-deep border border-border rounded-sm text-xs text-ink-mute font-mono">
          错误标识: {error.digest}
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-6 py-3 bg-cinnabar hover:bg-cinnabar-dark text-paper rounded-md transition-all hover:shadow-lg font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>重试一次</span>
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-paper-card border border-border hover:border-cinnabar text-ink rounded-md transition-all font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>回到首页</span>
        </Link>
      </div>

      {/* 底部细金线 + 提示 */}
      <div className="hero-rule mb-6"></div>
      <p className="text-xs text-ink-mute leading-relaxed max-w-md mx-auto">
        如果一直看到这个页面,可能是我们的锅 — 麻烦到{' '}
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="text-cinnabar hover:underline"
        >
          {SUPPORT_EMAIL}
        </a>{' '}
        邮件告知,我们会尽快修复。
      </p>
    </section>
  );
}