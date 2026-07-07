import Link from 'next/link';
import type { ArticleMeta } from '@/lib/types';
import { formatRelativeDate } from '@/lib/articles';

interface ArticleCardProps {
  article: ArticleMeta;
  variant?: 'default' | 'compact';
}

/**
 * 文章卡片(首页列表用)
 */
export default function ArticleCard({ article, variant = 'default' }: ArticleCardProps) {
  const accentColor =
    article.dynasty === '唐' || article.dynasty === '五代'
      ? 'bg-ink'
      : article.dynasty === '战国'
      ? 'bg-cinnabar'
      : 'bg-gold';

  return (
    <Link
      href={`/article/${article.slug}`}
      className="group block bg-paper-card border border-border hover:border-cinnabar rounded-sm overflow-hidden transition-all hover:shadow-lg"
    >
      <div className={`h-1 ${accentColor}`}></div>
      <div className={`p-6 ${variant === 'compact' ? 'p-5' : ''}`}>
        {/* 标签行 */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="seal-gold">{article.dynasty}</span>
          <span className="text-xs text-ink-mute">{article.volume}</span>
          <span className="text-xs text-ink-mute">·</span>
          <span className="text-xs text-ink-mute">{article.readingTime} 分钟</span>
        </div>

        {/* 标题 */}
        <h3 className="text-lg font-semibold text-ink mb-3 group-hover:text-cinnabar transition-colors leading-snug">
          {article.title}
        </h3>

        {/* 副标题(摘要) */}
        {article.excerpt && (
          <p className="text-sm text-ink-soft leading-relaxed mb-4 line-clamp-2">
            {article.excerpt}
          </p>
        )}

        {/* 古文引子 */}
        {article.classicalQuote && (
          <blockquote className="classical text-sm text-ink-soft italic border-l-2 border-gold/40 pl-3 line-clamp-2">
            「{article.classicalQuote}」
          </blockquote>
        )}

        {/* meta */}
        <div className="mt-5 pt-4 border-t border-border-soft flex items-center justify-between text-xs text-ink-mute">
          <span>{formatRelativeDate(article.publishedAt)}</span>
          <span>{article.views >= 1000 ? `${(article.views / 1000).toFixed(1)}k 阅读` : `${article.views} 阅读`}</span>
        </div>
      </div>
    </Link>
  );
}