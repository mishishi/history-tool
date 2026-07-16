'use client';

import { useState, useRef, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import { track } from '@/lib/analytics';

interface Hit {
  title: string;
  slug: string;
  era: string;
  dynasty: string;
  score: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  hits?: Hit[];
  streaming?: boolean;
  error?: string;
}

const SUGGESTED = [
  // 3 个新手友好型问题(覆盖'看热闹/学经验/反思自己' 3 个心理)
  // 1. 看热闹: 故事性 → 直接好玩
  '玄武门之变跟靖难之役有何相似?',
  // 2. 学经验: 实用性 → 立刻用得上
  '改革为什么总是失败?',
  // 3. 反思自己: 代入感 → 个人决策
  '在公司里怎么当一个不被架空的"曹操"?',
];

// localStorage 持久化 — AI 问典 history 不该刷新即失
// 限制 50 条防止 localStorage 撑爆(每条 ~2KB, 上限 ~100KB)
const ASK_HISTORY_KEY = 'dt-ask-history';
const ASK_HISTORY_MAX = 50;

function loadHistory(): Message[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ASK_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (m: unknown) =>
          m &&
          typeof m === 'object' &&
          (m as Message).role &&
          typeof (m as Message).content === 'string' &&
          ((m as Message).role === 'user' || (m as Message).role === 'assistant'),
      )
      .slice(-ASK_HISTORY_MAX);
  } catch {
    return [];
  }
}

function saveHistory(messages: Message[]) {
  if (typeof window === 'undefined') return;
  try {
    // 只存 user 提问 + assistant 文本(去掉 streaming/error 等 transient 字段)
    const compact = messages
      .filter((m) => m.content)
      .slice(-ASK_HISTORY_MAX)
      .map((m) => ({ role: m.role, content: m.content, hits: m.hits }));
    localStorage.setItem(ASK_HISTORY_KEY, JSON.stringify(compact));
  } catch {
    /* ignore */
  }
}

/**
 * AI 问典 — ChatGPT 风格聊天 UI
 * - 输入在底部
 * - AI 回答流式显示(逐字)
 * - 每条 AI 消息显示基于哪些文章
 * - 「重新开始」清空历史
 */
