'use client';

import { useState, useRef, useEffect, type FormEvent } from 'react';
import Link from 'next/link';

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
  '战国怎么当诸侯能活得久?',
  '改革为什么总是失败?',
  '唐玄宗为什么从盛世跌进安史之乱?',
  '在公司里怎么当一个不被架空的"曹操"?',
];

/**
 * AI 问典 — ChatGPT 风格聊天 UI
 * - 输入在底部
 * - AI 回答流式显示(逐字)
 * - 每条 AI 消息显示基于哪些文章
 * - 「重新开始」清空历史
 */
export default function AskChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
      console.error(err);
      setMessages((m) =>
        m.map((msg, i) =>
          i === m.length - 1
            ? { ...msg, error: '网络异常,请重试', streaming: false }
            : msg,
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const reset = () => {
    setMessages([]);
    setInput('');
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
            <p className="text-sm text-ink-mute mb-6">试试问:</p>
            <div className="flex flex-col gap-2 max-w-sm mx-auto">
              {SUGGESTED.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="text-left text-sm px-4 py-2.5 bg-paper-card border border-border hover:border-cinnabar rounded-sm transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
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
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="问点什么... (按 Enter 发送)"
            disabled={loading}
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
        {/* 参考来源 */}
        {msg.hits && msg.hits.length > 0 && (
          <div className="text-[10px] text-ink-mute space-y-1">
            <div className="uppercase tracking-widest">基于这些解读</div>
            <div className="flex flex-wrap gap-1.5">
              {msg.hits.map((h) => (
                <Link
                  key={h.slug}
                  href={`/article/${h.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-cinnabar-soft text-cinnabar-dark border border-cinnabar/20 rounded-sm hover:bg-cinnabar/10 transition-colors"
                  title={h.title}
                >
                  <span className="text-[10px]">{h.dynasty} · {h.era}</span>
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
