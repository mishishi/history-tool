/**
 * 资治通鉴目录 — IA 单源真相
 *
 * 7 个资治通鉴原生朝代(战国/秦汉/三国/两晋/南北朝/隋唐/五代)+ 1 个「近现代」
 * 「近现代」是 通鉴之外 的文章(960 AD 之后),包括 宋/元/明/清/民国/现代
 *
 * 为什么不直接复用 lib/dynasties.ts 的 7 个朝代?
 * - dynasties.ts 是「品牌展示」用的(配色 + motif),强绑 7 个
 * - 「近现代」是 IA 概念(通鉴之后),不需要配色
 * - 两者职责分开,后续如果加更多朝代不会互相污染
 */

export interface ArchiveGroup {
  /** IA 用 id(资治通鉴 7 朝代直接对应 dynasties.ts 的 slug) */
  id: 'zhanguo' | 'qinhan' | 'sanguo' | 'liangjin' | 'nanbeichao' | 'suitang' | 'wudai' | 'modern';
  /** 朝代显示名 */
  name: string;
  /** 时间范围(中文) */
  period: string;
  /** 起始公元年(BC 用负数) */
  yearStart: number;
  /** 结束公元年 */
  yearEnd: number;
  /** 简短描述 — 给 archive 页眉用 */
  summary: string;
}

export const ARCHIVE_GROUPS: ArchiveGroup[] = [
  { id: 'zhanguo',     name: '战国',   period: '前 403 - 前 221',  yearStart: -403, yearEnd: -221, summary: '礼崩乐坏,百家争鸣。决定中国两千年政治格局的时代。' },
  { id: 'qinhan',      name: '秦汉',   period: '前 221 - 220',    yearStart: -221, yearEnd:  220, summary: '大一统帝国成型,儒法之争、匈奴、文景之治全在这里。' },
  { id: 'sanguo',      name: '三国',   period: '220 - 280',        yearStart:  220, yearEnd:  280, summary: '英雄与谋略的巅峰,司马氏暗度陈仓埋下晋朝根基。' },
  { id: 'liangjin',    name: '两晋',   period: '265 - 420',        yearStart:  265, yearEnd:  420, summary: '门阀政治 + 衣冠南渡,中华民族第一次大规模文化南迁。' },
  { id: 'nanbeichao',  name: '南北朝', period: '420 - 589',        yearStart:  420, yearEnd:  589, summary: '佛学鼎盛、少数民族大融合,隋唐盛世的真正预演场。' },
  { id: 'suitang',     name: '隋唐',   period: '581 - 907',        yearStart:  581, yearEnd:  907, summary: '科举、诗、开放 — 中国封建文明的最高点。' },
  { id: 'wudai',       name: '五代',   period: '907 - 979',        yearStart:  907, yearEnd:  979, summary: '53 年换 5 朝,兵强马壮者为天子,武人政治极致。' },
  { id: 'modern',      name: '近现代', period: '960 - 2013',       yearStart:  960, yearEnd: 2013, summary: '通鉴之后的 1000 多年。从宋初集权到一带一路,所有「古问题」的现代回响。' },
];

/** id → group 索引 */
export const ARCHIVE_GROUP_BY_ID: Record<string, ArchiveGroup> = Object.fromEntries(
  ARCHIVE_GROUPS.map((g) => [g.id, g])
);

/**
 * 单篇文章的 IA 富化字段
 * 这里不重写文章本身的 dynasty/volume(那是原始数据),而是给 archive 视图用的"二级结构"
 */
export interface ArticleArchiveMeta {
  /** 归一到 8 个 IA 组之一 */
  groupId: ArchiveGroup['id'];
  /** 标准化的 资治通鉴 卷数(1-294),非通鉴文章为 null */
  volumeStandard: number | null;
  /** 卷数展示用 label(卷一 / 唐纪七 / 周纪四 等,保留原始风格) */
  volumeLabel: string;
  /** 时代 — 二级标签,比 dynasty 更精确 */
  era: string;
  /** 公元年(BC 用负数)— 近似值,适合时间轴 */
  year: number;
}

