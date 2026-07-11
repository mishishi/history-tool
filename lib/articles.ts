import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import type { Article, ArticleMeta, Classic, KeyFigure } from './types';
import { findDynasty } from './dynasties';

const ARTICLES_DIR = path.join(process.cwd(), 'content', 'articles');
const CLASSICS_DIR = path.join(process.cwd(), 'content', 'classics');

/**
 * 读取所有文章(按发布时间倒序)
 */
export function getAllArticles(): ArticleMeta[] {
  if (!fs.existsSync(ARTICLES_DIR)) {
    return [];
  }

  const files = fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith('.md'));

  const articles = files.map((file) => {
    const slug = file.replace(/\.md$/, '');
    const filePath = path.join(ARTICLES_DIR, file);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(fileContents);

    return {
      slug,
      classicalSlug: data.classicalSlug || slug,
      title: data.title || '',
      subtitle: data.subtitle || '',
      dynasty: data.dynasty || '战国',
      volume: data.volume || '',
      episode: data.episode || 1,
      excerpt: data.excerpt || '',
      classicalQuote: data.classicalQuote || '',
      readingTime: data.readingTime || 8,
      views: data.views || 0,
      publishedAt: data.publishedAt || new Date().toISOString(),
      tags: data.tags || [],
    } as ArticleMeta;
  });

  return articles.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

/**
 * 读取单个文章(含正文)
 */
export function getArticleBySlug(slug: string): Article | null {
  const filePath = path.join(ARTICLES_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);

  return {
    slug,
    classicalSlug: data.classicalSlug || slug,
    title: data.title || '',
    subtitle: data.subtitle || '',
    dynasty: data.dynasty || '战国',
    volume: data.volume || '',
    episode: data.episode || 1,
    excerpt: data.excerpt || '',
    classicalQuote: data.classicalQuote || '',
    readingTime: data.readingTime || 8,
    views: data.views || 0,
    publishedAt: data.publishedAt || new Date().toISOString(),
    tags: data.tags || [],
    content,
  };
}

/**
 * 读取经典原文(资治通鉴片段 + 背景 + 关键人物)
 */
export function getClassicBySlug(slug: string): Classic | null {
  const filePath = path.join(CLASSICS_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data } = matter(fileContents);

  return {
    slug: data.slug || slug,
    dynasty: data.dynasty || '战国',
    volume: data.volume || '',
    period: data.period || '',
    classicalText: data.classicalText || '',
    background: data.background || '',
    keyFigures: data.keyFigures || [],
  };
}

// 日期格式化函数已抽到 lib/date.ts(纯 JS,client/server 都能用)
// DYNASTIES 抽到 lib/dynasties.ts(纯数据,无 fs 依赖,client 能用)
// 这里 re-export 保持向后兼容
export { formatDate, formatRelativeDate } from './date';
export { DYNASTIES, findDynasty } from './dynasties';
export type { Dynasty } from './dynasties';

/**
 * 推荐相关文章(同朝代 + tag 重叠排序)
 *
 * 算法(无需 LLM/RAG,纯 metadata 排序):
 *  1. 同朝代 +3 分
 *  2. 每个共同 tag +1 分
 *  3. 排除自己
 *  4. 按分数降序,前 topN 篇
 *
 * 为什么不用 RAG: 文章页用 RAG 需要 embed+查询,每次增加 200-500ms 延迟;
 *   metadata 排序在 0.5ms 内完成,体验更好。
 *   留 /ask 页面给 LLM 驱动的"跨篇对话"需求
 *
 * @param slug 当前文章 slug(推荐时排除)
 * @param topN 返回数量(默认 3)
 */
export function getRelatedArticles(slug: string, topN = 3): ArticleMeta[] {
  const all = getAllArticles();
  const cur = all.find((a) => a.slug === slug);
  if (!cur) return [];

  const curTags = new Set(cur.tags || []);

  const scored = all
    .filter((a) => a.slug !== slug)
    .map((a) => {
      let score = 0;
      // 同朝代 +3 分(用归一化朝代 key 避免 战国 vs 战国中后期 误判)
      if (findDynasty(a.dynasty)?.slug === findDynasty(cur.dynasty)?.slug) {
        score += 3;
      }
      // tag 重叠 +1/个
      const aTags = a.tags || [];
      for (const t of aTags) {
        if (curTags.has(t)) score += 1;
      }
      return { article: a, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  return scored.map((x) => x.article);
}

/**
 * 文章目录项
 */
export interface TocItem {
  id: string;
  title: string;
}

/**
 * slug 化:中文保留,英文转小写,空白转 -
 */
function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    // 保留 ASCII 字母数字 + 中文 + 下划线,其他转 -
    .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** HTML 实体 escape,防止标题里出现 < > & " ' 破坏 HTML */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * 从 markdown 内容里提取所有 ## 标题,生成 ToC
 * 同时把 ## 替换为 <h2 id="...">...</h2> HTML,
 * 这样 react-markdown + rehype-raw 渲染时会保留 id(供锚点跳转)
 *
 * 标题内容用 escapeHtml 转义,防止含 < > & 字符破坏 HTML(XSS 防护)
 *
 * 注:之前是 ### / <h3>,改成 ## / <h2> 是为了符合 a11y heading-order 规则
 *    文章页 h1(标题)→ h2(节标题)→ ...,h1 后不能直接跳 h3
 */
export function extractToc(markdown: string, slug?: string): { toc: TocItem[]; content: string } {
  const toc: TocItem[] = [];
  const seen = new Map<string, number>();
  let sCounter = 0; // segment 计数器 — 跟 audio timestamps 的 s1, s2, s3 对应

  const content = markdown.replace(/^## (.+)$/gm, (_, title: string) => {
    const trimmed = title.trim();
    let id = slugify(trimmed);
    const count = seen.get(id) || 0;
    seen.set(id, count + 1);
    if (count > 0) id = `${id}-${count + 1}`;

    toc.push({ id, title: trimmed });

    // 同时注入 data-segment-id 给 audio 段落同步用
    sCounter++;
    const dataSeg = slug ? ` data-segment-id="seg-${slug}-s${sCounter}"` : '';
    return `<h2 id="${id}"${dataSeg}>${escapeHtml(trimmed)}</h2>`;
  });

  return { toc, content };
}