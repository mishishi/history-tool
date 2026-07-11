/**
 * 人物关系图谱数据层
 *
 * 关系来源:co-occurrence (同篇文章里同时出现的两个人物 = 隐含关系)
 * - 一篇文章 2-4 个 keyFigures,所有组合 (A,B) 算一条边
 * - weight = 共同出现在多少篇文章
 * - 没出现 2+ 次的关系不上图(避免噪声)
 *
 * 数据生成:build time 跑一次,生成静态 JSON 给 client 渲染
 * 不用 fs 路径(Edge Runtime 安全)
 */
import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { findDynasty } from './dynasties';

export interface FigureGraphNode {
  id: string;
  name: string;
  count: number; // 出现次数
  dynasties: string[]; // 出现在哪些朝代(去重)
  articles: Array<{ slug: string; title: string; dynasty: string; episode: number }>;
}

export interface FigureGraphEdge {
  source: string;
  target: string;
  weight: number; // 共同出现次数
  articles: string[]; // 共同出现在哪些文章
}

export interface FigureGraph {
  nodes: FigureGraphNode[];
  edges: FigureGraphEdge[];
  /** 元信息:总节点/边数/过滤掉的边数 */
  meta: {
    totalPairs: number;
    displayedEdges: number;
    weightThreshold: number;
  };
}

const CLASSICS_DIR = path.join(process.cwd(), 'content', 'classics');
const ARTICLES_DIR = path.join(process.cwd(), 'content', 'articles');

interface ArticleMeta {
  slug: string;
  title: string;
  dynasty: string;
  episode: number;
}

/** 读所有 articles 元数据 */
function getArticleMap(): Map<string, ArticleMeta> {
  if (!fs.existsSync(ARTICLES_DIR)) return new Map();
  const map = new Map<string, ArticleMeta>();
  for (const f of fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith('.md'))) {
    const slug = f.replace(/\.md$/, '');
    const raw = fs.readFileSync(path.join(ARTICLES_DIR, f), 'utf8');
    const { data } = matter(raw);
    map.set(slug, {
      slug,
      title: String(data.title || slug),
      dynasty: String(data.dynasty || ''),
      episode: Number(data.episode || 0),
    });
  }
  return map;
}

/** 从 name 里抽 primary(去括号别名)— 跟 figures.ts 一致 */
function primaryName(name: string): string {
  const m = name.match(/^([^()]+)(?:\(([^)]+)\))?$/);
  return (m?.[1] || name).trim();
}

interface ArticleKeyFigures {
  slug: string;
  dynasty: string;
  title: string;
  episode: number;
  names: string[]; // primary names
}

/** 读所有 classics 的 keyFigures,跳过没有对应文章的 */
function getClassicsKeyFigures(): ArticleKeyFigures[] {
  if (!fs.existsSync(CLASSICS_DIR)) return [];
  const articleMap = getArticleMap();
  const out: ArticleKeyFigures[] = [];
  for (const f of fs.readdirSync(CLASSICS_DIR).filter((f) => f.endsWith('.md'))) {
    const slug = f.replace(/\.md$/, '');
    if (!articleMap.has(slug)) continue;
    const raw = fs.readFileSync(path.join(CLASSICS_DIR, f), 'utf8');
    const { data } = matter(raw);
    const figures = (data.keyFigures || []) as Array<{ name?: string; role?: string }>;
    const article = articleMap.get(slug)!;
    const names: string[] = [];
    for (const fig of figures) {
      if (!fig || !fig.name) continue;
      const p = primaryName(String(fig.name));
      if (p && !names.includes(p)) names.push(p);
    }
    if (names.length >= 2) {
      out.push({
        slug,
        dynasty: article.dynasty,
        title: article.title,
        episode: article.episode,
        names,
      });
    }
  }
  return out;
}

/** 过滤低权重边 + 过滤孤立节点(无边) */
function filterGraph(
  nodes: Map<string, FigureGraphNode>,
  edges: FigureGraphEdge[],
  weightThreshold: number,
): { nodes: FigureGraphNode[]; edges: FigureGraphEdge[]; totalPairs: number } {
  const filteredEdges = edges.filter((e) => e.weight >= weightThreshold);
  const connectedIds = new Set<string>();
  for (const e of filteredEdges) {
    connectedIds.add(e.source);
    connectedIds.add(e.target);
  }
  const filteredNodes = Array.from(nodes.values()).filter((n) => connectedIds.has(n.id));
  return { nodes: filteredNodes, edges: filteredEdges, totalPairs: edges.length };
}

/** 节点按 count 分级,给前端调样式用 */
export function getNodeSize(count: number): 'sm' | 'md' | 'lg' | 'xl' {
  if (count >= 5) return 'xl';
  if (count >= 3) return 'lg';
  if (count >= 2) return 'md';
  return 'sm';
}

/** 节点朝代配色 — 取第一个朝代,fallback gray */
export function getNodeColorFromList(dynastyName: string): string {
  const d = findDynasty(dynastyName);
  return d?.primary || '#5A5A5A';
}

/**
 * 生成图谱数据
 * @param weightThreshold 边权重阈值(只显示共现 N+ 次的边),默认 1
 */
export function getFiguresGraph(weightThreshold = 1): FigureGraph {
  const articles = getClassicsKeyFigures();
  const articleMap = getArticleMap();

  // 1. 累加 nodes
  const nodeMap = new Map<string, FigureGraphNode>();
  for (const a of articles) {
    for (const name of a.names) {
      const existing = nodeMap.get(name);
      const articleInfo = {
        slug: a.slug,
        title: a.title,
        dynasty: a.dynasty,
        episode: a.episode,
      };
      if (existing) {
        existing.count++;
        if (!existing.dynasties.includes(a.dynasty)) existing.dynasties.push(a.dynasty);
        if (!existing.articles.some((x) => x.slug === a.slug)) {
          existing.articles.push(articleInfo);
        }
      } else {
        nodeMap.set(name, {
          id: name,
          name,
          count: 1,
          dynasties: [a.dynasty],
          articles: [articleInfo],
        });
      }
    }
  }

  // 2. 累加 edges:同篇文章的 names 配对 (A,B),weight++
  const edgeMap = new Map<string, FigureGraphEdge>();
  for (const a of articles) {
    const names = a.names;
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        const [n1, n2] = [names[i], names[j]].sort();
        const key = `${n1}::${n2}`;
        const existing = edgeMap.get(key);
        if (existing) {
          existing.weight++;
          if (!existing.articles.includes(a.slug)) existing.articles.push(a.slug);
        } else {
          edgeMap.set(key, {
            source: n1,
            target: n2,
            weight: 1,
            articles: [a.slug],
          });
        }
      }
    }
  }

  // 3. 过滤
  const allEdges = Array.from(edgeMap.values());
  const filtered = filterGraph(nodeMap, allEdges, weightThreshold);

  return {
    nodes: filtered.nodes,
    edges: filtered.edges,
    meta: {
      totalPairs: filtered.totalPairs,
      displayedEdges: filtered.edges.length,
      weightThreshold,
    },
  };
}