const META: Record<string, ArticleArchiveMeta> = {
  '01-zhishi-wang':   { groupId: 'zhanguo',    volumeStandard: 1,   volumeLabel: '卷一',     era: '三家分晋',         year: -403 },
  '02-shangyang':     { groupId: 'zhanguo',    volumeStandard: 2,   volumeLabel: '卷二',     era: '商鞅变法',         year: -361 },
  '03-hongmen':       { groupId: 'qinhan',     volumeStandard: 7,   volumeLabel: '卷七',     era: '楚汉相争',         year: -206 },
  '04-weizhao':       { groupId: 'zhanguo',    volumeStandard: 4,   volumeLabel: '周纪四',   era: '战国中期',         year: -342 },
  '05-wanbi':         { groupId: 'zhanguo',    volumeStandard: 5,   volumeLabel: '周纪五',   era: '战国后期',         year: -283 },
  '06-quyuan':        { groupId: 'zhanguo',    volumeStandard: 5,   volumeLabel: '周纪五',   era: '战国末',           year: -278 },
  '07-changping':     { groupId: 'zhanguo',    volumeStandard: 6,   volumeLabel: '周纪六',   era: '战国末',           year: -260 },
  '08-xuanwu':        { groupId: 'suitang',    volumeStandard: 191, volumeLabel: '唐纪七',   era: '贞观之治',         year:  626 },
  '09-anshi':         { groupId: 'suitang',    volumeStandard: 217, volumeLabel: '唐纪三十二', era: '安史之乱',         year:  755 },
  '10-huangpao':      { groupId: 'wudai',      volumeStandard: 292, volumeLabel: '后周纪',   era: '陈桥兵变',         year:  960 },
  '11-wangmang':      { groupId: 'qinhan',     volumeStandard: 36,  volumeLabel: '卷三十六', era: '王莽改制',         year:    9 },
  '12-chibi':         { groupId: 'sanguo',     volumeStandard: 68,  volumeLabel: '卷六十八', era: '三国鼎立',         year:  208 },
  '13-gaopingling':   { groupId: 'sanguo',     volumeStandard: 75,  volumeLabel: '卷七十五', era: '高平陵之变',       year:  249 },
  '14-feishui':       { groupId: 'liangjin',   volumeStandard: 105, volumeLabel: '卷一百零五', era: '淝水之战',       year:  383 },
  '15-wuzetian':      { groupId: 'suitang',    volumeStandard: 207, volumeLabel: '卷二百零七', era: '武周革命',       year:  690 },
  '16-maweipo':       { groupId: 'suitang',    volumeStandard: 218, volumeLabel: '卷二百一十八', era: '安史之乱',     year:  756 },
  '17-beijiu':        { groupId: 'wudai',      volumeStandard: 292, volumeLabel: '卷二百九十二', era: '宋初集权',     year:  961 },
  '18-chanyuan':      { groupId: 'modern',     volumeStandard: null, volumeLabel: '北宋·澶渊', era: '澶渊之盟',         year: 1004 },
  '19-wanganshi':     { groupId: 'modern',     volumeStandard: null, volumeLabel: '北宋·熙宁', era: '王安石变法',       year: 1069 },
  '20-jingkang':      { groupId: 'modern',     volumeStandard: null, volumeLabel: '北宋末',     era: '靖康之变',         year: 1127 },
  '21-zhuyuanzhang':  { groupId: 'modern',     volumeStandard: null, volumeLabel: '明初',       era: '洪武开国',         year: 1368 },
  '22-hubianyuhu':    { groupId: 'modern',     volumeStandard: null, volumeLabel: '明·洪武',   era: '胡蓝之狱',         year: 1393 },
  '23-jingnan':       { groupId: 'modern',     volumeStandard: null, volumeLabel: '明初',       era: '靖难之役',         year: 1399 },
  '24-yongle':        { groupId: 'modern',     volumeStandard: null, volumeLabel: '明·永乐',   era: '永乐盛世',         year: 1405 },
  '25-tumu':          { groupId: 'modern',     volumeStandard: null, volumeLabel: '明·正统',   era: '土木之变',         year: 1449 },
  '26-zhangjuzheng':  { groupId: 'modern',     volumeStandard: null, volumeLabel: '明·隆庆',   era: '万历中兴',         year: 1572 },
  '27-wangyangming':  { groupId: 'modern',     volumeStandard: null, volumeLabel: '明·嘉靖',   era: '阳明心学',         year: 1528 },
  '28-wanli':         { groupId: 'modern',     volumeStandard: null, volumeLabel: '明·万历',   era: '万历怠政',         year: 1590 },
  '29-chongzhen':     { groupId: 'modern',     volumeStandard: null, volumeLabel: '明·崇祯',   era: '崇祯末路',         year: 1644 },
  '30-kangxi-aobai':  { groupId: 'modern',     volumeStandard: null, volumeLabel: '清·康熙',   era: '康熙亲政',         year: 1669 },
  '31-yuefei':        { groupId: 'modern',     volumeStandard: null, volumeLabel: '南宋',       era: '绍兴和议',         year: 1140 },
  '32-genghis':       { groupId: 'modern',     volumeStandard: null, volumeLabel: '蒙古',       era: '成吉思汗',         year: 1206 },
  '33-yashai':        { groupId: 'modern',     volumeStandard: null, volumeLabel: '南宋末',     era: '崖山之变',         year: 1279 },
  '34-qianlong':      { groupId: 'modern',     volumeStandard: null, volumeLabel: '清·乾隆',   era: '康乾盛世',         year: 1790 },
  '35-opium-lin':     { groupId: 'modern',     volumeStandard: null, volumeLabel: '清·道光',   era: '鸦片战争',         year: 1840 },
  '36-taiping':       { groupId: 'modern',     volumeStandard: null, volumeLabel: '清·咸丰',   era: '太平天国',         year: 1851 },
  '37-1898':          { groupId: 'modern',     volumeStandard: null, volumeLabel: '清·光绪',   era: '戊戌变法',         year: 1898 },
  '38-jiawu':         { groupId: 'modern',     volumeStandard: null, volumeLabel: '清·光绪',   era: '甲午战争',         year: 1894 },
  '39-boxer':         { groupId: 'modern',     volumeStandard: null, volumeLabel: '清·光绪',   era: '庚子之变',         year: 1900 },
  '40-xinhai':        { groupId: 'modern',     volumeStandard: null, volumeLabel: '清末',       era: '辛亥革命',         year: 1911 },
  '41-yuan':          { groupId: 'modern',     volumeStandard: null, volumeLabel: '民国初',     era: '洪宪帝制',         year: 1915 },
  '42-may-fourth':    { groupId: 'modern',     volumeStandard: null, volumeLabel: '民国',       era: '五四运动',         year: 1919 },
  '43-long-march':    { groupId: 'modern',     volumeStandard: null, volumeLabel: '民国',       era: '红军长征',         year: 1934 },
  '44-taierzhuang':   { groupId: 'modern',     volumeStandard: null, volumeLabel: '民国',       era: '台儿庄战役',       year: 1938 },
  '45-three-campaigns': { groupId: 'modern',   volumeStandard: null, volumeLabel: '解放战争',   era: '三大战役',         year: 1948 },
  '46-korean-war':    { groupId: 'modern',     volumeStandard: null, volumeLabel: '建国初',     era: '抗美援朝',         year: 1950 },
  '47-reform':        { groupId: 'modern',     volumeStandard: null, volumeLabel: '改革开放',   era: '改革开放',         year: 1978 },
  '48-hk':            { groupId: 'modern',     volumeStandard: null, volumeLabel: '回归',       era: '香港回归',         year: 1997 },
  '49-wto':           { groupId: 'modern',     volumeStandard: null, volumeLabel: 'WTO',        era: '加入 WTO',         year: 2001 },
  '50-bri':           { groupId: 'modern',     volumeStandard: null, volumeLabel: '一带一路',   era: '一带一路',         year: 2013 },
};

/** 按 slug 取 IA 富化字段(没收录的返回 null,fallback 安全) */
export function getArticleArchive(slug: string): ArticleArchiveMeta | null {
  return META[slug] ?? null;
}

/** 按 group 聚合所有文章 slug(按 episode 升序) */
export function groupArticlesByGroup(allSlugs: string[]): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const g of ARCHIVE_GROUPS) out[g.id] = [];
  for (const slug of allSlugs) {
    const meta = META[slug];
    if (meta) out[meta.groupId].push(slug);
  }
  return out;
}
