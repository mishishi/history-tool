'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { searchDocs, type SearchDoc, type ScoredDoc } from '@/lib/search-client';
import { highlightMatch } from '@/lib/highlight';
import { getRecent, getProgress, type RecentItem } from '@/lib/user-data';

interface Props {
  open: boolean;
  onClose: () => void;
  docs: SearchDoc[];
}

/** 把 recents(只有 slug)映射回完整文章 meta,并附进度 */
interface EnrichedRecent {
  slug: string;
  ts: number;
  doc: SearchDoc;
  progress: number;
}

export default function SearchModal({ open, onClose, docs }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ScoredDoc[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [recents, setRecents] = useState<EnrichedRecent[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Esc 关闭
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // 打开时聚焦 + 重置
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setQuery('');
      setActiveIdx(0);
    }
  }, [open]);

  // 加载最近浏览(只在 modal 打开时拉一次)
  useEffect(() => {
    if (!open) return;
    const raw: RecentItem[] = getRecent();
    // 按 ts desc,取前 5
    const enriched = raw
      .slice()
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 5)
      .map((r): EnrichedRecent | null => {
        const doc = docs.find((d) => d.slug === r.slug);
        if (!doc) return null;
        return { ...r, doc, progress: getProgress(r.slug) };
      })
      .filter((x): x is EnrichedRecent => x !== null);
    setRecents(enriched);
  }, [open, docs]);

  // 搜索
  useEffect(() => {
    setResults(searchDocs(docs, query, 8));
    setActiveIdx(0);
  }, [query, docs]);

  // 键盘导航 — 列表元素总数随 query 变化(搜索结果 vs recents)
  const listLength = query.trim() ? results.length : recents.length;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, listLength - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (query.trim() && results[activeIdx]) {
        router.push(`/article/${results[activeIdx].slug}`);
        onClose();
      } else if (!query.trim() && recents[activeIdx]) {
        router.push(`/article/${recents[activeIdx].slug}`);
        onClose();
      }
    }
  };

  if (!open) return null;

  const isSearching = query.trim().length > 0;

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="fixed left-1/2 top-[10vh] -translate-x-1/2 z-[70] w-[92vw] max-w-2xl bg-paper-card border border-border rounded-sm shadow-2xl"
        role="dialog"
        aria-label="搜索文章"
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border-soft">
          <svg
            className="w-5 h-5 text-ink-soft shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="搜索 50 篇文章:标题、人物、朝代、关键字…"
            className="flex-1 bg-transparent outline-none text-base text-ink placeholder:text-ink-mute"
          />
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] text-ink-mute border border-border rounded">
            ESC
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {/* 搜索无结果 */}
          {isSearching && results.length === 0 && (
            <div className="px-5 py-12 text-center text-sm text-ink-mute">
              没有匹配「{query}」的文章
            </div>
          )}

          {/* 搜索结果 */}
          {isSearching && results.length > 0 && (
            <ul className="py-2">
              {results.map((r, i) => (
                <li key={r.slug}>
                  <button
                    onClick={() => {
                      router.push(`/article/${r.slug}`);
                      onClose();
                    }}
                    onMouseEnter={() => setActiveIdx(i)}
                    className={`w-full text-left px-5 py-3 flex items-start gap-3 transition-colors ${
                      i === activeIdx
                        ? 'bg-cinnabar/8 border-l-2 border-cinnabar'
                        : 'border-l-2 border-transparent'
                    }`}
                  >
                    <div className="shrink-0 mt-1 px-1.5 py-0.5 text-[10px] text-cinnabar border border-cinnabar/40 rounded">
                      {r.dynasty}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-ink leading-snug truncate">
                        {highlightMatch(r.title, query)}
                      </div>
                      {r.subtitle && (
                        <div className="mt-1 text-xs text-ink-soft line-clamp-1">
                          {highlightMatch(r.subtitle, query)}
                        </div>
                      )}
                      <div className="mt-1 text-[10px] text-ink-mute">
                        第 {r.episode} 期 · {r.dynasty}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* 空查询 + 有 recents — 显示「最近浏览 / 继续阅读」 */}
          {!isSearching && recents.length > 0 && (
            <div className="py-2">
              <div className="px-5 pt-3 pb-1 text-[10px] text-ink-mute tracking-[0.3em] uppercase">
                继 续 阅 读
              </div>
              <ul>
                {recents.map((r, i) => (
                  <li key={r.slug}>
                    <button
                      onClick={() => {
                        router.push(`/article/${r.slug}`);
                        onClose();
                      }}
                      onMouseEnter={() => setActiveIdx(i)}
                      className={`w-full text-left px-5 py-3 flex items-start gap-3 transition-colors ${
                        i === activeIdx
                          ? 'bg-cinnabar/8 border-l-2 border-cinnabar'
                          : 'border-l-2 border-transparent'
                      }`}
                    >
                      <div className="shrink-0 mt-1 px-1.5 py-0.5 text-[10px] text-gold-dark border border-gold/40 bg-gold/5 rounded">
                        {r.doc.dynasty}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-ink leading-snug truncate">
                          {r.doc.title}
                        </div>
                        {/* 进度条 */}
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="flex-1 h-1 bg-paper-deep rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-cinnabar to-gold rounded-full"
                              style={{ width: `${r.progress}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-ink-mute font-variant-numeric tabular-nums">
                            {r.progress >= 95 ? '已读完' : `${Math.round(r.progress)}%`}
                          </span>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>

              {/* 分隔 + 提示 */}
              <div className="mx-5 my-3 border-t border-border-soft" />
              <div className="px-5 pb-2 text-xs text-ink-mute leading-relaxed">
                <div className="mb-2 text-[10px] uppercase tracking-[0.3em]">提示</div>
                <ul className="space-y-1">
                  <li>· 输入关键字搜索 50 篇文章</li>
                  <li>· 按 ↑↓ 选择,Enter 打开,ESC 关闭</li>
                </ul>
              </div>
            </div>
          )}

          {/* 空查询 + 无 recents — 只显示提示 */}
          {!isSearching && recents.length === 0 && (
            <div className="px-5 py-8 text-sm text-ink-soft">
              <div className="mb-3 text-xs text-ink-mute uppercase tracking-wider">提示</div>
              <ul className="space-y-2">
                <li>· 输入「长征」「商鞅」「贞观」等关键字试试</li>
                <li>· 输入「唐」「宋」按朝代筛选</li>
                <li>
                  · 按{' '}
                  <kbd className="px-1 border border-border rounded text-[10px]">↑</kbd>{' '}
                  <kbd className="px-1 border border-border rounded text-[10px]">↓</kbd>{' '}
                  选择,{' '}
                  <kbd className="px-1 border border-border rounded text-[10px]">Enter</kbd>{' '}
                  打开
                </li>
              </ul>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-2.5 border-t border-border-soft text-[10px] text-ink-mute">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1 border border-border rounded">↑↓</kbd> 选择
            </span>
            <span>
              <kbd className="px-1 border border-border rounded">Enter</kbd> 打开
            </span>
            <span>
              <kbd className="px-1 border border-border rounded">ESC</kbd> 关闭
            </span>
          </div>
          <div>读通鉴 · 50 篇</div>
        </div>
      </div>
    </>
  );
}