'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import {
  getNotes,
  addNote,
  deleteNote,
  updateNote,
  subscribeNotes,
  extractFromSelection,
  NOTE_COLORS,
  type Note,
  type NoteColor,
} from '@/lib/notes';

type Mode = 'main' | 'highlight' | 'note';

interface Position {
  top: number;
  left: number;
  /** 浮窗放在选区上方还是下方 — 用于箭头指示 */
  placement: 'top' | 'bottom';
}

/**
 * 选段引用工具条 — 只在文章页激活
 *
 * 流程:
 *  1. 监听 selectionchange,检测选区在 .prose-article 内
 *  2. 浮窗定位到选区上方居中
 *  3. 4 按钮:复制 / 高亮(三色) / 笔记 / 分享
 *  4. 高亮 + 笔记都通过 lib/notes 持久化
 *  5. 文章挂载时,useEffect 把 notes 里的 text 注入为 <mark>
 *  6. 点击现有 mark → 弹出删除/编辑菜单
 *
 * 边界:
 *  - 选区 < 2 字或 > 500 字:不出工具条
 *  - 选区在 input/textarea/contentEditable:不出工具条
 *  - touch 设备不显示(没有 hover,长按菜单冲突)
 */
export default function SelectionToolbar() {
  const pathname = usePathname();
  const isArticlePage = pathname?.startsWith('/article/') ?? false;
  const slug = isArticlePage ? pathname.split('/')[2] : null;

  const [pos, setPos] = useState<Position | null>(null);
  const [mode, setMode] = useState<Mode>('main');
  const [pickedColor, setPickedColor] = useState<NoteColor>('cinnabar');
  const [noteDraft, setNoteDraft] = useState('');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [mounted, setMounted] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  /** 抑制窗口:mark mousedown 后 100ms 内 selectionchange 忽略(避免刚设的 pos 被清) */
  const suppressSelRef = useRef(0);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => {
      setToast((cur) => (cur === msg ? null : cur));
    }, 1400);
  }, []);

  // 挂载 / 路由变化时,把当前文章 notes 注入为 <mark>
  useEffect(() => {
    if (!mounted) {
      setMounted(true);
      return;
    }
    if (!slug) return;

    const apply = () => applyHighlights(slug);
    apply();

    // 订阅:外部 add/delete 触发重渲
    return subscribeNotes(() => apply());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, mounted]);

  // selection 监听
  useEffect(() => {
    if (!mounted || !isArticlePage) return;
    const onSel = () => {
      // 抑制窗口:mark mousedown 后 100ms 内 selectionchange 忽略
      if (Date.now() - suppressSelRef.current < 100) return;

      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
        setPos(null);
        setMode('main');
        setEditingNote(null);
        return;
      }
      const text = sel.toString().trim();
      if (text.length < 2 || text.length > 500) {
        setPos(null);
        return;
      }
      // 必须落在 .prose-article 内
      const range = sel.getRangeAt(0);
      const container = (range.commonAncestorContainer as HTMLElement).parentElement?.closest('.prose-article');
      if (!container) {
        setPos(null);
        return;
      }
      // 不在 input/textarea/contentEditable 里
      const target = sel.anchorNode?.parentElement;
      if (target?.closest('input, textarea, [contenteditable=true]')) {
        setPos(null);
        return;
      }
      // 计算位置
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        setPos(null);
        return;
      }
      setPos(computePosition(rect));
      setMode('main');
      setEditingNote(null);
    };

    document.addEventListener('selectionchange', onSel);
    window.addEventListener('scroll', onSel, true); // 滚动时 selection 自动清,但 resize 时还在
    window.addEventListener('resize', onSel);
    return () => {
      document.removeEventListener('selectionchange', onSel);
      window.removeEventListener('scroll', onSel, true);
      window.removeEventListener('resize', onSel);
    };
  }, [mounted, isArticlePage]);

  // 现有 mark 点击 → 弹出编辑/删除菜单
  useEffect(() => {
    if (!mounted || !isArticlePage) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const mark = target.closest('mark.dt-highlight') as HTMLElement | null;
      if (!mark) return;
      e.preventDefault();
      e.stopPropagation();
      const noteId = mark.dataset.noteId;
      if (!noteId || !slug) return;
      const note = getNotes(slug).find((n) => n.id === noteId);
      if (!note) return;
      const rect = mark.getBoundingClientRect();
      setPos(computePosition(rect));
      setEditingNote(note);
      setNoteDraft(note.noteText || '');
      setMode('note');
      // 关键:把这次 mousedown 后续触发的 selectionchange 短期忽略
      // (浏览器会在 mousedown 后自动 collapse 当前 selection,触发 selectionchange 把 pos 清掉)
      suppressSelRef.current = Date.now();
    };
    // 用 capture:mark 跟 selection 抢事件
    document.addEventListener('mousedown', onClick, true);
    return () => document.removeEventListener('mousedown', onClick, true);
  }, [mounted, isArticlePage, slug]);

  // 点击外部关闭工具条
  useEffect(() => {
    if (!pos) return;
    const onDown = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        // 点了页面其他地方,但不主动清 selection(让用户保留选区)
        setPos(null);
      }
    };
    // 推迟一帧挂,避免本次点击立即触发
    const t = window.setTimeout(() => document.addEventListener('mousedown', onDown), 0);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener('mousedown', onDown);
    };
  }, [pos]);

  if (!mounted || !isArticlePage || !slug) return null;

  // ---------- 动作 ----------
  const doCopy = async () => {
    const sel = window.getSelection();
    if (!sel) return;
    const text = sel.toString();
    try {
      await navigator.clipboard.writeText(text);
      showToast('已复制');
    } catch {
      // 兜底:用 execCommand
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        showToast('已复制');
      } catch {
        showToast('复制失败');
      }
      document.body.removeChild(ta);
    }
    setPos(null);
    sel.removeAllRanges();
  };

  const doHighlight = () => {
    if (!slug) return;
    const sel = window.getSelection();
    if (!sel) return;
    const proseEl = document.querySelector('.prose-article');
    if (!proseEl) return;
    const extracted = extractFromSelection(proseEl as HTMLElement, sel);
    if (!extracted) {
      showToast('选区无效');
      return;
    }
    // 检查是否已经有同样的选区笔记(避免重复)
    const existing = getNotes(slug).find(
      (n) => n.text === extracted.text && n.color === pickedColor,
    );
    if (existing) {
      showToast('已经标过啦');
      return;
    }
    addNote({
      slug,
      text: extracted.text,
      context: extracted.context,
      color: pickedColor,
      noteText: '',
    });
    showToast('已高亮');
    sel.removeAllRanges();
    setPos(null);
    setMode('main');
  };

  const doSaveNote = () => {
    if (!slug) return;
    const sel = window.getSelection();
    if (!sel) return;
    const proseEl = document.querySelector('.prose-article');
    if (!proseEl) return;

    if (editingNote) {
      // 编辑现有笔记
      updateNote(slug, editingNote.id, { noteText: noteDraft });
      showToast('已保存');
      setEditingNote(null);
      setNoteDraft('');
      setPos(null);
      setMode('main');
      return;
    }

    const extracted = extractFromSelection(proseEl as HTMLElement, sel);
    if (!extracted) {
      showToast('选区无效');
      return;
    }
    addNote({
      slug,
      text: extracted.text,
      context: extracted.context,
      color: pickedColor,
      noteText: noteDraft.trim(),
    });
    showToast(noteDraft.trim() ? '已写笔记' : '已高亮');
    sel.removeAllRanges();
    setPos(null);
    setMode('main');
    setNoteDraft('');
  };

  const doDeleteNote = (n: Note) => {
    if (!slug) return;
    deleteNote(slug, n.id);
    showToast('已删除');
    setEditingNote(null);
    setPos(null);
    setMode('main');
  };

  const doShare = () => {
    if (!slug) return;
    const sel = window.getSelection();
    if (!sel) return;
    const text = sel.toString().trim();
    if (!text) return;
    const url = `${window.location.origin}/article/${slug}?quote=${encodeURIComponent(text.slice(0, 100))}`;
    // 简单做 — 复制带锚的链接,后续可扩展生成 PNG
    navigator.clipboard.writeText(url).then(
      () => showToast('已复制带引用链接'),
      () => showToast('复制失败'),
    );
    sel.removeAllRanges();
    setPos(null);
  };

  const doEditNote = (n: Note) => {
    setEditingNote(n);
    setNoteDraft(n.noteText || '');
    setMode('note');
    // 模拟 selection 定位到原 mark 上方
    const mark = document.querySelector(`mark[data-note-id="${n.id}"]`);
    if (mark) {
      const rect = mark.getBoundingClientRect();
      setPos(computePosition(rect));
    }
  };

  // 渲染
  if (!pos) {
    return toast ? (
      <ToastBubble message={toast} />
    ) : null;
  }

  return (
    <>
      <div
        ref={toolbarRef}
        role="toolbar"
        aria-label="选段操作"
        className="fixed z-[80] fade-in-up"
        style={{
          top: pos.top,
          left: pos.left,
          transform: pos.placement === 'top' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
        }}
        onMouseDown={(e) => e.preventDefault()} /* 防止点击按钮时 selection 丢失 */
      >
        <div className="relative bg-ink text-paper rounded-sm shadow-2xl px-1.5 py-1 flex items-center gap-0.5">
          {mode === 'main' && (
            <MainActions
              onCopy={doCopy}
              onHighlight={() => setMode('highlight')}
              onNote={() => {
                setMode('note');
                setNoteDraft('');
                setEditingNote(null);
              }}
              onShare={doShare}
            />
          )}
          {mode === 'highlight' && (
            <ColorPicker
              picked={pickedColor}
              onPick={(c) => {
                setPickedColor(c);
                doHighlight();
              }}
              onCancel={() => setMode('main')}
            />
          )}
          {mode === 'note' && (
            <NoteInput
              draft={noteDraft}
              setDraft={setNoteDraft}
              onSave={doSaveNote}
              onCancel={() => {
                setMode('main');
                setEditingNote(null);
                setNoteDraft('');
              }}
              onDelete={editingNote ? () => doDeleteNote(editingNote) : undefined}
              isEditing={!!editingNote}
            />
          )}
        </div>
        {/* 箭头 */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-ink"
          style={{
            [pos.placement === 'top' ? 'bottom' : 'top']: '-4px',
            transform: `translateX(-50%) rotate(45deg)`,
          }}
          aria-hidden="true"
        />
      </div>
      {toast && <ToastBubble message={toast} />}
    </>
  );
}

