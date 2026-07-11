/**
 * ClassicalTextCard — 资治通鉴原文区卡片
 *
 * 体验:
 * - 桌面 (md+): 原文居中显示,hover 任意位置 → 浮窗显示白话翻译
 *   节省空间,默认只看到古文,需要时 hover
 *   翻译区用 cursor-help 提示 + 浮层,内容完整
 * - 移动端 (<md): 翻译区默认展开(hover 不友好)
 *
 * 数据来源:lib/types.ts Classic.classicalText + .background
 */
'use client';

import { useState, useRef, useEffect } from 'react';

interface Props {
  volume: string;
  period: string;
  classicalText: string;
  background?: string;
}

export default function ClassicalTextCard({ volume, period, classicalText, background }: Props) {
  const [showTip, setShowTip] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tipPos, setTipPos] = useState<{ top: number; left: number } | null>(null);

  // hover 时计算浮窗位置(原文区下方,居中)
  useEffect(() => {
    if (showTip && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTipPos({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + rect.width / 2 + window.scrollX,
      });
    }
  }, [showTip]);

  if (!background) {
    // 没有白话翻译就只显示原文(老数据兼容)
    return (
      <div className="bg-paper-card border border-border rounded-sm p-6 md:p-8 shadow-sm">
        <div className="text-center mb-5">
          <span className="text-[10px] text-ink-mute tracking-[0.3em] uppercase">
            资治通鉴 · {volume} · {period}
          </span>
        </div>
        <blockquote className="classical text-base md:text-lg text-ink leading-loose text-center py-2">
          「{classicalText.trim()}」
        </blockquote>
      </div>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        className="bg-paper-card border border-border rounded-sm p-6 md:p-8 shadow-sm relative"
      >
        <div className="text-center mb-5">
          <span className="text-[10px] text-ink-mute tracking-[0.3em] uppercase">
            资治通鉴 · {volume} · {period}
          </span>
        </div>

        {/* 原文 — desktop hover 触发注脚 */}
        <blockquote
          className="hidden md:block classical text-base md:text-lg text-ink leading-loose text-center py-2 cursor-help transition-colors hover:text-cinnabar-dark"
          onMouseEnter={() => setShowTip(true)}
          onMouseLeave={() => setShowTip(false)}
          onFocus={() => setShowTip(true)}
          onBlur={() => setShowTip(false)}
          tabIndex={0}
          aria-describedby="classical-translation"
        >
          「{classicalText.trim()}」
        </blockquote>

        {/* 原文 — mobile 直接展开 */}
        <blockquote className="md:hidden classical text-base text-ink leading-loose text-center py-2">
          「{classicalText.trim()}」
        </blockquote>

        {/* hover 提示标(仅 desktop) */}
        <div className="hidden md:flex items-center justify-center mt-3 text-[10px] text-ink-mute tracking-widest uppercase opacity-70">
          <span className="inline-flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            悬停查看白话翻译
          </span>
        </div>

        {/* 移动端 — 直接展开翻译 */}
        <div className="md:hidden mt-5 pt-5 border-t border-border-soft">
          <div className="text-[11px] text-gold-dark classical tracking-widest uppercase mb-2 text-center">
            历 史 背 景
          </div>
          <div className="text-sm text-ink-soft leading-relaxed text-center max-w-xl mx-auto whitespace-pre-line">
            {background.trim()}
          </div>
        </div>
      </div>

      {/* Desktop hover 浮窗 */}
      {showTip && tipPos && (
        <div
          id="classical-translation"
          role="tooltip"
          className="hidden md:block fixed z-50 w-[min(560px,calc(100vw-2rem))] -translate-x-1/2 pointer-events-none"
          style={{ top: tipPos.top, left: tipPos.left }}
        >
          <div className="bg-paper-card border-2 border-gold rounded-sm p-5 shadow-xl">
            <div className="text-[11px] text-gold-dark classical tracking-widest uppercase mb-2">
              历 史 背 景 · 白话翻译
            </div>
            <div className="text-sm text-ink leading-relaxed whitespace-pre-line">
              {background.trim()}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
