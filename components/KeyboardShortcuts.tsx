'use client';

import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { bumpFontSize, resetFontSize } from '@/lib/user-preferences';

// Vim-like 前缀键:g + 字母(1.2s 超时)
const PREFIX_TIMEOUT = 1200;

// g + 字母 跳转目标
const JUMP_TARGETS: Record<string, { label: string; href: string; hint: string }> = {
  h: { label: '首页',   href: '/',          hint: 'Home' },
  a: { label: '目录',   href: '/archive',   hint: 'Archive' },
  f: { label: '收藏',   href: '/favorites', hint: 'Favorites' },
  q: { label: '问典',   href: '/ask',       hint: 'Ask AI' },
  t: { label: '人物',   href: '/figures',   hint: '人物长卷' },
  s: { label: '搜索',   href: '#search',    hint: 'Search (弹搜索)' },
  u: { label: '订阅',   href: '/unlock',    hint: '订阅' },
};

/** 是否在可编辑元素中(input/textarea/contentEditable) */
function isEditableTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  const tag = t.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable;
}

/**
 * 全局键盘快捷键
 * - 单字母快捷键(?, j, k, +/=, -, 0)在 input/textarea/contentEditable 时全部跳过
 * - Cmd/Ctrl + K 派发 dt-open-search,由 SearchButton 接收
 * - g + 字母 是 Vim-like 前缀键,1.2s 内按第二个键有效
 * - ? 切换快捷键面板
 * - j / k 文章页翻上一篇/下一篇(从 DOM 读 .prev-next-card-* href)
 * - + / - / 0 调字号(配合 ReadingPrefs 持久化)
 */
export default function KeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const [helpOpen, setHelpOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const isArticlePage = pathname?.startsWith('/article/') ?? false;

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => {
      setToast((cur) => (cur === msg ? null : cur));
    }, 1400);
  }, []);

  useEffect(() => {
    let gPrefix = false;
    let gTimer: number | null = null;
    const resetG = () => {
      gPrefix = false;
      if (gTimer) {
        clearTimeout(gTimer);
        gTimer = null;
      }
    };

    const handler = (e: KeyboardEvent) => {
      // ESC 永远可用 — 关掉打开的 modal/help
      if (e.key === 'Escape') {
        if (helpOpen) setHelpOpen(false);
        return;
      }

      const editable = isEditableTarget(e.target);

      // ? 切换快捷键面板(Shift+/) — 始终可用(可编辑元素里也能开,只是不抢别的)
      // 注:输入框里也允许,免得用户用"我按 ? 怎么没反应"的困惑
      if (e.key === '?') {
        e.preventDefault();
        setHelpOpen((v) => !v);
        return;
      }

      // 其余单字母快捷键:输入框里全部跳过
      if (editable) return;

      // Cmd/Ctrl + K → 派发 dt-open-search(SearchButton 监听)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('dt-open-search'));
        return;
      }

      // g + 字母:Vim-like 跳转
      if (e.key === 'g' && !gPrefix) {
        gPrefix = true;
        gTimer = window.setTimeout(resetG, PREFIX_TIMEOUT);
        return;
      }
      if (gPrefix) {
        const key = e.key.toLowerCase();
        resetG();
        const target = JUMP_TARGETS[key];
        if (!target) return;
        e.preventDefault();
        if (key === 's') {
          window.dispatchEvent(new CustomEvent('dt-open-search'));
          return;
        }
        router.push(target.href);
        return;
      }

      // 文章页翻页 j/k
      if (e.key === 'j' || e.key === 'k') {
        if (!isArticlePage) return;
        const sel = e.key === 'j' ? '.prev-next-card-right' : '.prev-next-card-left';
        const link = document.querySelector(sel) as HTMLAnchorElement | null;
        const href = link?.getAttribute('href');
        if (href) {
          e.preventDefault();
          router.push(href);
        }
        return;
      }

      // 字号调节 + / - / 0
      // 避免误触:仅在没按 shift 时 (e.shiftKey=false) 拦截 +/-
      //   '+' 在大多数键盘是 Shift+=,'=' 是没按 Shift
      //   '-' 不需要 shift
      if (e.key === '=' && !e.shiftKey) {
        // 裸 = (罕见),当成 +/=
        const next = bumpFontSize(1);
        showToast(`字号:${fontLabel(next.fontSize)}`);
        return;
      }
      if (e.key === '+' || (e.key === '=' && e.shiftKey)) {
        e.preventDefault();
        const next = bumpFontSize(1);
        showToast(`字号:${fontLabel(next.fontSize)}`);
        return;
      }
      if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        const next = bumpFontSize(-1);
        showToast(`字号:${fontLabel(next.fontSize)}`);
        return;
      }
      if (e.key === '0') {
        e.preventDefault();
        const next = resetFontSize();
        showToast(`字号:${fontLabel(next.fontSize)}`);
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
      if (gTimer) clearTimeout(gTimer);
    };
  }, [router, isArticlePage, helpOpen, showToast]);

  return (
    <>
      {/* 快捷键面板 */}
      {helpOpen && (
        <ShortcutsHelp
          isArticlePage={isArticlePage}
          onClose={() => setHelpOpen(false)}
        />
      )}

      {/* 反馈 toast(底部居中) */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed left-1/2 -translate-x-1/2 bottom-[10rem] z-[80] px-4 py-2 bg-ink/90 text-paper text-sm rounded-sm shadow-2xl backdrop-blur-sm fade-in-up"
        >
          {toast}
        </div>
      )}
    </>
  );
}