function computePosition(rect: DOMRect): Position {
  const TOOLBAR_HEIGHT = 40; // 工具条大致高度
  const GAP = 10;
  const margin = 12;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const tw = 280; // 工具条大致宽度,实际靠 transform 居中

  // 优先上方,空间不够放下方
  let top = rect.top - TOOLBAR_HEIGHT - GAP;
  let placement: 'top' | 'bottom' = 'top';
  if (top < margin) {
    top = rect.bottom + GAP;
    placement = 'bottom';
  }

  // 横向居中,clamp 到视口
  let left = rect.left + rect.width / 2;
  left = Math.max(tw / 2 + margin, Math.min(vw - tw / 2 - margin, left));

  // 防止超底
  if (top + TOOLBAR_HEIGHT > vh - margin) {
    top = vh - TOOLBAR_HEIGHT - margin;
  }
  return { top, left, placement };
}

// ---------- 子组件 ----------

function MainActions({
  onCopy,
  onHighlight,
  onNote,
  onShare,
}: {
  onCopy: () => void;
  onHighlight: () => void;
  onNote: () => void;
  onShare: () => void;
}) {
  return (
    <>
      <ToolbarButton onClick={onCopy} label="复制选区" icon={<IconCopy />} />
      <ToolbarButton onClick={onHighlight} label="高亮(三色)" icon={<IconHighlight />} />
      <ToolbarButton onClick={onNote} label="写笔记" icon={<IconNote />} />
      <ToolbarButton onClick={onShare} label="复制带引用链接" icon={<IconShare />} />
    </>
  );
}

