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

/**
 * 格式化日期(YYYY 年 M 月 D 日)
 */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
}

/**
 * 格式化相对日期
 */
export function formatRelativeDate(iso: string): string {
  const now = new Date();
  const d = new Date(iso);
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '昨天';
  if (diffDays < 7) return `${diffDays} 天前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} 周前`;

  return formatDate(iso);
}

/**
 * 朝代分类
 */
export interface Dynasty {
  name: string;
  period: string;
  slug: string;
  count: number;
}

export const DYNASTIES: Dynasty[] = [
  { name: '战国', period: '前 403 - 前 221', slug: 'zhanguo', count: 12 },
  { name: '秦汉', period: '前 221 - 220', slug: 'qinhan', count: 28 },
  { name: '三国', period: '220 - 280', slug: 'sanguo', count: 31 },
  { name: '两晋', period: '265 - 420', slug: 'liangjin', count: 19 },
  { name: '南北朝', period: '420 - 589', slug: 'nanbeichao', count: 24 },
  { name: '隋唐', period: '581 - 907', slug: 'suitang', count: 42 },
  { name: '五代', period: '907 - 979', slug: 'wudai', count: 15 },
];