'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  getFavorites,
  getRecent,
  getProgress,
  subscribe,
} from '@/lib/user-data';
import type { ArticleMeta } from '@/lib/types';

interface EnrichedArticle extends ArticleMeta {
  progress: number;
}

export default function FavoritesContent({
  allArticles,
}: {
  allArticles: ArticleMeta[];
}) {
  const [favSlugs, setFavSlugs] = useState<string[]>([]);
  const [recentItems, setRecentItems] = useState<{ slug: string; ts: number }[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const refresh = () => {
      setFavSlugs(getFavorites());
      setRecentItems(getRecent());
    };
    refresh();
    const unsub = subscribe(refresh);
    return unsub;
  }, []);

  // 服务端或未 hydration 时显示骨架,避免 mismatch
  if (!mounted) {
    return <FavoritesSkeleton />;
  }

  // Map slugs → ArticleMeta
  const bySlug = new Map(allArticles.map((a) => [a.slug, a]));
  const favorites: EnrichedArticle[] = favSlugs
    .map((slug) => bySlug.get(slug))
    .filter((a): a is ArticleMeta => Boolean(a))
    .map((a) => ({ ...a, progress: getProgress(a.slug) }));

  // 最近:过滤掉已收藏(避免重复),保留未完成的
  const recent: EnrichedArticle[] = recentItems
    .filter((r) => !favSlugs.includes(r.slug))
    .map((r) => bySlug.get(r.slug))
    .filter((a): a is ArticleMeta => Boolean(a))
    .map((a) => ({ ...a, progress: getProgress(a.slug) }))
    .filter((a) => a.progress > 0 && a.progress < 100)
    .slice(0, 6);

  // 两个都空 → 引导
  if (favorites.length === 0 && recent.length === 0) {
    return <EmptyState allArticles={allArticles} />;
  }

  return (
    <div className="space-y-12">
      {favorites.length > 0 && (
        <section>
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-ink mb-1 flex items-center gap-2">
                <svg className="w-5 h-5 text-cinnabar" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                我的收藏
                <span className="text-sm text-ink-mute font-normal">({favorites.length})</span>
              </h2>
              <p className="text-sm text-ink-soft">你小心心点过的文章</p>
            </div>
          </div>
          <ul className="divide-y divide-border border-t border-b border-border">
            {favorites.map((a) => (
              <li key={a.slug}>
                <Link
                  href={`/article/${a.slug}`}
                  className="block py-5 px-2 hover:bg-paper-deep/50 transition-colors group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-cinnabar/10 text-cinnabar classical text-base font-bold rounded-sm">
                      {a.episode}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] text-ink-mute uppercase tracking-wider">
                          {a.dynasty} · {a.volume}
                        </span>
                        {a.progress > 0 && a.progress < 100 && (
                          <span className="text-[10px] text-cinnabar">
                            · 已读 {Math.round(a.progress)}%
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-semibold text-ink leading-snug mb-1 group-hover:text-cinnabar transition-colors">
                        {a.title}
                      </h3>
                      {a.subtitle && (
                        <p className="text-sm text-ink-soft line-clamp-1">{a.subtitle}</p>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {recent.length > 0 && (
        <section>
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-ink mb-1">继续阅读</h2>
              <p className="text-sm text-ink-soft">你上次读到一半的文章</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {recent.map((a) => (
              <Link
                key={a.slug}
                href={`/article/${a.slug}`}
                className="block p-4 bg-paper-card border border-border rounded-sm hover:border-cinnabar transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] text-ink-mute uppercase tracking-wider">
                    {a.dynasty} · 第 {a.episode} 期
                  </span>
                </div>
                <h3 className="text-base font-semibold text-ink leading-snug mb-3 line-clamp-2">
                  {a.title}
                </h3>
                {/* 进度条 */}
                <div className="h-1 bg-paper-deep rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cinnabar transition-all"
                    style={{ width: `${a.progress}%` }}
                  />
                </div>
                <p className="text-xs text-ink-mute mt-2">已读 {Math.round(a.progress)}%</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function FavoritesSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-32 bg-paper-card border border-border rounded-sm" />
      <div className="h-40 bg-paper-card border border-border rounded-sm" />
    </div>
  );
}

function EmptyState({ allArticles }: { allArticles: ArticleMeta[] }) {
  // 取阅读数最高的 3 篇作为推荐
  const recommended = [...allArticles]
    .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
    .slice(0, 3);

  return (
    <div className="py-12 md:py-16">
      <div className="text-center mb-10">
        <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center bg-cinnabar/10 text-cinnabar rounded-sm">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-ink mb-3">还没收藏文章</h2>
        <p className="text-ink-soft mb-6 max-w-md mx-auto">
          在任何一篇文章页,标题下面有个「收藏」按钮,点一下就放到这里。
        </p>
        <Link
          href="/#articles"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-cinnabar hover:bg-cinnabar-dark text-paper rounded-md transition-colors font-medium"
        >
          去发现好文章
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>

      {/* 推荐 3 篇热门文章 */}
      {recommended.length > 0 && (
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <div className="text-[10px] text-ink-mute tracking-[0.3em] uppercase">热 门 推 荐</div>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {recommended.map((a) => (
              <Link
                key={a.slug}
                href={`/article/${a.slug}`}
                className="group block p-4 bg-paper-card border border-border rounded-sm hover:border-cinnabar transition-all hover:shadow-md"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-1.5 py-0.5 text-[10px] text-cinnabar border border-cinnabar/40 rounded">
                    {a.dynasty}
                  </span>
                  <span className="text-[10px] text-ink-mute tabular-nums">
                    {a.views} 阅读
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-ink leading-snug mb-1.5 line-clamp-2 group-hover:text-cinnabar transition-colors">
                  {a.title}
                </h3>
                {a.subtitle && (
                  <p className="text-xs text-ink-soft line-clamp-1">{a.subtitle}</p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
