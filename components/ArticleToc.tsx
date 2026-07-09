'use client';

import { useEffect, useState } from 'react';
import type { TocItem } from '@/lib/articles';

interface Props {
  items: TocItem[];
}

/**
 * 文章页目录 ToC
 *
 * - Desktop (≥ xl): 右侧 fixed 侧栏(sticky 浮动),scroll-spy 高亮
 * - Mobile  (< xl): 右下"目录"浮动按钮(避开 FAB),点击展开右侧抽屉
 *   - 抽屉内显示完整章节列表
 *   - 滚动同步:抽屉打开时也实时高亮当前章节
 *   - 点击章节:平滑滚动到对应 h3 + 关闭抽屉
 *
 * 共享 activeId + IntersectionObserver scroll-spy 逻辑
 */
export default function ArticleToc({ items }: Props) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? '');
  const [drawerOpen, setDrawerOpen] = useState(false);

  // 抽屉打开时锁滚动(避免内容区滚动和抽屉交互冲突)
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  useEffect(() => {
    if (items.length === 0) return;

    // 收集所有 h3 元素
    const headings: HTMLElement[] = [];
    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) headings.push(el);
    });
    if (headings.length === 0) return;

    // scroll-spy
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: '-80px 0px -60% 0px',
        threshold: 0,
      }
    );
    headings.forEach((h) => observer.observe(h));

    // 兜底:滚到底部时强制激活最后一项
    const onScroll = () => {
      const scrolledToBottom =
        window.innerHeight + window.scrollY >= document.body.scrollHeight - 50;
      if (scrolledToBottom) {
        setActiveId(items[items.length - 1].id);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, [items]);

  if (items.length === 0) return null;

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top: y, behavior: 'smooth' });
    history.replaceState(null, '', `#${id}`);
    setActiveId(id);
    setDrawerOpen(false);
  };

  const onClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    scrollTo(id);
  };

  return (
    <>
      {/* Desktop — 右侧 fixed 侧栏(≥ xl 显示) */}
      <aside
        className="hidden xl:block fixed right-6 top-32 w-[200px] z-30 max-h-[calc(100vh-160px)] overflow-y-auto"
        aria-label="文章目录"
      >
        <div className="text-[10px] text-ink-mute tracking-[0.3em] uppercase mb-4 pl-3">
          目 · 录
        </div>
        <nav>
          <ul className="space-y-1.5 border-l border-border-soft">
            {items.map((item) => {
              const active = item.id === activeId;
              return (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    onClick={(e) => onClick(e, item.id)}
                    className={`block pl-3 pr-2 py-1 text-xs leading-relaxed border-l-2 -ml-px transition-all ${
                      active
                        ? 'border-cinnabar text-cinnabar font-medium'
                        : 'border-transparent text-ink-soft hover:text-ink hover:border-gold'
                    }`}
                    aria-current={active ? 'location' : undefined}
                  >
                    {item.title}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Mobile — 浮动目录按钮(< xl 显示,避开右下 FAB) */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="xl:hidden fixed right-4 bottom-32 z-40 flex items-center gap-1.5 px-3 py-2 bg-paper-card border border-border rounded-full shadow-md text-xs text-ink-soft hover:text-cinnabar hover:border-cinnabar transition-colors"
        aria-label="打开文章目录"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 10h16M4 14h10M4 18h10"
          />
        </svg>
        <span className="font-medium">目录</span>
      </button>

      {/* Mobile — 抽屉(只在打开时渲染) */}
      {drawerOpen && (
        <>
          <div
            className="xl:hidden fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside
            className="xl:hidden fixed right-0 top-0 bottom-0 z-[70] w-[80vw] max-w-sm bg-paper-card border-l border-border shadow-2xl flex flex-col"
            style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
            role="dialog"
            aria-label="文章目录"
            aria-modal="true"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-soft">
              <div className="text-[10px] text-ink-mute tracking-[0.3em] uppercase">
                目 · 录
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 text-ink-soft hover:text-ink"
                aria-label="关闭目录"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-5">
              <ol className="space-y-1.5">
                {items.map((item, idx) => {
                  const active = item.id === activeId;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => scrollTo(item.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-sm transition-colors flex items-start gap-3 ${
                          active
                            ? 'bg-cinnabar/8 text-cinnabar font-medium'
                            : 'text-ink-soft hover:bg-paper-deep hover:text-ink'
                        }`}
                        aria-current={active ? 'location' : undefined}
                      >
                        <span
                          className={`shrink-0 mt-0.5 text-[10px] tabular-nums ${
                            active ? 'text-cinnabar' : 'text-ink-mute'
                          }`}
                        >
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span className="text-sm leading-snug">{item.title}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </nav>
            <div className="px-5 py-3 border-t border-border-soft text-[10px] text-ink-mute">
              <kbd className="px-1 border border-border rounded">点击</kbd> 跳转,自动关闭
            </div>
          </aside>
        </>
      )}
    </>
  );
}