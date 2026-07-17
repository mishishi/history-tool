import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import type { Article, ArticleMeta, Classic, KeyFigure } from './types';
import { findDynasty } from './dynasties';

const ARTICLES_DIR = path.join(process.cwd(), 'content', 'articles');
const CLASSICS_DIR = path.join(process.cwd(), 'content', 'classics');

/**
 * 安全解析单篇文章的 frontmatter
 *
 * 历史踩坑 (2026-07-17):
 * - Vercel 环境的 js-yaml 比本地更严,某些 plain unquoted scalar 带 ( ) , 等
 *   特殊字符的会解析失败
 * - 之前:单文件炸 → 整个 next build 报 "Failed to collect page data for /unlock"
 *   整个站点无法部署
 * - 现在:try/catch 包住,失败文件 log 到 stderr,跳过(返回 null)
 *   其他 183 篇正常构建,只丢一篇坏数据
 * - 配合 scripts/validate-articles.mjs 预构建验证,build 前就能发现并修复
 */
function safeParseMatter(
  fileContents: string,
  filename: string,
): ReturnType<typeof matter> | null {
  try {
    return matter(fileContents);
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error(
      `[articles] YAML parse failed for ${filename}:`,
      e?.message || String(e),
    );
    if (e?.mark) {
      // eslint-disable-next-line no-console
      console.error(
        `  → pos ${e.mark.position}, line ${e.mark.line}, col ${e.mark.column}`,
      );
    }
    return null;
  }
}

/**
 * 读取所有文章(按发布时间倒序)
 *
 * 单个文件 YAML 解析失败不会拖垮整个 build — 跳过该文件,其他继续。
 * 配合 scripts/validate-articles.mjs 预构建验证,确保 0 失败。
 */
export function getAllArticles(): ArticleMeta[] {
  if (!fs.existsSync(ARTICLES_DIR)) {
    return [];
  }

  const files = fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith('.md'));

  const articles: ArticleMeta[] = [];
  for (const file of files) {
    const slug = file.replace(/\.md$/, '');
    const filePath = path.join(ARTICLES_DIR, file);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const parsed = safeParseMatter(fileContents, file);
    if (!parsed) continue; // 跳过坏文件,不连累 build

    const { data } = parsed;
    articles.push({
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
    } as ArticleMeta);
  }

  return articles.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

/**
 * 读取单个文章(含正文)
 *
 * 同样 try/catch 包住 — 坏文件返回 null,调用方 notFound() 处理。
 * 不会让 build 进程整体崩。
 */
export function getArticleBySlug(slug: string): Article | null {
  const filePath = path.join(ARTICLES_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContents = fs.readFileSync(filePath, 'utf8');
  const parsed = safeParseMatter(fileContents, `${slug}.md`);
  if (!parsed) return null;
  const { data, content } = parsed;

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
  const parsed = safeParseMatter(fileContents, `${slug}.md (classic)`);
  if (!parsed) return null;
  const { data } = parsed;

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
 * Trending 推荐 — 取代假 views 排序
 *
 * 场景: 首页 "最热 3 篇" 卡片
 * 原: 按 frontmatter `views` 倒序 — 50 篇 views 是手填假数据(1200-12000),
 *    跟"热门"无关,且给用户"3.1k 人读过"的错觉
 * 新: 纯 frontmatter metadata 算出"推荐分"
 *
 * 算法(无 LLM/无 RAG/无 Vercel Analytics — 全部本地):
 *   trending = 0.30 * recency + 0.40 * classic + 0.15 * density + 0.15 * brevity
 *
 *   recency:  0-1, 越近发布分越高,30 天线性衰减
 *             (保证新发布文章能爬上来,不是 50 天前的文章霸榜)
 *   classic:  0-1, 越早(ep 越小)分越高 — 通鉴开篇(ep 1-10)是核心必读
 *             (资治通鉴的"开篇经典"应该前置,像文集的"序"一样)
 *   density:  0-1, tag 数量 / 6 (cap),信息密度高的优先
 *   brevity:  0-1, 8 分钟 = 1, 12 分钟 = 0,短文读完率高
 *
 * 设计取舍:
 *   - 完全不依赖 frontmatter `views`(假数据),等 Vercel Analytics 1 周后
 *     可以再加个 'realViews' 维度,但现在 metadata 排序已经合理
 *   - 用 slug 解析 episode(避免 39-boxer 这种 frontmatter 缺失导致 NaN)
 *   - 同一个 build 周期结果稳定(SSR 友好 + CDN cache 友好)
 *
 * @param topN 返回数量(默认 3)
 * @param excludeSlugs 排除的 slug 列表(典型用法: 排除今日推荐 featured)
 */
export function getTrendingArticles(topN = 3, excludeSlugs: string[] = []): ArticleMeta[] {
  const all = getAllArticles();
  const today = new Date();

  const scored = all
    .filter((a) => !excludeSlugs.includes(a.slug))
    .map((a) => {
      // episode 从 slug 解析(避免 frontmatter 缺失)
      const slugEpMatch = a.slug.match(/^(\d+)-/);
      const episode = slugEpMatch ? parseInt(slugEpMatch[1], 10) : 50;

      const published = new Date(a.publishedAt);
      const daysSince = Math.max(0, (today.getTime() - published.getTime()) / 86_400_000);

      // 4 维特征,全部归一化到 0-1
      const recency = Math.max(0, 1 - daysSince / 30);
      const classic = Math.max(0, 1 - (episode - 1) / 49);
      const density = Math.min((a.tags?.length || 0) / 6, 1);
      const readingTime = a.readingTime || 10;
      const brevity = Math.max(0, 1 - (readingTime - 8) / 4);

      const trending = 0.30 * recency + 0.40 * classic + 0.15 * density + 0.15 * brevity;
      return { article: a, trending };
    })
    .sort((a, b) => b.trending - a.trending)
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