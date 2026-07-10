import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import type { Article, ArticleMeta, Classic, KeyFigure } from './types';

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
export function extractToc(markdown: string): { toc: TocItem[]; content: string } {
  const toc: TocItem[] = [];
  const seen = new Map<string, number>();

  const content = markdown.replace(/^## (.+)$/gm, (_, title: string) => {
    const trimmed = title.trim();
    let id = slugify(trimmed);
    const count = seen.get(id) || 0;
    seen.set(id, count + 1);
    if (count > 0) id = `${id}-${count + 1}`;

    toc.push({ id, title: trimmed });
    return `<h2 id="${id}">${escapeHtml(trimmed)}</h2>`;
  });

  return { toc, content };
}