'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getRecent, getProgress, type RecentItem } from '@/lib/user-data';
import type { SearchDoc } from '@/lib/search-client';

interface ContinueReadingButtonProps {
  docs: SearchDoc[];
}

interface EnrichedUnfinished {
  slug: string;
  title: string;
  dynasty: string;
  episode: number;
  progress: number;
  ts: number;
}

/**
 * Header 「继续阅读」入口
 * - 弹下拉 popover,显示最近浏览过且未读完的文章(进度<100)
 * - 按 ts desc 排序,取前 5
 * - 没数据时按钮不显示
 */
export default function ContinueReadingButton({ docs }: ContinueReadingButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<EnrichedUnfinished[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // 计算未读完的文章
  const refresh = () => {
    const recents = getRecent();
    const enriched = recents
      .map((r): EnrichedUnfinished | null => {
        const doc = docs.find((d) => d.slug === r.slug);
        if (!doc) return null;
        const progress = getProgress(r.slug);
        if (progress >= 100 || progress < 5) return null; // 已完成 or 刚点开就忽略
        return {
          slug: r.slug,
          title: doc.title,
          dynasty: doc.dynasty,
          episode: doc.episode,
          progress,
          ts: r.ts,
        };
      })
      .filter((x): x is EnrichedUnfinished => x !== null)
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 5);
    setItems(enriched);
  };

  useEffect(() => {
    refresh();
  }, [docs]);

  // 订阅 user-data 变化(进度 / recent 变了都更新)
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    import('@/lib/user-data').then((mod) => {
      cleanup = mod.subscribe(refresh);
    });
    return () => {
      if (cleanup) cleanup();
    };
  }, [docs]);

  // 点击外部关闭
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    // 延后绑定,避免点击自身时立刻关闭
    const t = setTimeout(() => {
      document.addEventListener('click', handler);
    }, 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener('click', handler);
    };
  }, [open]);

  // Esc 关闭
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  // 没未读完的文章,不显示按钮
  if (items.length === 0) return null;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="继续阅读"
        aria-expanded={open}
        title="继续阅读"
        className="relative p-2 text-ink-soft hover:text-cinnabar transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        {/* 数量徽标 */}
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-cinnabar text-paper text-[9px] font-bold flex items-center justify-center">
          {items.length}
        </span>
      </button>

      {/* Popover */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-[320px] md:w-[360px] bg-paper-card border border-border rounded-sm shadow-2xl overflow-hidden z-50 fade-in-up"
          role="menu"
          aria-label="继续阅读"
        >
          <div className="px-4 py-3 border-b border-border-soft flex items-center justify-between">
            <span className="text-sm font-semibold text-ink">继续阅读</span>
            <span className="text-[10px] text-ink-mute tracking-widest uppercase">
              {items.length} 篇待读
            </span>
          </div>

          <ul className="max-h-[400px] overflow-y-auto">
            {items.map((it) => (
              <li key={it.slug}>
                <button
                  type="button"
                  onClick={() => {
                    router.push(`/article/${it.slug}`);
                    setOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-paper-deep border-b border-border-soft last:border-b-0 transition-colors"
                >
                  <div className="flex items-start gap-2 mb-1.5">
                    <span className="shrink-0 mt-0.5 px-1.5 py-0.5 text-[10px] text-gold-dark border border-gold/40 bg-gold/5 rounded">
                      {it.dynasty}
                    </span>
                    <span className="text-[10px] text-ink-mute shrink-0">第 {it.episode} 期</span>
                  </div>
                  <div className="text-sm font-medium text-ink leading-snug line-clamp-2 mb-2">
                    {it.title}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-paper-deep rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cinnabar to-gold rounded-full transition-[width] duration-300"
                        style={{ width: `${it.progress}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-ink-mute tabular-nums font-medium">
                      {Math.round(it.progress)}%
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>

          <div className="px-4 py-2.5 border-t border-border-soft bg-paper-deep/50">
            <Link
              href="/favorites"
              onClick={() => setOpen(false)}
              className="text-xs text-ink-soft hover:text-cinnabar transition-colors flex items-center justify-center gap-1"
            >
              <span>查看全部收藏</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}