function fontLabel(fs: 'sm' | 'base' | 'lg'): string {
  return fs === 'sm' ? '小' : fs === 'lg' ? '大' : '标准';
}

function ShortcutsHelp({
  isArticlePage,
  onClose,
}: {
  isArticlePage: boolean;
  onClose: () => void;
}) {
  // Esc 关
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // 点击遮罩关
  return (
    <div
      className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm flex items-start justify-center pt-[10vh] px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="键盘快捷键"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-paper-card border border-border rounded-sm shadow-2xl fade-in-up overflow-hidden"
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-soft">
          <div>
            <div className="text-[10px] text-ink-mute tracking-[0.3em] uppercase">
              Du Tongjian
            </div>
            <h2 className="text-base font-semibold text-ink mt-0.5">键盘快捷键</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="关闭"
            className="p-1.5 text-ink-soft hover:text-ink transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 分组 */}
        <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <Group title="全局">
            <Row kbd="?" desc="显示 / 隐藏本面板" />
            <Row kbd="⌘ K" desc="搜索文章" />
            <Row kbd="Esc" desc="关闭弹窗" />
          </Group>

          <Group title="Vim 风格跳转(按 g + 字母)">
            {Object.entries(JUMP_TARGETS).map(([key, t]) => (
              <Row key={key} kbd={`g ${key.toUpperCase()}`} desc={t.label} />
            ))}
          </Group>

          {isArticlePage && (
            <Group title="阅读文章时">
              <Row kbd="J" desc="下一篇" />
              <Row kbd="K" desc="上一篇" />
              <Row kbd="+" desc="字号放大" />
              <Row kbd="-" desc="字号缩小" />
              <Row kbd="0" desc="字号重置" />
            </Group>
          )}

          <div className="pt-2 text-[10px] text-ink-mute leading-relaxed">
            提示:在搜索框 / 评论区里输入时,字母快捷键自动让位给文本输入,不会误触发。
          </div>
        </div>

        <div className="px-5 py-2.5 border-t border-border-soft text-[10px] text-ink-mute text-right">
          按 <Kbd>ESC</Kbd> 或点击空白处关闭
        </div>
      </div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <div className="text-[10px] text-ink-mute tracking-[0.25em] uppercase mb-2">
        {title}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ kbd, desc }: { kbd: string; desc: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-ink-soft">{desc}</span>
      <Kbd>{kbd}</Kbd>
    </div>
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex items-center px-1.5 py-0.5 text-[11px] font-mono text-ink-soft bg-paper border border-border rounded min-w-[1.5rem] justify-center">
      {children}
    </kbd>
  );
}
