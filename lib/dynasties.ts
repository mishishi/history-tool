/**
 * 朝代配置 — 纯数据,无 fs/node 依赖,client/server 都能用
 *
 * 7 个朝代,每个朝代含:
 * - 基础元数据(name/period/slug/count)
 * - 封面配色(primary/secondary) — 用于 ArticleCover 装饰渐变
 * - motif key — 7 种装饰风格(seal/flame/wave/mountain/cloud/plain/ring)
 *
 * 这里不放 getAllArticles().length 算出来的 count(那是 server 端统计),
 * DYNASTIES 在两个地方维护(articles.ts 也保留一份用于服务端展示),
 * 实际文章数跟朝代 count 解耦 — 后者会过时但不影响渲染
 */
export interface Dynasty {
  name: string;
  period: string;
  slug: string;
  count: number;
  primary: string;
  secondary: string;
  motif: 'seal' | 'cloud' | 'mountain' | 'wave' | 'plain' | 'flame' | 'ring';
}

export const DYNASTIES: Dynasty[] = [
  { name: '战国', period: '前 403 - 前 221', slug: 'zhanguo', count: 12, primary: '#B23A3A', secondary: '#1A1A1A', motif: 'seal' },
  { name: '秦汉', period: '前 221 - 220', slug: 'qinhan', count: 28, primary: '#1A1A1A', secondary: '#B23A3A', motif: 'flame' },
  { name: '三国', period: '220 - 280', slug: 'sanguo', count: 31, primary: '#2C3E50', secondary: '#B23A3A', motif: 'flame' },
  { name: '两晋', period: '265 - 420', slug: 'liangjin', count: 19, primary: '#5A7A8C', secondary: '#3A4A5A', motif: 'wave' },
  { name: '南北朝', period: '420 - 589', slug: 'nanbeichao', count: 24, primary: '#3A5A8A', secondary: '#A8895C', motif: 'mountain' },
  { name: '隋唐', period: '581 - 907', slug: 'suitang', count: 42, primary: '#A8895C', secondary: '#B23A3A', motif: 'cloud' },
  { name: '五代', period: '907 - 979', slug: 'wudai', count: 15, primary: '#3A3A3A', secondary: '#A8895C', motif: 'plain' },
];

/** 通过朝代名查找配置(article.dynasty 字段是 name,如 "唐") */
export function findDynasty(name: string): Dynasty | undefined {
  return DYNASTIES.find((d) => d.name === name);
}