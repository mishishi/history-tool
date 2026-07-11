/**
 * TimelineView — 资治通鉴朝代时间线
 *
 * 横向 8 列 (朝代) × 纵向 N 张文章 (按 episode 升序)
 * - 桌面:横向滚动,snap-x(每个朝代列占满视口宽度方向)
 * - 移动:竖向滚动(每朝代单独 section)
 *
 * 数据:lib/timeline.ts (getTimelineColumns)
 * 跟 figures-graph 形成"网+轴"双视角
 */
import Link from 'next/link';
import { hasCover as coverExists } from '@/lib/cover-slugs';
import { findDynasty, type Dynasty } from '@/lib/dynasties';
import type { ArticleMeta } from '@/lib/types';
import type { TimelineColumn } from '@/lib/timeline';

interface Props {
  columns: TimelineColumn[];
}

export default function TimelineView({ columns }: Props) {
  if (columns.length === 0) {
    return (
      <div className="text-center py-20 text-ink-mute">
        暂无时间线数据
      </div>
    );
  }

  return (
    <>
      {/* 桌面:横向滚动(>= md) */}
      <div className="hidden md:block">
        <div className="flex gap-6 overflow-x-auto pb-8 px-2 snap-x snap-mandatory scrollbar-thin">
          {columns.map((col) => (
            <DynastyColumn key={col.dynasty.slug} column={col} />
          ))}
        </div>
        <div className="text-center text-[10px] text-ink-mute tracking-widest uppercase mt-2">
          ← 横向滑动查看朝代 →
        </div>
      </div>

      {/* 移动:竖向滚动(< md) */}
      <div className="md:hidden space-y-10">
        {columns.map((col) => (
          <DynastySectionMobile key={col.dynasty.slug} column={col} />
        ))}
      </div>
    </>
  );
}

/* ===== 桌面:每个朝代占满一屏宽 ===== */

function DynastyColumn({ column }: { column: TimelineColumn }) {
  const { dynasty, articles } = column;
  return (
    <div className="flex-shrink-0 w-[min(420px,90vw)] snap-center">
      <ColumnHeader dynasty={dynasty} count={articles.length} />
      <div className="space-y-2.5 mt-4">
        {articles.map((article) => (
          <TimelineCard key={article.slug} article={article} />
        ))}
      </div>
    </div>
  );
}

/* ===== 移动:每朝代一段 ===== */

function DynastySectionMobile({ column }: { column: TimelineColumn }) {
  const { dynasty, articles } = column;
  return (
    <section>
      <ColumnHeader dynasty={dynasty} count={articles.length} />
      <div className="space-y-2.5 mt-3">
        {articles.map((article) => (
          <TimelineCard key={article.slug} article={article} />
        ))}
      </div>
    </section>
  );
}

/* ===== 共用:列头 ===== */

function ColumnHeader({ dynasty, count }: { dynasty: Dynasty; count: number }) {
  return (
    <div
      className="relative bg-paper-card border border-border rounded-sm p-4"
      style={{ borderTop: `3px solid ${dynasty.primary}` }}
    >
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <h3 className="text-lg font-bold text-ink">{dynasty.name}</h3>
        <span
          className="px-2 py-0.5 text-[10px] tabular-nums rounded-sm"
          style={{
            color: dynasty.primary,
            backgroundColor: dynasty.primary + '15', // 15% alpha
          }}
        >
          {count} 篇
        </span>
      </div>
      <div className="text-[11px] text-ink-mute tracking-wide">{dynasty.period}</div>
    </div>
  );
}

/* ===== 共用:文章小卡(横版 cover + 标题) ===== */

function TimelineCard({ article }: { article: ArticleMeta }) {
  const d = findDynasty(article.dynasty);
  const dynastyColor = d?.primary || '#5A5A5A';
  const hasWebp = coverExists(article.slug);

  return (
    <Link
      href={`/article/${article.slug}`}
      className="group flex items-center gap-3 p-2 bg-paper-card border border-border hover:border-cinnabar rounded-sm transition-all hover:shadow-sm"
      style={{ borderLeft: `2px solid ${dynastyColor}` }}
    >
      {/* cover 缩略 4:3 */}
      <div className="shrink-0 w-16 h-12 overflow-hidden rounded-sm bg-paper-deep">
        {hasWebp ? (
          <img
            src={`/covers/${article.slug}.webp`}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] text-ink-mute">
            鉴
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h4 className="text-xs font-medium text-ink leading-snug group-hover:text-cinnabar transition-colors line-clamp-2 mb-0.5">
          {article.title}
        </h4>
        <div className="flex items-center gap-2 text-[10px] text-ink-mute">
          <span className="tabular-nums shrink-0">第 {article.episode} 期</span>
          <span className="w-1 h-1 rounded-full bg-ink-mute"></span>
          <span className="truncate">{article.dynasty}</span>
        </div>
      </div>
    </Link>
  );
}
