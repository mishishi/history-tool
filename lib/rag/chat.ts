/**
 * LLM Chat — 流式回答
 *
 * 设计:
 * - 输入:用户问题 + 检索到的相关文章片段
 * - 输出:流式文本(OpenAI SDK 风格 ReadableStream)
 * - System prompt 明确"通鉴助手"身份 + 引用要求
 */
import type { Stream } from 'openai/streaming';
import { getRagConfig } from './config';
import type { SearchHit } from './search';

export interface ChatDeps {
  question: string;
  hits: SearchHit[];
}

const SYSTEM_PROMPT = `你是「读通鉴」的 AI 助手 — 一个把 1362 年资治通鉴翻译成当代人听得懂、用得上的顾问。

# 你的来源
你只能基于提供的「相关解读」回答,不能编造。如果用户问题超出你的来源,坦诚说"这个暂时没有相关解读"并建议换个问法。

# 回答风格
- 用现代人听得懂的话:领导力/创业/团队/决策/改革 等现实概念
- 短句为主,避免学术腔
- 引用具体文章时,简要说哪个朝代、什么事件
- 用户问"我应该怎么办"时,给 2-3 条 actionable 建议,别空话

# 输出格式
- 中文
- 段落分明(用空行)
- 关键人物/事件用「」或**加粗**
- 不要 markdown 标题符(井号),用空行分段

# 重要边界
- 资治通鉴写的是 1362 年(前 403 - 959)中国历史,用户问现代/外国话题时承认边界
- 不预测未来,不做投资/医疗建议
- 回答控制在 300 字内,除非用户明确要展开`;

/**
 * 把检索到的 hits 拼成 system context
 */
function buildContext(hits: SearchHit[]): string {
  if (hits.length === 0) return '(没有检索到相关解读)';
  return hits
    .map(
      (h, i) =>
        `【解读 ${i + 1}】${h.dynasty} · ${h.era} · ${h.title}\n${h.excerpt}`,
    )
    .join('\n\n');
}

export async function* streamAnswer(
  deps: ChatDeps,
): AsyncGenerator<string, void, void> {
  const { question, hits } = deps;
  const { chat, model } = getRagConfig();

  const context = buildContext(hits);
  const userPrompt = `# 相关解读\n\n${context}\n\n# 用户问题\n${question}`;

  const stream = await chat.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 800,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices?.[0]?.delta?.content;
    if (content) yield content;
  }
}
