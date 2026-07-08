'use client';

import { useEffect, useState } from 'react';
import SearchModal from './SearchModal';
import type { SearchDoc } from '@/lib/search-client';

interface Props {
  docs: SearchDoc[];
}

export default function SearchButton({ docs }: Props) {
  const [open, setOpen] = useState(false);

  // 全局 Cmd/Ctrl + K 快捷键
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-paper-deep text-ink-soft hover:text-ink transition-colors"
        aria-label="搜索文章"
      >
        <svg
          className="w-4 h-4"
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
        <span className="text-xs">搜索</span>
        <kbd className="hidden lg:inline-flex items-center px-1 py-0.5 ml-1 text-[9px] text-ink-mute border border-border rounded">
          ⌘K
        </kbd>
      </button>

      <SearchModal open={open} onClose={() => setOpen(false)} docs={docs} />
    </>
  );
}
