'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { searchDocs, type SearchDoc, type ScoredDoc } from '@/lib/search-client';
import { highlightMatch } from '@/lib/highlight';

interface Props {
  open: boolean;
  onClose: () => void;
  docs: SearchDoc[];
}

export default function SearchModal({ open, onClose, docs }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ScoredDoc[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
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

  // 打开时聚焦
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setQuery('');
      setActiveIdx(0);
    }
  }, [open]);

  // 搜索
  useEffect(() => {
    setResults(searchDocs(docs, query, 8));
    setActiveIdx(0);
  }, [query, docs]);

  // 键盘导航
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[activeIdx]) {
      e.preventDefault();
      router.push(`/article/${results[activeIdx].slug}`);
      onClose();
    }
  };

  if (!open) return null;

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
          {query && results.length === 0 && (
            <div className="px-5 py-12 text-center text-sm text-ink-mute">
              没有匹配「{query}」的文章
            </div>
          )}

          {!query && (
            <div className="px-5 py-8 text-sm text-ink-soft">
              <div className="mb-3 text-xs text-ink-mute uppercase tracking-wider">
                提示
              </div>
              <ul className="space-y-2">
                <li>· 输入「长征」「商鞅」「贞观」等关键字试试</li>
                <li>· 输入「唐」「宋」按朝代筛选</li>
                <li>
                  · 按{' '}
                  <kbd className="px-1 border border-border rounded text-[10px]">
                    ↑
                  </kbd>{' '}
                  <kbd className="px-1 border border-border rounded text-[10px]">
                    ↓
                  </kbd>{' '}
                  选择,{' '}
                  <kbd className="px-1 border border-border rounded text-[10px]">
                    Enter
                  </kbd>{' '}
                  打开
                </li>
              </ul>
            </div>
          )}

          {results.length > 0 && (
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