function ColorPicker({
  picked,
  onPick,
  onCancel,
}: {
  picked: NoteColor;
  onPick: (c: NoteColor) => void;
  onCancel: () => void;
}) {
  return (
    <>
      {NOTE_COLORS.map((c) => (
        <button
          key={c.value}
          onClick={() => onPick(c.value)}
          className="px-2.5 py-1.5 text-xs flex items-center gap-1.5 rounded-sm hover:bg-paper/10 transition-colors"
          aria-label={`${c.label}高亮`}
        >
          <span
            className="w-3.5 h-3.5 rounded-sm border border-paper/30"
            style={{ backgroundColor: c.value === 'ink' ? '#E8E2D5' : c.value === 'gold' ? '#C9A875' : '#D65A5A' }}
          />
          <span>{c.label}</span>
        </button>
      ))}
      <button
        onClick={onCancel}
        className="px-2 py-1.5 text-xs text-paper/70 hover:text-paper transition-colors"
        aria-label="取消"
      >
        取消
      </button>
    </>
  );
}

function NoteInput({
  draft,
  setDraft,
  onSave,
  onCancel,
  onDelete,
  isEditing,
}: {
  draft: string;
  setDraft: (s: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
  isEditing: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  return (
    <>
      {onDelete && (
        <button
          onClick={onDelete}
          className="p-2 rounded-sm hover:bg-cinnabar/20 text-paper/70 hover:text-paper transition-colors"
          title="删除这条笔记"
          aria-label="删除这条笔记"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
          </svg>
        </button>
      )}
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSave();
          if (e.key === 'Escape') onCancel();
        }}
        placeholder={isEditing ? '编辑批注…' : '写点什么(可空)'}
        maxLength={140}
        className="bg-transparent text-paper placeholder:text-paper/40 text-xs px-2 py-1.5 outline-none w-44"
      />
      <button
        onClick={onSave}
        className="px-2.5 py-1.5 text-xs bg-cinnabar text-paper rounded-sm hover:bg-cinnabar-dark transition-colors font-medium"
      >
        保存
      </button>
    </>
  );
}

