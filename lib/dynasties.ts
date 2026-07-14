/**
 * 朝代配置 — 9 个主朝代
 *
 * 拆分:
 * - DYNASTY_CONFIG: 纯配置(无 count), client/server 都能用, 不会过期
 * - getDynastiesWithCount(): 见 lib/dynasties.server.ts(server 端专用, 算 count)
 *
 * aliases: 50 篇文章里的 dynasty 字符串归类映射到 9 主朝代之一
 *   (article.dynasty 字段值很多变体, 用 alias 归一)
 */
export type DynastyMotif = 'seal' | 'cloud' | 'mountain' | 'wave' | 'plain' | 'flame' | 'ring';

export interface DynastyConfig {
  name: string;
  period: string;
  slug: string;
  primary: string;
  secondary: string;
  motif: DynastyMotif;
  /** article.dynasty 字符串里对应此朝代的别名(只列实际文章在用的) */
  aliases: readonly string[];
}

/** 完整 Dynasty = config + count (server 端算) */
export interface Dynasty extends DynastyConfig {
  count: number;
}

/** 纯配置 — client 端用, 永远不过期 */
export const DYNASTY_CONFIG: DynastyConfig[] = [
  {
    name: '战国', period: '前 403 - 前 221', slug: 'zhanguo', primary: '#B23A3A', secondary: '#1A1A1A', motif: 'seal',
    aliases: ['战国', '战国中期', '战国中后期', '战国末'],
  },
  {
    name: '秦汉', period: '前 221 - 220', slug: 'qinhan', primary: '#1A1A1A', secondary: '#B23A3A', motif: 'flame',
    aliases: ['秦汉', '西汉→新', '魏晋'],
  },
  {
    name: '三国', period: '220 - 280', slug: 'sanguo', primary: '#2C3E50', secondary: '#B23A3A', motif: 'flame',
    aliases: ['三国'],
  },
  {
    name: '两晋', period: '265 - 420', slug: 'liangjin', primary: '#5A7A8C', secondary: '#3A4A5A', motif: 'wave',
    aliases: ['十六国/东晋'],  // 淝水之战(383)归两晋
  },
  {
    name: '南北朝', period: '420 - 589', slug: 'nanbeichao', primary: '#3A5A8A', secondary: '#A8895C', motif: 'mountain',
    aliases: ['南北朝'],
  },
  {
    name: '隋唐', period: '581 - 907', slug: 'suitang', primary: '#A8895C', secondary: '#B23A3A', motif: 'cloud',
    aliases: ['隋唐', '唐', '唐初', '唐中期'],
  },
  {
    // 宋独立朝代 — 含 北宋/南宋/五代末宋初
    // 之前塞在"隋唐"导致隋唐 count 虚高 11 实际 5
    name: '宋', period: '960 - 1279', slug: 'song', primary: '#4A6B8A', secondary: '#A8895C', motif: 'cloud',
    aliases: ['五代末/宋初', '北宋', '北宋末', '南宋', '南宋末 / 元初'],
  },
  {
    // 元/蒙古独立朝代
    // 之前塞"五代"语义错位(五代 = 907-979,元 = 1271-1368 不重叠)
    name: '元', period: '1271 - 1368', slug: 'yuan', primary: '#5A7A8C', secondary: '#A8895C', motif: 'plain',
    aliases: ['蒙古帝国', '元末明初'],
  },
  {
    name: '明清', period: '1368 - 1911', slug: 'mingqing', primary: '#B23A3A', secondary: '#A8895C', motif: 'cloud',
    // aliases 包含 name 本身 + 实际文章在用的变体
    aliases: ['明清', '明', '明初', '明末', '清初', '清中期', '清末', '清', '明中期'],
  },
  {
    // 民国 1912-1949,归"现代"(1911-至今)而非"明清"
    name: '现代', period: '1911 - 至今', slug: 'modern', primary: '#2C3E50', secondary: '#B23A3A', motif: 'ring',
    aliases: ['现代', '民国初', '民国', '民国 / 日据', '中华苏维埃共和国', '中华人民共和国', '当代', '共和', '现代/当代'],
  },
];

// 展平 alias map 一次性查表 — 50 篇文章查 O(1)
const ALIAS_TO_CONFIG = new Map<string, DynastyConfig>();
for (const d of DYNASTY_CONFIG) {
  for (const alias of d.aliases) {
    ALIAS_TO_CONFIG.set(alias, d);
  }
  // 也把 name 本身加入 map(支持直接用 name 查,比如 article.dynasty = '明清')
  ALIAS_TO_CONFIG.set(d.name, d);
}

/** 通过 article.dynasty 字符串查找 config(纯配置,无 count) ——
 * 支持 name 直接查(article.dynasty = '明清' / '宋' 等) + alias 查
 */
export function findDynasty(name: string): DynastyConfig | undefined {
  return ALIAS_TO_CONFIG.get(name);
}

/**
 * 向后兼容: 老代码用 DYNASTIES (Dynasty[] 包含 count: 0 占位)
 * 新代码应直接用 DYNASTY_CONFIG (client) 或 getDynastiesWithCount (server)
 *
 * @deprecated 用 DYNASTY_CONFIG 或 getDynastiesWithCount() 替代
 */
export const DYNASTIES: Dynasty[] = DYNASTY_CONFIG.map((c) => ({ ...c, count: 0 }));
