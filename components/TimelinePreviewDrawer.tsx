'use client';

/**
 * Timeline 预览抽屉 — 点 timeline 文章卡不跳走,右侧出抽屉
 *
 * 设计要点:
 * - 不打散现有 layout:固定右侧 slide-in,移动端 full-screen
 * - 主体信息密度:封面 + 标题 + 摘要 + 关键人物 + 主题 chip
 * - 底部"读全文"CTA → 跳到 /article/[slug]
 * - 关闭:右上 X / 背景点 / Esc
 * - 锁滚动(打开时 body overflow:hidden)
 *
 * 数据:
 * - article:TimelineArticle(已含 keyFigures)
 * - topicTags:全局 ≥MIN_TAG_COUNT 的 tag + count
 *   抽屉内用 article.tags 过滤,显示 top 3 主题 chip
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { findDynasty } from '@/lib/dynasties';
import type { TimelineArticle } from '@/lib/timeline';
import { coverUrl } from '@/lib/site-config';

interface TopicTag {
  tag: string;
  count: number;
}

interface Props {
  article: TimelineArticle | null;
  topicTags: TopicTag[];
  onClose: () => void;
}

export default function TimelinePreviewDrawer({ article, topicTags, onClose }: Props) {
  // 打开时锁 body 滚动
  useEffect(() => {
    if (!article) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [article]);

  // Esc 关闭
  useEffect(() => {
    if (!article) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [article, onClose]);

  if (!article) return null;

  const d = findDynasty(article.dynasty);
  const dynastyColor = d?.primary || '#5A5A5A';

  // 过滤 article.tags 找有 /topic/[tag] 深读页的 tag(≥MIN_TAG_COUNT)
  const validTagSet = new Set(topicTags.map((t) => t.tag));
  const countMap = new Map(topicTags.map((t) => [t.tag, t.count] as const));
  const seen = new Set<string>();
  const relatedTopics: TopicTag[] = [];
  for (const t of article.tags || []) {
    const tag = String(t);
    if (validTagSet.has(tag) && !seen.has(tag)) {
      seen.add(tag);
      relatedTopics.push({ tag, count: countMap.get(tag) || 0 });
      if (relatedTopics.length >= 3) break;
    }
  }

  return (
    <>
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 抽屉主体 */}
      <aside
        className="fixed right-0 top-0 bottom-0 z-[70] w-full md:w-[480px] lg:w-[520px] bg-paper-card border-l border-border shadow-2xl flex flex-col slide-in-right"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
        role="dialog"
        aria-modal="true"
        aria-label={article.title}
      >
        {/* 关闭按钮 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-soft">
          <div className="flex items-center gap-2 text-[10px] text-ink-mute tracking-widest uppercase">
            <span
              className="w-2 h-2 rounded-sm"
              style={{ backgroundColor: dynastyColor }}
            />
            <span>{article.dynasty} · 第 {article.episode} 期</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-ink-soft hover:text-ink"
            aria-label="关闭预览"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 内容滚动区 */}
        <div className="flex-1 overflow-y-auto">
          {/* 封面大图 */}
          <div className="relative aspect-[16/9] bg-paper-deep overflow-hidden">
            <img
              src={coverUrl(article.slug)}
              alt={article.title}
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>

          {/* 标题 + meta */}
          <div className="px-6 pt-5 pb-4">
            <h2 className="text-xl md:text-2xl font-bold text-ink leading-tight mb-2">
              {article.title}
            </h2>
            {article.subtitle && (
              <p className="text-sm text-ink-soft leading-relaxed mb-3">
                {article.subtitle}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-ink-mute">
              <span className="tabular-nums">{article.readingTime} 分钟阅读</span>
              <span className="w-1 h-1 rounded-full bg-ink-mute"></span>
              <span className="font-mono">{article.volume}</span>
              <span className="w-1 h-1 rounded-full bg-ink-mute"></span>
              <span>{new Date(article.publishedAt).toLocaleDateString('zh-CN')}</span>
            </div>
          </div>

          {/* 摘要 */}
          {article.excerpt && (
            <div className="px-6 pb-5">
              <div className="text-[10px] text-gold-dark classical tracking-widest uppercase mb-2">
                摘 · 要
              </div>
              <p className="text-sm text-ink leading-relaxed">{article.excerpt}</p>
            </div>
          )}

          {/* 关键人物 */}
          {article.keyFigures && article.keyFigures.length > 0 && (
            <div className="px-6 pb-5">
              <div className="text-[10px] text-gold-dark classical tracking-widest uppercase mb-3">
                关 · 键 · 人 · 物
              </div>
              <div className="space-y-2">
                {article.keyFigures.slice(0, 5).map((fig, i) => (
                  <div key={i} className="flex items-start gap-3 px-3 py-2 bg-paper-deep rounded-sm">
                    <div
                      className="w-8 h-8 flex-shrink-0 flex items-center justify-center text-paper rounded-sm classical text-sm font-bold text-center leading-none"
                      style={{ backgroundColor: dynastyColor }}
                    >
                      {fig.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-ink">{fig.name}</div>
                      <div className="text-xs text-ink-soft leading-snug">{fig.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 相关主题 */}
          {relatedTopics.length > 0 && (
            <div className="px-6 pb-5">
              <div className="text-[10px] text-gold-dark classical tracking-widest uppercase mb-2">
                相 · 关 · 主 · 题
              </div>
              <div className="flex flex-wrap gap-1.5">
                {relatedTopics.map(({ tag, count }) => (
                  <Link
                    key={tag}
                    href={`/topic/${encodeURIComponent(tag)}`}
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-paper-deep border border-border hover:border-cinnabar hover:text-cinnabar rounded-sm text-xs transition-colors"
                  >
                    <span>{tag}</span>
                    <span className="text-[10px] text-ink-mute tabular-nums">{count}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 底部 CTA */}
        <div className="px-6 py-4 border-t border-border bg-paper-deep/50">
          <Link
            href={`/article/${article.slug}`}
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-cinnabar hover:bg-cinnabar-dark text-paper rounded-md transition-colors font-medium"
          >
            <span>读全文 · {article.readingTime} 分钟</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <p className="text-center text-[10px] text-ink-mute mt-2">
            按 Esc 关闭 · 桌面 ← → 切换朝代
          </p>
        </div>
      </aside>
    </>
  );
}