export default function AskChat() {
  // 初始 mount 时从 localStorage 恢复(避开 SSR,先空数组,挂载后再读)
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // mount 时读 localStorage
  useEffect(() => {
    setMessages(loadHistory());
  }, []);

  // 消息变化时持久化(节流:同一帧多次更新只写 1 次)
  useEffect(() => {
    if (messages.length === 0) return;
    saveHistory(messages);
  }, [messages]);

  // 新消息自动滚到底
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  const send = async (question: string) => {
    if (!question.trim() || loading) return;

    // 加 user message + assistant placeholder
    const userMsg: Message = { role: 'user', content: question };
    setMessages((m) => [...m, userMsg, { role: 'assistant', content: '', streaming: true }]);
    setInput('');
    setLoading(true);
    // 埋点: ask_submit — 算'开始问'漏斗顶端
    track('ask_submit', { questionLength: question.trim().length });
    const startTime = Date.now();

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setMessages((m) =>
          m.map((msg, i) =>
            i === m.length - 1
              ? { ...msg, error: err.message || `请求失败 (${res.status})`, streaming: false }
              : msg,
          ),
        );
        track('ask_response_done', { status: res.status, durationMs: Date.now() - startTime });
        return;
      }

      // 解析 SSE
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantStarted = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // 按 \n\n 分块解析 SSE
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const evt of events) {
          if (!evt.trim()) continue;
          const lines = evt.split('\n');
          let eventType = 'message';
          let data = '';
          for (const line of lines) {
            if (line.startsWith('event: ')) eventType = line.slice(7).trim();
            else if (line.startsWith('data: ')) data += line.slice(6);
          }
          if (!data) continue;

          if (eventType === 'hits') {
            const hits: Hit[] = JSON.parse(data);
            setMessages((m) =>
              m.map((msg, i) => (i === m.length - 1 ? { ...msg, hits } : msg)),
            );
          } else if (eventType === 'delta') {
            const delta = JSON.parse(data);
            if (!assistantStarted) assistantStarted = true;
            setMessages((m) =>
              m.map((msg, i) =>
                i === m.length - 1 ? { ...msg, content: msg.content + delta } : msg,
              ),
            );
          } else if (eventType === 'error') {
            const { message } = JSON.parse(data);
            setMessages((m) =>
              m.map((msg, i) =>
                i === m.length - 1 ? { ...msg, error: message, streaming: false } : msg,
              ),
            );
          } else if (eventType === 'done') {
            setMessages((m) =>
              m.map((msg, i) =>
                i === m.length - 1 ? { ...msg, streaming: false } : msg,
              ),
            );
          }
        }
      }
    } catch (err) {
      console.error('[ask-chat] fetch error:', err);
      setMessages((m) =>
        m.map((msg, i) =>
          i === m.length - 1
            ? { ...msg, error: '网络异常,请重试', streaming: false }
            : msg,
        ),
      );
    } finally {
      setLoading(false);
      // 埋点: 响应结束 (无论成功失败)
      track('ask_response_done', { durationMs: Date.now() - startTime });
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const reset = () => {
    setMessages([]);
    setInput('');
    // 同步清 localStorage,避免下次 mount 又恢复
    try {
      localStorage.removeItem(ASK_HISTORY_KEY);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-280px)] min-h-[500px]">
      {/* 消息区 */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto py-4 space-y-5"
      >
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-block px-4 py-1.5 bg-cinnabar/10 text-cinnabar text-xs tracking-widest rounded-sm mb-4">
              AI 问典 · 100 篇解读
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-ink mb-3">
              问点什么?
            </h2>
            <p className="text-sm text-ink-mute mb-8 max-w-sm mx-auto">
              基于 100 篇通鉴解读,基于原文回答,不会编造。
            </p>
            <div className="flex flex-col gap-2.5 max-w-md mx-auto">
              {SUGGESTED.map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    track('ask_submit', { questionLength: q.length, source: 'preset' });
                    send(q);
                  }}
                  className="group text-left text-sm px-4 py-3 bg-paper-card border border-border hover:border-cinnabar hover:bg-cinnabar/5 rounded-sm transition-all"
                >
                  <span className="inline-block text-cinnabar mr-2 opacity-50 group-hover:opacity-100 transition-opacity">→</span>
                  {q}
                </button>
              ))}
            </div>
            <p className="text-xs text-ink-mute mt-6">
              也可输入自己的问题,按 Enter 发送
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}
      </div>

      {/* 输入区 */}
      <form onSubmit={onSubmit} className="border-t border-border bg-paper/95 backdrop-blur-md py-3">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => {
              // 移动端键盘弹起时,把输入框滚到视口里(避免被键盘遮)
              // 用 setTimeout 是等 iOS Safari 键盘动画完成
              setTimeout(() => {
                inputRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
              }, 300);
            }}
            placeholder="问点什么... (按 Enter 发送)"
            disabled={loading}
            // 移动端键盘优化:
            //  - inputMode='text' 强制显示普通文字键盘(不是 URL 键盘/数字键盘)
            //  - enterKeyHint='send' 键盘右下角显示「发送」按钮(而不是回车)
            //  - autoComplete='off' 关掉输入建议(中文不需要)
            //  - inputMode + 中文输入会显示普通键盘 + 中文标点切换栏
            inputMode="text"
            enterKeyHint="send"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            className="flex-1 px-4 py-3 bg-paper-card border border-border rounded-sm text-sm focus:border-cinnabar focus:outline-none disabled:opacity-50"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-5 py-3 bg-cinnabar hover:bg-cinnabar-dark text-paper text-sm rounded-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '…' : '发送'}
          </button>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={reset}
              disabled={loading}
              className="px-3 py-3 text-ink-mute hover:text-ink text-xs transition-colors"
              aria-label="重新开始"
            >
              重新开始
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] px-4 py-2.5 bg-cinnabar text-paper text-sm rounded-sm">
          {msg.content}
        </div>
      </div>
    );
  }

  // assistant
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] space-y-2">
        {/* 参考来源 — N 篇相关解读(让用户立刻知道 AI 在基于什么) */}
        {msg.hits && msg.hits.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[10px] text-ink-mute">
              <span className="uppercase tracking-widest">基于 {msg.hits.length} 篇相关解读</span>
              <span className="w-1 h-1 rounded-full bg-ink-mute/40" />
              <span className="text-ink-mute/70">新窗口打开</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {msg.hits.map((h) => (
                <Link
                  key={h.slug}
                  href={`/article/${h.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-1 bg-cinnabar-soft text-cinnabar-dark border border-cinnabar/20 rounded-sm hover:bg-cinnabar hover:text-paper transition-colors text-[11px]"
                  title={`${h.title}\n\n基于该解读回答, 点开新窗口`}
                >
                  <span className="font-medium">{h.dynasty}</span>
                  <span className="opacity-60">·</span>
                  <span className="opacity-90">{h.era}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 内容 */}
        {msg.error ? (
          <div className="px-4 py-2.5 bg-cinnabar-soft text-cinnabar-dark text-sm rounded-sm border border-cinnabar/30">
            {msg.error}
          </div>
        ) : (
          <div className="px-4 py-3 bg-paper-card border border-border text-sm text-ink leading-relaxed rounded-sm whitespace-pre-wrap">
            {msg.content}
            {msg.streaming && (
              <span className="inline-block w-1.5 h-4 bg-cinnabar ml-0.5 animate-pulse align-middle" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
