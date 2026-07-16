/**
 * 个性化推荐 — server-safe 纯函数
 *
 * 输入: 用户已读 slug 集合 + 收藏 slug 集合 + 全部 articles
 * 输出: topN 推荐 articles
 *
 * 算法 — 轻量 tag-based 协同过滤(0 LLM / 0 RAG / 0 Vercel Analytics):
 *   1. 从已读 + 收藏的 articles 提取 tag 集合
 *   2. 给每个未读 article 算分:
 *      - 1 分 / tag 重叠
 *      - 5 分 / 同朝代(归一化)
 *   3. 排除已读 + 排除 trending 重复
 *   4. topN 按分数降序
 *
 * 冷启动(没读/没收藏)→ 返回空数组,UI 展示 trending 兜底
 *
 * 为什么不直接复用 getRelatedArticles:
 *   - 那个只对"单篇"算 related(同朝代+tag 重叠)
 *   - 这个对"用户全 history"算推荐(更全面,加已读+收藏信号)
 */
import type { ArticleMeta } from './types';
import { findDynasty } from './dynasties';

const MIN_REC_SCORE = 2; // 低于 2 分不推荐(避免噪音)
const MAX_HISTORY = 10; // 只看最近 10 篇的 tag/朝代信号(老数据权重低)

export interface RecommendInput {
  /** 全部 articles(同 lib/articles.getAllArticles) */
  allArticles: ArticleMeta[];
  /** 用户最近浏览/读过的 slug — 时序列表(最近在前),取前 MAX_HISTORY */
  readSlugs: string[];
  /** 收藏 slug 列表 */
  favoriteSlugs: string[];
  /** 排除(已读,或 trending 已展示) */
  excludeSlugs?: string[];
  /** 返回数量 */
  topN?: number;
}

export interface RecommendResult {
  /** 推荐文章 */
  articles: ArticleMeta[];
  /** 是否有"个性化信号"(用户已读/收藏过文章) */
  hasPersonalSignal: boolean;
  /** 用了多少 tag 算分(用于 debug) */
  signalCount: number;
}

/**
 * 核心推荐算法
 */
export function recommend(input: RecommendInput): RecommendResult {
  const { allArticles, readSlugs, favoriteSlugs, excludeSlugs = [], topN = 3 } = input;

  // 取最近 N 个已读 + 收藏(去重,收藏权重高)
  const recentReads = readSlugs.slice(0, MAX_HISTORY);
  const historySlugs = new Set([...favoriteSlugs, ...recentReads]);

  // 用户已读 + 收藏的所有 articles
  const historyArticles = allArticles.filter((a) => historySlugs.has(a.slug));

  // 冷启动:没信号
  if (historyArticles.length === 0) {
    return { articles: [], hasPersonalSignal: false, signalCount: 0 };
  }

  // 提取 tag 频次(收藏权重 2x)
  const tagWeight = new Map<string, number>();
  for (const a of historyArticles) {
    const weight = favoriteSlugs.includes(a.slug) ? 2 : 1;
    for (const t of a.tags ?? []) {
      tagWeight.set(t, (tagWeight.get(t) ?? 0) + weight);
    }
  }

  // 提取朝代频次(收藏权重 2x)
  const dynastyWeight = new Map<string, number>();
  for (const a of historyArticles) {
    const dynasty = findDynasty(a.dynasty)?.slug;
    if (!dynasty) continue;
    const weight = favoriteSlugs.includes(a.slug) ? 2 : 1;
    dynastyWeight.set(dynasty, (dynastyWeight.get(dynasty) ?? 0) + weight);
  }

  // 排除集合
  const exclude = new Set([...excludeSlugs, ...historySlugs]);

  // 算分
  const scored: { article: ArticleMeta; score: number }[] = [];
  for (const a of allArticles) {
    if (exclude.has(a.slug)) continue;
    let score = 0;

    // tag 重叠
    for (const t of a.tags ?? []) {
      score += tagWeight.get(t) ?? 0;
    }

    // 同朝代(归一化 — 同朝代给 +5 分,避免被满 tag 淹没)
    const dynasty = findDynasty(a.dynasty)?.slug;
    if (dynasty && dynastyWeight.has(dynasty)) {
      score += 5;
    }

    if (score < MIN_REC_SCORE) continue;
    scored.push({ article: a, score });
  }

  // 按分数降序
  scored.sort((a, b) => b.score - a.score);

  return {
    articles: scored.slice(0, topN).map((s) => s.article),
    hasPersonalSignal: true,
    signalCount: tagWeight.size,
  };
}
