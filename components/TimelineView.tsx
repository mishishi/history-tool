'use client';

/**
 * TimelineView — 资治通鉴朝代时间线
 *
 * 横向 8 列 (朝代) × 纵向 N 张文章 (按 episode 升序)
 * - 桌面:横向滚动,snap-x(每个朝代列占满视口宽度方向)
 *   - 键盘 ←→ 切列 / Home/End 跳首尾
 * - 移动:竖向滚动(每朝代单独 section)
 *
 * 互动化 (2026-07-18):
 * - 点文章卡 → 弹右侧预览抽屉(不跳走)
 * - 抽屉内:封面 + 标题 + 摘要 + 关键人物 + 主题 chip + 读全文 CTA
 * - 关闭:右上 X / 背景点 / Esc
 *
 * 数据:lib/timeline.ts (getTimelineColumns)
 * 跟 figures-graph 形成"网+轴"双视角
 */
import { useEffect, useRef, useState } from 'react';
import { findDynasty, type Dynasty } from '@/lib/dynasties';
import type { TimelineArticle, TimelineColumn } from '@/lib/timeline';
import { coverUrl } from '@/lib/site-config';
import TimelinePreviewDrawer from './TimelinePreviewDrawer';

interface TopicTag {
  tag: string;
  count: number;
}

interface Props {
  columns: TimelineColumn[];
  /** 全局主题 tag 列表(给 preview drawer 筛 related topics 用) */
  topicTags: TopicTag[];
}

export default function TimelineView({ columns, topicTags }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeArticle, setActiveArticle] = useState<TimelineArticle | null>(null);

  // 桌面:键盘 ←→ 切朝代列, Home/End 跳首尾
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onKey = (e: KeyboardEvent) => {
      // 只在 scroll container 有焦点时响应(避免抢全局)
      if (document.activeElement !== el && !el.contains(document.activeElement as Node)) return;
      // 桌面才生效
      if (window.innerWidth < 768) return;

      // 一列的宽度 = 容器的 clientWidth(因为有 snap-center)
      const step = el.clientWidth * 0.85; // 略小于一列, 给点边距

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        el.scrollBy({ left: step, behavior: 'smooth' });
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        el.scrollBy({ left: -step, behavior: 'smooth' });
      } else if (e.key === 'Home') {
        e.preventDefault();
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else if (e.key === 'End') {
        e.preventDefault();
        el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
      }
    };

    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, []);

  if (columns.length === 0) {
    return (
      <div className="text-center py-20 text-ink-mute">
        暂无时间线数据
      </div>
    );
  }

  return (
    <>
      {/* 桌面:横向滚动(>= md) — tabIndex 让 div 接受键盘事件 */}
      <div className="hidden md:block">
        <div
          ref={scrollRef}
          tabIndex={0}
          aria-label="朝代时间线, 用 ← → 键切换朝代, 点文章卡预览"
          className="flex gap-6 overflow-x-auto pb-8 px-2 snap-x snap-mandatory scrollbar-thin focus:outline-none focus-visible:ring-2 focus-visible:ring-cinnabar/30 focus-visible:ring-offset-2 focus-visible:rounded-sm"
        >
          {columns.map((col) => (
            <DynastyColumn
              key={col.dynasty.slug}
              column={col}
              onCardClick={setActiveArticle}
            />
          ))}
        </div>
        <div className="text-center text-[10px] text-ink-mute tracking-widest uppercase mt-2">
          ← 横向滑动 / 键盘 ← → 切朝代 / 点文章卡预览 →
        </div>
      </div>

      {/* 移动:竖向滚动(< md) */}
      <div className="md:hidden space-y-10">
        {columns.map((col) => (
          <DynastySectionMobile
            key={col.dynasty.slug}
            column={col}
            onCardClick={setActiveArticle}
          />
        ))}
      </div>

      {/* 预览抽屉 */}
      <TimelinePreviewDrawer
        article={activeArticle}
        topicTags={topicTags}
        onClose={() => setActiveArticle(null)}
      />
    </>
  );
}

/* ===== 桌面:每个朝代占满一屏宽 ===== */

function DynastyColumn({
  column,
  onCardClick,
}: {
  column: TimelineColumn;
  onCardClick: (a: TimelineArticle) => void;
}) {
  const { dynasty, articles } = column;
  return (
    <div className="flex-shrink-0 w-[min(420px,90vw)] snap-center">
      <ColumnHeader dynasty={dynasty} count={articles.length} />
      <div className="space-y-2.5 mt-4">
        {articles.map((article) => (
          <TimelineCard
            key={article.slug}
            article={article}
            onClick={() => onCardClick(article)}
          />
        ))}
      </div>
    </div>
  );
}

/* ===== 移动:每朝代一段 ===== */

function DynastySectionMobile({
  column,
  onCardClick,
}: {
  column: TimelineColumn;
  onCardClick: (a: TimelineArticle) => void;
}) {
  const { dynasty, articles } = column;
  return (
    <section>
      <ColumnHeader dynasty={dynasty} count={articles.length} />
      <div className="space-y-2.5 mt-3">
        {articles.map((article) => (
          <TimelineCard
            key={article.slug}
            article={article}
            onClick={() => onCardClick(article)}
          />
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

function TimelineCard({
  article,
  onClick,
}: {
  article: TimelineArticle;
  onClick: () => void;
}) {
  const d = findDynasty(article.dynasty);
  const dynastyColor = d?.primary || '#5A5A5A';
  // 永远走 webp(100% 文章都有 AI 封面)—— 不再用 cover-slugs 检查

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-3 p-2 bg-paper-card border border-border hover:border-cinnabar rounded-sm transition-all hover:shadow-sm w-full text-left"
      style={{ borderLeft: `2px solid ${dynastyColor}` }}
    >
      {/* cover 缩略 4:3 */}
      <div className="shrink-0 w-16 h-12 overflow-hidden rounded-sm bg-paper-deep">
        <img
          src={coverUrl(article.slug)}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
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

      {/* hover 时显示 → 提示"点开预览" */}
      <svg
        className="w-4 h-4 text-ink-mute opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}
