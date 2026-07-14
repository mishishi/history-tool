'use client';

/**
 * ArticleCover — 文章封面
 *
 * 永远走 webp(public/covers/ 已经在 TCB + git untrack):
 * - coverUrl(slug) → TCB CDN URL(有 NEXT_PUBLIC_CDN_BASE_URL)或 Vercel 静态(无 env)
 * - 100% 文章都有 AI 封面(没有 fallback 需要)
 *
 * 之前版本有 SVG fallback(hasCover 检测 + SvgCover 组件),但因为
 * `git rm --cached` 让 `public/covers/` 在 Vercel build 时是空的,
 * build-cover-manifest 生成空 COVER_SLUGS,hasCover 永远 false,
 * 走 SVG fallback,显示成"之前 svg 生成的图片"。
 * 删 fallback,直接走 webp,失败显示 broken image icon(更明显)。
 */
import { coverUrl } from '@/lib/site-config';
import type { ArticleMeta } from '@/lib/types';
import type { DynastyConfig } from '@/lib/dynasties';

interface Props {
  article: ArticleMeta;
  dynasty: DynastyConfig;
  /** 紧凑 4:3 比例(列表卡片用) */
  compact?: boolean;
  /** hero 立即加载 + 提升 fetchPriority */
  eager?: boolean;
}

export default function ArticleCover({ article, dynasty, compact = false, eager = false }: Props) {
  return (
    <div
      className={`relative ${compact ? 'aspect-[4/3]' : 'aspect-[16/9]'} w-full overflow-hidden rounded-sm bg-paper-deep`}
      data-cover-source="ai"
    >
      <img
        src={coverUrl(article.slug)}
        alt={`${article.title} · ${dynasty.name} 期封面`}
        className="article-cover-img w-full h-full object-cover"
        loading={eager ? 'eager' : 'lazy'}
        {...(eager ? { fetchPriority: 'high' as const } : {})}
        decoding="async"
        // 404 时显示 broken-image icon(替代之前 SVG fallback)
        onError={(e) => {
          const img = e.currentTarget;
          img.style.display = 'none';
          const parent = img.parentElement;
          if (parent) parent.dataset.coverBroken = 'true';
        }}
      />
    </div>
  );
}
