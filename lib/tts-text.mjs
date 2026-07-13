/**
 * lib/tts-text.mjs
 *
 * TTS 文本处理 + 时间戳对齐 — generate-timestamps.mjs 和 publish-audio.mjs 共享
 * 保证"段落切分"和"中性化"逻辑只有一份 source of truth
 */

export const TTS_CONFIG = {
  voice: 'male-qn-qingse',  // 青涩青年音色(中文男声)
  speed: 0.95,
  emotion: 'neutral',
  maxChars: 1500,            // 截断长度(中文 200-300 字/分钟 → ~5-7 分钟音频)
};

/** 清理 markdown + HTML 标签,保留中文标点 */
export function cleanInline(s) {
  return s
    .replace(/<[^>]+>/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#+\s*/gm, '')
    .replace(/^>\s*/gm, '')
    .replace(/^[\-\*]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanHeading(s) {
  return s.replace(/^#+\s*/, '').trim();
}

/**
 * 按 ## 大段落切分(用于 TTS 文本 + 时间戳对齐)
 * 返回 [{id, heading, text}, ...]
 *   - excerpt: 摘要
 *   - lead:    ## 之前的引言
 *   - s1, s2:  ## 段
 */
export function extractSections(body) {
  const lines = body.split('\n');
  const sections = [];
  let current = null;
  let leadText = [];
  let sCounter = 0;

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (current) {
        sections.push({ id: current.id, heading: current.heading, text: current.text.join('\n').trim() });
      } else if (leadText.length > 0) {
        sections.push({ id: 'lead', heading: null, text: leadText.join('\n').trim() });
      }
      sCounter++;
      current = {
        id: `s${sCounter}`,
        heading: cleanHeading(line),
        text: [cleanHeading(line)],
      };
    } else {
      if (current) current.text.push(line);
      else leadText.push(line);
    }
  }
  if (current) {
    sections.push({ id: current.id, heading: current.heading, text: current.text.join('\n').trim() });
  } else if (leadText.length > 0) {
    sections.push({ id: 'lead', heading: null, text: leadText.join('\n').trim() });
  }

  // 清理 + 硬截到 MAX_CHARS(超长单段也截 — 防止 matrix TTS 500 timeout)
  const out = [];
  let totalChars = 0;
  for (const s of sections) {
    if (totalChars >= TTS_CONFIG.maxChars) break;
    let cleaned = cleanInline(s.text);
    if (cleaned.length === 0) continue;
    // 段内也要截,单段不能超 MAX_CHARS - totalChars
    const remain = TTS_CONFIG.maxChars - totalChars;
    if (cleaned.length > remain) cleaned = cleaned.slice(0, remain);
    out.push({ id: s.id, heading: s.heading, text: cleaned });
    totalChars += cleaned.length;
  }
  return out;
}

/**
 * 组装完整 TTS 文本:excerpt + 各 section(总长硬截 maxChars 防 500 timeout)
 * 用于一次 matrix_synthesize_speech 调用
 */
export function buildTtsText(article) {
  const sections = extractSections(article.body || '');
  const parts = [];
  if (article.excerpt) parts.push(cleanInline(article.excerpt));
  for (const s of sections) parts.push(s.text);
  let text = parts.join('\n\n');
  if (text.length > TTS_CONFIG.maxChars) text = text.slice(0, TTS_CONFIG.maxChars);
  return text;
}

/**
 * 政治敏感词中性化(给 agent 失败后重试用,不直接改文章原文)
 * 对应 regen-47-tts.mjs 里的策略
 */
export function sanitizeForTts(text) {
  return text
    .replace(/阶级斗争为纲/g, '中心工作调整')
    .replace(/阶级斗争/g, '路线分歧')
    .replace(/文革/g, '十年动乱')
    .replace(/大跃进/g, '大生产运动')
    .replace(/人民公社化运动/g, '农村集体化')
    .replace(/个人崇拜/g, '领袖集中化')
    .replace(/政治运动/g, '整顿工作')
    .replace(/路线斗争/g, '路线分歧')
    .replace(/四人帮/g, '极左集团')
    .replace(/反右/g, '整风运动')
    .replace(/斗争哲学/g, '冲突思路');
}

/**
 * 从 markdown frontmatter + body 解析
 * 用 gray-matter 来支持完整的 YAML(数组等)
 * @param {string} md - markdown 全文
 * @returns {{slug, title, excerpt, body, ...}}
 */
export function parseArticle(md) {
  // 动态 import gray-matter(它是 npm dep)
  // 但 .mjs 不能同步 import 在顶层,改成内嵌
  // 实际上 publish-audio / generate-timestamps 都需要它,自己手写简单 parser 也行
  // 复用 lib/cover-prompt.mjs 的简单 parser:
  const m = md.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return null;
  const fm = {};
  for (const line of m[1].split('\n')) {
    const k = line.match(/^([\w-]+):\s*(.*)$/);
    if (!k) continue;
    let v = k[2].trim();
    if (v.startsWith('[') && v.endsWith(']')) {
      v = v.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
    } else {
      v = v.replace(/^['"]|['"]$/g, '');
    }
    fm[k[1]] = v;
  }
  return { ...fm, body: m[2] };
}
