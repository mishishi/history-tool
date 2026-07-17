'use client';

// 读通鉴 — 用户本地数据(localStorage 包装)
// 三个键:
//   dt-favorites      : string[]           收藏的 slug 列表
//   dt-progress-<slug>: number (0-100)     单篇文章已读百分比
//   dt-recent         : Array<{slug,ts}>   最近浏览过(用于"继续阅读")
//
// 设计要点:
//   - 全部用 'use client' 才 import,Server 端不要碰
//   - 任意 localStorage 操作都包 try/catch(隐私模式 / 容量超限会抛)
//   - 提供订阅机制:同一页多个组件能同步状态(收藏按钮 + Header 入口)

const FAVORITES_KEY = 'dt-favorites';
const RECENT_KEY = 'dt-recent';
const PROGRESS_PREFIX = 'dt-progress-';

export { PROGRESS_PREFIX, FAVORITES_KEY, RECENT_KEY };

type Listener = () => void;
const listeners = new Set<Listener>();
function notify() {
  listeners.forEach((l) => l());
}

// ---------- Favorites ----------

export function getFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

export function isFavorite(slug: string): boolean {
  return getFavorites().includes(slug);
}

export function toggleFavorite(slug: string): boolean {
  const current = getFavorites();
  const next = current.includes(slug)
    ? current.filter((s) => s !== slug)
    : [...current, slug];
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    notify();
    return next.includes(slug);
  } catch {
    return current.includes(slug);
  }
}

// ---------- Reading progress ----------

export function getProgress(slug: string): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(PROGRESS_PREFIX + slug);
    if (!raw) return 0;
    const n = Number(raw);
    return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0;
  } catch {
    return 0;
  }
}

export function setProgress(slug: string, pct: number) {
  if (typeof window === 'undefined') return;
  // 节流:只有差异够大才写(避免每帧写)
  const prev = getProgress(slug);
  if (Math.abs(prev - pct) < 1 && pct !== 0 && pct !== 100) return;
  try {
    localStorage.setItem(PROGRESS_PREFIX + slug, String(pct));
    // 不 notify,进度条自己知道
  } catch {
    /* ignore */
  }
}

// ---------- Recent(浏览历史) ----------

export interface RecentItem {
  slug: string;
  ts: number;
}

export function getRecent(): RecentItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x) => x && typeof x.slug === 'string' && typeof x.ts === 'number')
      .slice(0, 20);
  } catch {
    return [];
  }
}

export function recordVisit(slug: string) {
  if (typeof window === 'undefined') return;
  try {
    const list = getRecent().filter((x) => x.slug !== slug);
    list.unshift({ slug, ts: Date.now() });
    const trimmed = list.slice(0, 20);
    localStorage.setItem(RECENT_KEY, JSON.stringify(trimmed));
    notify();
  } catch {
    /* ignore */
  }
}

// ---------- Subscribe(多组件同步) ----------

export function subscribe(cb: Listener): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