function ToolbarButton({
  onClick,
  label,
  icon,
}: {
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="p-2 rounded-sm hover:bg-paper/10 transition-colors text-paper/90 hover:text-paper"
    >
      {icon}
    </button>
  );
}

function ToastBubble({ message }: { message: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-1/2 -translate-x-1/2 bottom-[10rem] z-[80] px-4 py-2 bg-ink/90 text-paper text-sm rounded-sm shadow-2xl backdrop-blur-sm fade-in-up"
    >
      {message}
    </div>
  );
}

// ---------- 图标 ----------

function IconCopy() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}
function IconHighlight() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  );
}
function IconNote() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}
function IconShare() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  );
}

// ---------- 高亮注入(把 notes 里的 text 注入为 <mark>) ----------

function applyHighlights(slug: string) {
  if (typeof document === 'undefined') return;
  const container = document.querySelector('.prose-article');
  if (!container) return;

  unwrapAll(container);

  const notes = getNotes(slug);
  for (const note of notes) {
    wrapText(container, note.text, note.id, note.color);
  }
}

function unwrapAll(container: Element) {
  const marks = container.querySelectorAll('mark.dt-highlight');
  marks.forEach((m) => {
    const parent = m.parentNode;
    if (!parent) return;
    while (m.firstChild) parent.insertBefore(m.firstChild, m);
    parent.removeChild(m);
  });
  container.normalize();
}

function wrapText(container: Element, searchText: string, noteId: string, color: NoteColor) {
  if (!searchText) return;
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      // 跳过已经在 mark.dt-highlight 里的文本
      let p: HTMLElement | null = node.parentElement;
      while (p && p !== container) {
        if (p.tagName === 'MARK' && p.classList.contains('dt-highlight')) {
          return NodeFilter.FILTER_REJECT;
        }
        p = p.parentElement;
      }
      return node.textContent?.includes(searchText)
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });

  const found: Text[] = [];
  let n: Node | null;
  while ((n = walker.nextNode())) found.push(n as Text);

  for (const textNode of found) {
    const text = textNode.textContent || '';
    const idx = text.indexOf(searchText);
    if (idx < 0) continue;
    const before = text.slice(0, idx);
    const middle = text.slice(idx, idx + searchText.length);
    const after = text.slice(idx + searchText.length);

    const parent = textNode.parentNode;
    if (!parent) continue;

    const beforeNode = document.createTextNode(before);
    const afterNode = document.createTextNode(after);
    const mark = document.createElement('mark');
    mark.className = `dt-highlight note-${color}`;
    mark.dataset.noteId = noteId;
    mark.textContent = middle;

    parent.insertBefore(beforeNode, textNode);
    parent.insertBefore(mark, textNode);
    parent.insertBefore(afterNode, textNode);
    parent.removeChild(textNode);
  }
}
