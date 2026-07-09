'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type ThemeMode = 'auto' | 'light' | 'dark';
type ResolvedTheme = 'light' | 'dark';

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getInitialMode(): ThemeMode {
  if (typeof window === 'undefined') return 'auto';
  try {
    const stored = localStorage.getItem('dt-theme-mode');
    if (stored === 'auto' || stored === 'light' || stored === 'dark') return stored;
  } catch {
    /* ignore */
  }
  return 'auto';
}

/**
 * 应用主题到 <html>:
 * - auto:跟随系统
 * - light/dark:固定
 */
function applyTheme(mode: ThemeMode) {
  const html = document.documentElement;
  const resolved: ResolvedTheme = mode === 'auto' ? getSystemTheme() : mode;
  if (resolved === 'dark') html.classList.add('dark');
  else html.classList.remove('dark');
  // 给 data-theme 给 CSS 用(便于针对 mode/resolved 写样式)
  html.dataset.themeMode = mode;
  html.dataset.themeResolved = resolved;
}

export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>('auto');
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 初始挂载:读 localStorage,应用主题
  useEffect(() => {
    const initial = getInitialMode();
    setMode(initial);
    applyTheme(initial);
    setMounted(true);
  }, []);

  // auto 模式:监听系统主题变化
  useEffect(() => {
    if (!mounted || mode !== 'auto') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('auto');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [mode, mounted]);

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

  const selectMode = useCallback(
    (next: ThemeMode) => {
      setMode(next);
      applyTheme(next);
      try {
        localStorage.setItem('dt-theme-mode', next);
      } catch {
        /* ignore */
      }
      setOpen(false);
    },
    []
  );

  if (!mounted) {
    return (
      <button
        aria-label="切换主题"
        className="w-9 h-9 rounded-md flex items-center justify-center text-ink-soft"
      >
        <span className="w-4 h-4 block" />
      </button>
    );
  }

  // 当前显示的图标:看 resolved
  const resolved: ResolvedTheme = mode === 'auto' ? getSystemTheme() : mode;
  const isDark = resolved === 'dark';

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`切换主题(当前 ${modeLabel(mode)})`}
        aria-expanded={open}
        aria-haspopup="menu"
        title={`主题:${modeLabel(mode)}`}
        className="w-9 h-9 rounded-md flex items-center justify-center text-ink-soft hover:text-cinnabar hover:bg-paper-deep transition-colors"
      >
        {isDark ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="4" />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41m12.73-12.73l-1.41 1.41"
            />
          </svg>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-[180px] bg-paper-card border border-border rounded-sm shadow-xl z-50 fade-in-up py-1.5"
          role="menu"
          aria-label="选择主题"
        >
          <div className="px-3 py-1.5 text-[10px] text-ink-mute tracking-[0.3em] uppercase">
            主 题
          </div>
          <ModeOption
            mode="auto"
            currentMode={mode}
            onSelect={selectMode}
            label="跟随系统"
            desc="系统暗就暗,系统亮就亮"
          />
          <ModeOption
            mode="light"
            currentMode={mode}
            onSelect={selectMode}
            label="始终亮色"
            desc="暖纸 + 朱红"
          />
          <ModeOption
            mode="dark"
            currentMode={mode}
            onSelect={selectMode}
            label="始终暗色"
            desc="黑底 + 提亮朱红"
          />
        </div>
      )}
    </div>
  );
}

function modeLabel(m: ThemeMode): string {
  return m === 'auto' ? '跟随系统' : m === 'dark' ? '暗色' : '亮色';
}

interface ModeOptionProps {
  mode: ThemeMode;
  currentMode: ThemeMode;
  onSelect: (m: ThemeMode) => void;
  label: string;
  desc: string;
}

function ModeOption({ mode, currentMode, onSelect, label, desc }: ModeOptionProps) {
  const active = mode === currentMode;
  return (
    <button
      type="button"
      onClick={() => onSelect(mode)}
      className={`w-full text-left px-3 py-2 flex items-start gap-2.5 transition-colors ${
        active ? 'bg-cinnabar/8 border-l-2 border-cinnabar' : 'border-l-2 border-transparent hover:bg-paper-deep'
      }`}
      role="menuitemradio"
      aria-checked={active}
    >
      <div className={`mt-0.5 w-3.5 h-3.5 rounded-full border-2 shrink-0 ${active ? 'border-cinnabar bg-cinnabar' : 'border-ink-mute'}`}>
        {active && (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-paper" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-ink">{label}</div>
        <div className="text-[10px] text-ink-mute leading-snug">{desc}</div>
      </div>
    </button>
  );
}