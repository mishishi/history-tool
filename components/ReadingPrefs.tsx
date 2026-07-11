'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  getReadingPrefs,
  setReadingPrefs,
  subscribeReadingPrefs,
  DEFAULT_PREFS,
  type ReadingPrefs as Prefs,
  type FontSize,
  type LineHeight,
  type ReadingFont,
} from '@/lib/user-preferences';

const FONT_SIZE_OPTIONS: { value: FontSize; label: string; char: string; sizeClass: string }[] = [
  { value: 'sm',   label: '小',   char: 'A', sizeClass: 'text-[11px]' },
  { value: 'base', label: '标准', char: 'A', sizeClass: 'text-[14px]' },
  { value: 'lg',   label: '大',   char: 'A', sizeClass: 'text-[17px]' },
];

const LINE_HEIGHT_OPTIONS: { value: LineHeight; label: string }[] = [
  { value: 'tight',  label: '紧凑' },
  { value: 'normal', label: '标准' },
  { value: 'loose',  label: '宽松' },
];

const FONT_OPTIONS: { value: ReadingFont; label: string; sample: string; fontClass: string }[] = [
  { value: 'serif', label: '宋体', sample: '宋', fontClass: 'font-serif' },
  { value: 'kai',   label: '楷体', sample: '楷', fontClass: 'font-kai' },
  { value: 'sans',  label: '黑体', sample: '黑', fontClass: 'font-sans' },
];

/**
 * 阅读偏好浮窗 — 只在文章页显示
 * - 三档字号 / 三档行高 / 三种字体
 * - 偏好写 localStorage,刷新跨会话保留
 * - 位置:右下角 fab-3 层,不和 ScrollToTop (fab-1) / MobileQRButton (fab-2) 抢位
 * - 键盘:快捷键面板里有 `+` / `-` 调字号,这里也展示提示
 */
export default function ReadingPrefs() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 仅在文章页显示 — 其他页面没有正文区,这个 UI 没用
  const isArticlePage = pathname?.startsWith('/article/') ?? false;

  useEffect(() => {
    setMounted(true);
    setPrefs(getReadingPrefs());
    return subscribeReadingPrefs((next) => setPrefs(next));
  }, []);

  // 点击外部关闭
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const t = setTimeout(() => document.addEventListener('click', handler), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener('click', handler);
    };
  }, [open]);

  // Esc 关闭
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (!mounted || !isArticlePage) return null;

  return (
    <div
      ref={containerRef}
      className="fixed right-6 md:right-8 z-40 bottom-fab-3"
    >
      {/* 触发器 — 大写 A 字号按钮 */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="阅读偏好"
        aria-expanded={open}
        aria-haspopup="menu"
        title="阅读偏好"
        className="w-11 h-11 rounded-full bg-paper-card border border-border hover:border-cinnabar text-ink-soft hover:text-cinnabar shadow-lg flex items-center justify-center transition-all hover:shadow-xl"
      >
        <span className="text-[15px] font-bold leading-none serif">A</span>
      </button>

      {/* 面板 — 向上展开,避开 FAB 区 */}
      {open && (
        <div
          role="menu"
          aria-label="阅读偏好"
          className="absolute right-0 bottom-full mb-3 w-[268px] bg-paper-card border border-border rounded-sm shadow-2xl py-3 px-3.5 fade-in-up"
        >
          <PrefRow label="字号" hint="A- / A+ 快捷键">
            {FONT_SIZE_OPTIONS.map((opt) => (
              <SegButton
                key={opt.value}
                active={prefs.fontSize === opt.value}
                onClick={() => setReadingPrefs({ fontSize: opt.value })}
                ariaLabel={`字号 ${opt.label}`}
              >
                <span className={`${opt.sizeClass} font-semibold leading-none`}>{opt.char}</span>
              </SegButton>
            ))}
          </PrefRow>

          <PrefRow label="行高">
            {LINE_HEIGHT_OPTIONS.map((opt) => (
              <SegButton
                key={opt.value}
                active={prefs.lineHeight === opt.value}
                onClick={() => setReadingPrefs({ lineHeight: opt.value })}
                ariaLabel={`行高 ${opt.label}`}
              >
                <span className="text-xs leading-none">{opt.label}</span>
              </SegButton>
            ))}
          </PrefRow>

          <PrefRow label="字体">
            {FONT_OPTIONS.map((opt) => (
              <SegButton
                key={opt.value}
                active={prefs.fontFamily === opt.value}
                onClick={() => setReadingPrefs({ fontFamily: opt.value })}
                ariaLabel={`字体 ${opt.label}`}
              >
                <span className={`${opt.fontClass} text-base leading-none`}>{opt.sample}</span>
              </SegButton>
            ))}
          </PrefRow>

          <div className="mt-3 pt-2.5 border-t border-border-soft text-[10px] text-ink-mute leading-relaxed">
            偏好保存到本机,只影响正文区。<br />
            按 <Kbd>?</Kbd> 看全部快捷键。
          </div>
        </div>
      )}
    </div>
  );
}

function PrefRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[10px] text-ink-mute tracking-[0.25em] uppercase">{label}</span>
        {hint && <span className="text-[9px] text-ink-mute">{hint}</span>}
      </div>
      <div className="grid grid-cols-3 gap-1.5">{children}</div>
    </div>
  );
}

function SegButton({
  active,
  onClick,
  ariaLabel,
  children,
}: {
  active: boolean;
  onClick: () => void;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
      className={
        'h-9 rounded-sm border text-sm flex items-center justify-center transition-colors ' +
        (active
          ? 'bg-cinnabar text-paper border-cinnabar'
          : 'bg-paper text-ink-soft border-border hover:border-cinnabar hover:text-cinnabar')
      }
    >
      {children}
    </button>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="px-1 border border-border rounded text-[10px] font-mono">{children}</kbd>
  );
}
