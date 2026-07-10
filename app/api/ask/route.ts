/**
 * POST /api/ask — AI 问典
 *
 * Body: { question: string }
 * Response: text/event-stream,事件流形式
 *   - event: "hits"  data: JSON.stringify([{title, slug, era, score}])
 *   - event: "delta" data: "增量文字"
 *   - event: "done"  data: "[DONE]"
 *
 * 为什么不直接用 OpenAI 的 stream 转发?
 * - 要在 stream 之前先返回"用了哪些文章"作为参考
 * - SSE 多事件类型更可控
 */
import { NextRequest } from 'next/server';
import { searchArticles } from '@/lib/rag/search';
import { streamAnswer } from '@/lib/rag/chat';
import { isRagConfigured } from '@/lib/rag/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// AI 回答可能 5-10s,延长超时
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  if (!isRagConfigured()) {
    return new Response(
      JSON.stringify({
        error: 'RAG_NOT_CONFIGURED',
        message: 'AI 问典功能暂未配置。需要在 .env.local 设置 LLM_API_KEY 和 Upstash Vector。',
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  let body: { question?: string };
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const question = (body.question || '').trim();
  if (!question) {
    return new Response('Missing question', { status: 400 });
  }
  if (question.length > 500) {
    return new Response('Question too long (max 500 chars)', { status: 400 });
  }

  // 1. 检索
  let hits;
  try {
    hits = await searchArticles(question, 3);
  } catch (err) {
    console.error('[ai-ask] search error:', err);
    return new Response(
      JSON.stringify({
        error: 'SEARCH_FAILED',
        message: '检索服务异常,请稍后重试',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // 2. 流式生成
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // 先发检索结果(让 UI 立刻显示"基于哪些文章回答")
      controller.enqueue(
        encoder.encode(`event: hits\ndata: ${JSON.stringify(hits.map((h) => ({ title: h.title, slug: h.slug, era: h.era, dynasty: h.dynasty, score: h.score })))}\n\n`),
      );

      // 流式发 LLM 输出
      try {
        for await (const delta of streamAnswer({ question, hits })) {
          controller.enqueue(
            encoder.encode(`event: delta\ndata: ${JSON.stringify(delta)}\n\n`),
          );
        }
      } catch (err) {
        console.error('[ai-ask] stream error:', err);
        controller.enqueue(
          encoder.encode(
            `event: error\ndata: ${JSON.stringify({ message: 'AI 服务暂时不可用' })}\n\n`,
          ),
        );
      }

      controller.enqueue(encoder.encode(`event: done\ndata: [DONE]\n\n`));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
