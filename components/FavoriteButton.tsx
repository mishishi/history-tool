'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  isFavorite as isFavStorage,
  toggleFavorite,
  subscribe,
} from '@/lib/user-data';

export default function FavoriteButton({ slug, title }: { slug: string; title: string }) {
  const [fav, setFav] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setFav(isFavStorage(slug));
    const unsub = subscribe(() => setFav(isFavStorage(slug)));
    return unsub;
  }, [slug]);

  const onClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const next = toggleFavorite(slug);
      setFav(next);
    },
    [slug]
  );

  // 服务端 / 还没 mount 时不显示,避免水合不一致
  if (!mounted) {
    return (
      <div
        className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm"
        aria-hidden="true"
      >
        <span className="w-4 h-4 block" />
        <span>收藏</span>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      aria-label={fav ? '从收藏移除' : '加入收藏文章'}
      aria-pressed={fav}
      title={fav ? '已收藏' : '加入收藏'}
      className={
        'inline-flex items-center gap-2 px-4 py-2 rounded-md border text-sm transition-all ' +
        (fav
          ? 'bg-cinnabar/10 border-cinnabar text-cinnabar hover:bg-cinnabar/15'
          : 'border-border text-ink-soft hover:border-cinnabar hover:text-cinnabar')
      }
    >
      <svg
        className="w-4 h-4"
        fill={fav ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      <span>{fav ? '已收藏' : '收藏'}</span>
    </button>
  );
}
