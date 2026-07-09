'use client';

import { useEffect, useState } from 'react';
import type { TocItem } from '@/lib/articles';

interface Props {
  items: TocItem[];
}

/**
 * 文章页右侧 ToC 目录
 * - sticky 浮动在视口右侧(md+ 显示,小屏隐藏)
 * - scroll-spy: 监听当前在视口的 h3,高亮对应项
 * - 点击平滑滚动到对应 h3(hash 同步)
 */
export default function ArticleToc({ items }: Props) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? '');

  useEffect(() => {
    if (items.length === 0) return;

    // 收集所有 h3 元素
    const headings: HTMLElement[] = [];
    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) headings.push(el);
    });
    if (headings.length === 0) return;

    // scroll-spy: 用 IntersectionObserver 跟踪可见的 h3
    // 选最靠近顶部的可见 heading 作为 active
    const observer = new IntersectionObserver(
      (entries) => {
        // 找所有当前可见的,选 top 最小(最接近 viewport top)
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        // 视口顶部 0% 到 50% 之间为「活跃区」
        // h3 进入这个区域就算 active
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

  const onClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    // 顶部让出 80px 给 sticky Header
    const y = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top: y, behavior: 'smooth' });
    // 同步 hash(可分享)
    history.replaceState(null, '', `#${id}`);
    setActiveId(id);
  };

  return (
    <aside className="hidden xl:block fixed right-6 top-32 w-[200px] z-30 max-h-[calc(100vh-160px)] overflow-y-auto" aria-label="文章目录">
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
  );
}