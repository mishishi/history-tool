/**
 * 人物长卷 — 跨 50 篇 classics 聚合 keyFigures
 *
 * 数据来源:content/classics/*.md frontmatter 里的 keyFigures 字段
 * (已经在写文章时人工标注:每个事件 2-4 个关键人物 + 角色)
 *
 * 不依赖 fs:fs 路径在 build 时跑,生成静态数据
 *
 * 重要:articleSlugs 只保留 articles/ 里有对应文章的 slug
 * — classics/ 里 51-reform-start 写了 6 个人物但还没文章,不算
 * — 避免 index 显示 ×3 但 detail 显示 2 篇的不一致
 */
import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import type { KeyFigure } from './types';

const CLASSICS_DIR = path.join(process.cwd(), 'content', 'classics');
const ARTICLES_DIR = path.join(process.cwd(), 'content', 'articles');

/** 提前扫一遍 articles 目录,知道哪些 slug 有对应文章 */
function getArticleSlugSet(): Set<string> {
  if (!fs.existsSync(ARTICLES_DIR)) return new Set();
  return new Set(
    fs.readdirSync(ARTICLES_DIR)
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.replace(/\.md$/, '')),
  );
}

export interface FigureEntry {
  /** 主名(去括号后)— 显示用 + URL slug 双向 */
  name: string;
  /** 别名 / 括号里的其他称呼 */
  aliases: string[];
  /** 第一次出现的角色描述 */
  role: string;
  /** 出现在哪些 *已发布* 文章里(用 classicalSlug)— 已对齐 articles/ 存在性 */
  articleSlugs: string[];
}

/**
 * 读取所有 classics,聚合 keyFigures
 * 同名人物合并:aliases 累积,articleSlugs 累积
 * 只保留 articles/ 里也有对应文章 slug(classics/ 独有的人物不收录)
 */
function aggregateFigures(): FigureEntry[] {
  if (!fs.existsSync(CLASSICS_DIR)) return [];

  const articleSet = getArticleSlugSet();
  const files = fs.readdirSync(CLASSICS_DIR).filter((f) => f.endsWith('.md'));
  const byName = new Map<string, FigureEntry>();

  for (const file of files) {
    const slug = file.replace(/\.md$/, '');
    // 跳过没有对应文章的 classics
    if (!articleSet.has(slug)) continue;

    const raw = fs.readFileSync(path.join(CLASSICS_DIR, file), 'utf8');
    const { data } = matter(raw);
    const figures = (data.keyFigures || []) as (KeyFigure | string)[];

    for (const fig of figures) {
      // 容错两种格式:
      // A. 对象: { name: "智瑶", role: "..." }
      // B. 字符串: "邓小平(1904-1997,...,决策风格:...)"
      let name: string;
      let role: string;

      if (typeof fig === 'string') {
        const idx = fig.indexOf('(');
        if (idx === -1) {
          name = fig.trim();
          role = '';
        } else {
          name = fig.slice(0, idx).trim();
          role = fig.slice(idx + 1, fig.lastIndexOf(')')).trim();
        }
      } else if (fig && typeof fig === 'object' && 'name' in fig) {
        name = String(fig.name).trim();
        role = String(fig.role || '').trim();
      } else {
        continue;
      }

      if (!name) continue;

      const parenMatch = name.match(/^([^()]+)(?:\(([^)]+)\))?$/);
      const primary = parenMatch?.[1]?.trim() || name;
      const alias = parenMatch?.[2]?.trim();

      const existing = byName.get(primary);
      if (existing) {
        if (!existing.articleSlugs.includes(slug)) {
          existing.articleSlugs.push(slug);
        }
        if (alias && !existing.aliases.includes(alias)) {
          existing.aliases.push(alias);
        }
      } else {
        byName.set(primary, {
          name: primary,
          aliases: alias ? [alias] : [],
          role,
          articleSlugs: [slug],
        });
      }
    }
  }

  return Array.from(byName.values());
}

/**
 * 全部人物 — 按「出现在多少篇文章」降序
 */
export function getAllFigures(): FigureEntry[] {
  return aggregateFigures().sort((a, b) => {
    if (b.articleSlugs.length !== a.articleSlugs.length) {
      return b.articleSlugs.length - a.articleSlugs.length;
    }
    return a.name.localeCompare(b.name, 'zh-CN');
  });
}

/** 出现在 2+ 篇文章的"跨朝代"人物(SEO/featured 价值高) */
export function getFeaturedFigures(): FigureEntry[] {
  return getAllFigures().filter((f) => f.articleSlugs.length >= 2);
}

/** 按 slug 取单个 figure — slug 是 URL-decoded 的 primary name */
export function getFigureBySlug(slug: string): FigureEntry | null {
  return getAllFigures().find((f) => f.name === slug) ?? null;
}
