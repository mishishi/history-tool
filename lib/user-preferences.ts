'use client';

// 读通鉴 — 用户阅读偏好(localStorage 包装)
// 一个键:
//   dt-reading-prefs : { fontSize, lineHeight, fontFamily }
//
// 设计要点(跟 user-data.ts 一致):
//   - 'use client' 才 import,Server 端不要碰
//   - localStorage 操作都包 try/catch
//   - 提供订阅机制,ReadingPrefs UI 和 KeyboardShortcuts 能同步状态

export type FontSize = 'sm' | 'base' | 'lg';
export type LineHeight = 'tight' | 'normal' | 'loose';
export type ReadingFont = 'serif' | 'kai' | 'sans';

export interface ReadingPrefs {
  fontSize: FontSize;
  lineHeight: LineHeight;
  fontFamily: ReadingFont;
}

export const DEFAULT_PREFS: ReadingPrefs = {
  fontSize: 'base',
  lineHeight: 'normal',
  fontFamily: 'serif',
};

const KEY = 'dt-reading-prefs';

type Listener = (prefs: ReadingPrefs) => void;
const listeners = new Set<Listener>();

function notify(prefs: ReadingPrefs) {
  listeners.forEach((l) => l(prefs));
}

/** 校验/迁移老数据,缺字段补默认 */
function normalize(raw: unknown): ReadingPrefs {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_PREFS };
  const r = raw as Record<string, unknown>;
  const fontSize: FontSize =
    r.fontSize === 'sm' || r.fontSize === 'base' || r.fontSize === 'lg'
      ? r.fontSize
      : DEFAULT_PREFS.fontSize;
  const lineHeight: LineHeight =
    r.lineHeight === 'tight' || r.lineHeight === 'normal' || r.lineHeight === 'loose'
      ? r.lineHeight
      : DEFAULT_PREFS.lineHeight;
  const fontFamily: ReadingFont =
    r.fontFamily === 'serif' || r.fontFamily === 'kai' || r.fontFamily === 'sans'
      ? r.fontFamily
      : DEFAULT_PREFS.fontFamily;
  return { fontSize, lineHeight, fontFamily };
}

export function getReadingPrefs(): ReadingPrefs {
  if (typeof window === 'undefined') return { ...DEFAULT_PREFS };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    return normalize(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function setReadingPrefs(next: Partial<ReadingPrefs>) {
  if (typeof window === 'undefined') return;
  const current = getReadingPrefs();
  const merged: ReadingPrefs = {
    fontSize: next.fontSize ?? current.fontSize,
    lineHeight: next.lineHeight ?? current.lineHeight,
    fontFamily: next.fontFamily ?? current.fontFamily,
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(merged));
  } catch {
    /* ignore */
  }
  // 同步到 <html> 的 data-*,CSS 变量立即生效
  applyToHtml(merged);
  notify(merged);
}

export function applyToHtml(prefs: ReadingPrefs) {
  if (typeof document === 'undefined') return;
  const html = document.documentElement;
  html.dataset.fontSize = prefs.fontSize;
  html.dataset.lineHeight = prefs.lineHeight;
  html.dataset.fontFamily = prefs.fontFamily;
}

/** 监听偏好变化(供 ReadingPrefs UI + KeyboardShortcuts 同步) */
export function subscribeReadingPrefs(cb: Listener): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

// 字号档位 — 用于 + / - 步进
const FONT_SIZE_ORDER: FontSize[] = ['sm', 'base', 'lg'];

export function bumpFontSize(delta: 1 | -1): ReadingPrefs {
  const current = getReadingPrefs();
  const i = FONT_SIZE_ORDER.indexOf(current.fontSize);
  const next = FONT_SIZE_ORDER[Math.max(0, Math.min(FONT_SIZE_ORDER.length - 1, i + delta))];
  setReadingPrefs({ fontSize: next });
  return getReadingPrefs();
}

export function resetFontSize(): ReadingPrefs {
  setReadingPrefs({ fontSize: DEFAULT_PREFS.fontSize });
  return getReadingPrefs();
}
