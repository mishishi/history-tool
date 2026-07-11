'use client';

// 读通鉴 — 选段笔记 + 高亮(localStorage 包装)
//
// 键:
//   dt-notes : { [slug: string]: Note[] }
//
// Note 不存 DOM offset(文章内容变化会失效),只存:
//   - text: 选中的纯文字(用于匹配+展示)
//   - context: 选区前后 ~80 字(用于在文章内定位 + 显示「上下文」)
//   - color: 高亮颜色(cinnabar / gold / ink)
//   - noteText: 用户批注(可选)
//
// 设计要点(跟 user-data / user-preferences 同套):
//   - 'use client' 才 import
//   - localStorage 操作都包 try/catch
//   - 提供订阅机制,SelectionToolbar / 笔记面板 / 高亮注入能同步状态

const KEY = 'dt-notes';

export type NoteColor = 'cinnabar' | 'gold' | 'ink';

export interface Note {
  id: string;
  slug: string;
  text: string;
  /** 选区前后各 80 字(原文),用于在文章内定位 + 列表展示上下文 */
  context: string;
  color: NoteColor;
  /** 用户批注 — 可选,空字符串等同于无批注 */
  noteText: string;
  createdAt: number;
}

type NotesMap = Record<string, Note[]>;

type Listener = (map: NotesMap) => void;
const listeners = new Set<Listener>();

function notify(map: NotesMap) {
  listeners.forEach((l) => l(map));
}

function readAll(): NotesMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as NotesMap;
  } catch {
    return {};
  }
}

function writeAll(map: NotesMap) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* 容量超限 / 隐私模式 — 静默 */
  }
}

function genId(): string {
  return `n_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** 取某篇文章的全部笔记 */
export function getNotes(slug: string): Note[] {
  const all = readAll();
  return Array.isArray(all[slug]) ? all[slug] : [];
}

/** 取全部笔记(平铺,按时间倒序) */
export function getAllNotes(): Note[] {
  const all = readAll();
  const out: Note[] = [];
  for (const slug of Object.keys(all)) {
    const list = all[slug];
    if (Array.isArray(list)) out.push(...list);
  }
  return out.sort((a, b) => b.createdAt - a.createdAt);
}

export function addNote(input: Omit<Note, 'id' | 'createdAt'>): Note {
  const all = readAll();
  const list = Array.isArray(all[input.slug]) ? all[input.slug] : [];
  const note: Note = {
    ...input,
    id: genId(),
    createdAt: Date.now(),
  };
  list.push(note);
  all[input.slug] = list;
  writeAll(all);
  notify(all);
  return note;
}

export function updateNote(slug: string, id: string, patch: Partial<Note>): void {
  const all = readAll();
  const list = Array.isArray(all[slug]) ? all[slug] : [];
  const i = list.findIndex((n) => n.id === id);
  if (i < 0) return;
  list[i] = { ...list[i], ...patch };
  all[slug] = list;
  writeAll(all);
  notify(all);
}

export function deleteNote(slug: string, id: string): void {
  const all = readAll();
  const list = Array.isArray(all[slug]) ? all[slug] : [];
  const next = list.filter((n) => n.id !== id);
  all[slug] = next;
  writeAll(all);
  notify(all);
}

export function subscribeNotes(cb: Listener): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/**
 * 从选区提取选中的纯文字 + 上下文(选区前后各 ~80 字)
 * 用于新建 Note 的 text / context 字段
 */
export function extractFromSelection(
  container: HTMLElement,
  sel: Selection,
): { text: string; context: string } | null {
  if (!sel.rangeCount) return null;
  const range = sel.getRangeAt(0);

  // 选区必须在 container 内
  if (!container.contains(range.commonAncestorContainer)) return null;

  const text = sel.toString().trim();
  if (text.length < 2) return null;
  if (text.length > 500) return null; // 一次选太长,通常不是"想记"的

  // 取整段正文纯文字(用 container.textContent 简化 — 不强求精确位置)
  const fullText = container.textContent || '';
  const idx = fullText.indexOf(text);
  if (idx < 0) {
    // 跨节点 / 行内多个 textNode 拼接,indexOf 失败 → 用 range 起止 offset
    const pre = range.cloneRange();
    pre.selectNodeContents(container);
    pre.setEnd(range.startContainer, range.startOffset);
    const start = pre.toString().length;
    return {
      text,
      context: sliceContext(fullText, start, start + text.length),
    };
  }
  return {
    text,
    context: sliceContext(fullText, idx, idx + text.length),
  };
}

function sliceContext(full: string, start: number, end: number): string {
  const PRE = 80;
  const POST = 80;
  const a = Math.max(0, start - PRE);
  const b = Math.min(full.length, end + POST);
  let s = full.slice(a, start);
  let e = full.slice(end, b);
  if (a > 0) s = '…' + s;
  if (b < full.length) e = e + '…';
  return (s + textEllipsis + e).replace(/\s+/g, ' ').trim();
}

// 注:实际拼装时,中间用「选区省略号」标识一下,看笔记列表时能区分选区起止
const textEllipsis = ' ⟦…⟧ ';

/** 给定 slug,拿到所有笔记的 text — 用于高亮注入 */
export function getHighlightTexts(slug: string): { text: string; color: NoteColor; id: string }[] {
  return getNotes(slug).map((n) => ({ text: n.text, color: n.color, id: n.id }));
}

/** 全文章颜色 — 用于 favorites 笔记 section */
export const NOTE_COLORS: { value: NoteColor; label: string; cls: string; light: string; dark: string }[] = [
  { value: 'cinnabar', label: '朱红', cls: 'note-cinnabar', light: 'rgba(178,58,58,0.18)', dark: 'rgba(214,90,90,0.25)' },
  { value: 'gold',     label: '金色', cls: 'note-gold',     light: 'rgba(168,137,92,0.22)', dark: 'rgba(201,168,117,0.28)' },
  { value: 'ink',      label: '墨色', cls: 'note-ink',      light: 'rgba(26,26,26,0.10)',   dark: 'rgba(232,226,213,0.18)' },
];
