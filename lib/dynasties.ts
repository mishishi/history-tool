/**
 * 朝代配置 — 纯数据,无 fs/node 依赖,client/server 都能用
 *
 * 9 个主朝代,每个含:
 * - 基础元数据(name/period/slug/count)
 * - 封面配色(primary/secondary) — 用于 ArticleCover 装饰渐变
 * - motif key — 7 种装饰风格(seal/flame/wave/mountain/cloud/plain/ring)
 * - aliases — 50 篇文章里的 dynasty 字符串归类映射到 9 主朝代之一
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
  /** article.dynasty 字符串里对应此朝代的别名(只列实际文章在用的) */
  aliases: readonly string[];
}

export const DYNASTIES: Dynasty[] = [
  {
    name: '战国', period: '前 403 - 前 221', slug: 'zhanguo', count: 6, primary: '#B23A3A', secondary: '#1A1A1A', motif: 'seal',
    aliases: ['战国', '战国中期', '战国中后期', '战国末'],
  },
  {
    name: '秦汉', period: '前 221 - 220', slug: 'qinhan', count: 3, primary: '#1A1A1A', secondary: '#B23A3A', motif: 'flame',
    aliases: ['秦汉', '西汉→新', '魏晋'],
  },
  {
    name: '三国', period: '220 - 280', slug: 'sanguo', count: 1, primary: '#2C3E50', secondary: '#B23A3A', motif: 'flame',
    aliases: ['三国'],
  },
  {
    name: '两晋', period: '265 - 420', slug: 'liangjin', count: 1, primary: '#5A7A8C', secondary: '#3A4A5A', motif: 'wave',
    aliases: ['十六国/东晋'],  // 淝水之战(383)归两晋
  },
  {
    name: '南北朝', period: '420 - 589', slug: 'nanbeichao', count: 1, primary: '#3A5A8A', secondary: '#A8895C', motif: 'mountain',
    aliases: ['南北朝'],
  },
  {
    name: '隋唐', period: '581 - 907', slug: 'suitang', count: 4, primary: '#A8895C', secondary: '#B23A3A', motif: 'cloud',
    aliases: ['隋唐', '唐', '唐初', '唐中期'],
  },
  {
    // 宋独立朝代 — 含 北宋/南宋/五代末宋初
    // 之前塞在"隋唐"导致隋唐 count 虚高 11 实际 5
    name: '宋', period: '960 - 1279', slug: 'song', count: 7, primary: '#4A6B8A', secondary: '#A8895C', motif: 'cloud',
    aliases: ['五代末/宋初', '北宋', '北宋末', '南宋', '南宋末 / 元初'],
  },
  {
    // 元/蒙古独立朝代
    // 之前塞"五代"语义错位(五代 = 907-979,元 = 1271-1368 不重叠)
    name: '元', period: '1271 - 1368', slug: 'yuan', count: 2, primary: '#5A7A8C', secondary: '#A8895C', motif: 'plain',
    aliases: ['蒙古帝国', '元末明初'],
  },
  {
    name: '明清', period: '1368 - 1911', slug: 'mingqing', count: 16, primary: '#B23A3A', secondary: '#A8895C', motif: 'cloud',
    aliases: ['明', '明初', '明末', '清初', '清中期', '清末'],
  },
  {
    // 民国 1912-1949,归"现代"(1911-至今)而非"明清"
    name: '现代', period: '1911 - 至今', slug: 'modern', count: 10, primary: '#2C3E50', secondary: '#B23A3A', motif: 'ring',
    aliases: ['民国初', '民国', '民国 / 日据', '中华苏维埃共和国', '中华人民共和国'],
  },
];

// 展平 alias map 一次性查表 — 50 篇文章查 O(1)
const ALIAS_TO_DYNASTY = new Map<string, Dynasty>();
for (const d of DYNASTIES) {
  for (const alias of d.aliases) {
    ALIAS_TO_DYNASTY.set(alias, d);
  }
}

/** 通过 article.dynasty 字符串查找配置 */
export function findDynasty(name: string): Dynasty | undefined {
  return ALIAS_TO_DYNASTY.get(name);
}
