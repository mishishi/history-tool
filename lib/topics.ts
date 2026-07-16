/**
 * 主题深读 — IA 单源真相
 *
 * 资治通鉴 183 篇里 556 个 tag,大部分(526)只出现 1-2 次(人名/事件名,留 archive 标签云)。
 * 只把 ≥ 3 次出现 的"主题性 tag"做独立深读页:
 *   - SEO:每个深读页是一个 keyword landing page
 *   - 内链:跨朝代聚合,把读者从"读一篇"带到"读一类"
 *   - 数据感:5 篇以上 才有"主题"的统计意义
 *
 * "低频" tag(1-2 次)不单独成页 — 在 archive tag cloud 展示,点进 archive 列表
 * 这样既不稀释 SEO,也不浪费 183 篇的内容资产。
 */

import type { ArticleMeta } from './types';
import { getAllArticles } from './articles';

const MIN_TAG_COUNT = 3;

export { MIN_TAG_COUNT, TOPIC_INTROS, fallbackIntro };

export interface TopicIntro {
  /** tag 字面值(URL path 一致) */
  tag: string;
  /** 主题大标题(可与 tag 不同,更文学化) */
  title: string;
  /** 副标题/主题分类(主题 vs 朝代 vs 人物 vs 技法) */
  category: '主题' | '朝代' | '人物' | '战略' | '制度' | '改革' | '危机' | '人物群像';
  /** 1 段 100-150 字简介 — 当 tag 出现在这个 dict 时用预写,否则 fallback 通用模板 */
  summary: string;
  /** 「为什么读这个主题」— 1 段补充,给"犹豫要不要读"的用户一个 push */
  why: string;
}

/**
 * 手工 curated 主题简介 — 涵盖出现频率最高的 30+ 主题
 * 这些 tag 出现 ≥ 3 次,值得做深读页
 *
 * 写简介原则:
 * 1. 不剧透具体文章 — 介绍主题,不讲结论
 * 2. 跨朝代视角 — 通鉴"古为今用",主题要超越单一朝代
 * 3. 给一个「为什么这值得读」的钩子
 * 4. 1 段 ≤ 150 字,密度高不啰嗦
 */
const TOPIC_INTROS: Record<string, TopicIntro> = {
  // --- 主旨类(出现 5+ 次) ---
  改革: {
    tag: '改革',
    title: '改革',
    category: '改革',
    summary: '从王安石到张居正,从摊丁入亩到戊戌变法,改革者面对的是同一种敌人:既得利益、时间表、和"急则速亡"的诅咒。看看他们怎么输的,比学他们怎么赢更值钱。',
    why: '每一次改革都试图解决"前人留下的问题",但他们的失败都指向同一个原因 —— 节奏错了。',
  },
  决策: {
    tag: '决策',
    title: '决策',
    category: '战略',
    summary: '鸿门宴、玄武门、夺门之变、煤山自缢 —— 中国两千年里最关键的 20 个决策瞬间,逐个复盘:谁看到了别人没看到的?谁把一手好牌打烂了?',
    why: '古人的决策不靠数据靠直觉,这种直觉往往是"价值观 + 性格 + 信息"三个维度的瞬间加权。今天我们做产品决策,本质是同一道题。',
  },
  创业: {
    tag: '创业',
    title: '创业',
    category: '战略',
    summary: '刘邦、朱元璋、努尔哈赤,这些布衣皇帝其实做的是同一件事:在零资源的情况下,如何说服一群人跟你走最难走的路。读他们,就是在读"如何从 0 到 1"。',
    why: '他们的产品是"王图霸业",你的产品是 SaaS 或 APP,本质都是把不确定性卖给一群人。',
  },
  接班人: {
    tag: '接班人',
    title: '接班人',
    category: '战略',
    summary: '李世民 28 岁接班、雍正 45 岁接班、康熙 8 岁即位被擒鳌拜 —— 权力交接的 12 种解法,以及为什么"选好继承人"是创业者最难的一道题。',
    why: '一家公司能走多远,看它怎么选 CEO。中国两千年王朝兴衰史,80% 是接班人问题。',
  },
  战略: {
    tag: '战略',
    title: '战略',
    category: '战略',
    summary: '长平、淝水、赤壁、萨尔浒 —— 改变中国走向的 4 场大战,4 种不同的"以少胜多"和"以多败少"。教科书不教"为什么想赢反而输",这里有 26 个真实案例。',
    why: '战略不是"怎么赢",而是"什么时候不打"。读古人,学的是"克制"的艺术。',
  },
  团队: {
    tag: '团队',
    title: '团队',
    category: '战略',
    summary: '刘邦有萧何 + 张良 + 韩信,朱元璋有刘伯温 + 李善长 + 徐达 —— 任何大业背后都是一个"低配版乔布斯 + 库克 + 沃兹"组合。怎么搭,怎么带,怎么分赃。',
    why: '把 12 篇"团队组合"放在一起看,你会发现 2000 年前后的"创业团队"都犯同一类错:股权不明 + 元老绑架 + 接班人早退。',
  },
  用人: {
    tag: '用人',
    title: '用人',
    category: '战略',
    summary: '萧何月下追韩信、刘备三顾茅庐、嘉靖养严嵩 20 年 —— 选拔、激励、清洗,5 个朝代用人得失,给"现代 HR"当镜子。',
    why: '会做事的人满街都是,会"用做事的人"是稀缺品。读 5 篇古代用人案例,比读 5 本管理学 MBA 教材实用。',
  },
  信用: {
    tag: '信用',
    title: '信用',
    category: '主题',
    summary: '商鞅徙木立信、项羽鸿沟毁约、朱棣靖难食言 —— 10 个朝代更迭背后的"信用问题",怎么立,怎么破,怎么修。',
    why: '一家公司能融资多少,本质是市场信它的账。古代王朝能撑多少年,本质是百姓信它的账。',
  },
  信任: {
    tag: '信任',
    title: '信任',
    category: '主题',
    summary: '信任是最低成本的资源,也是最贵的资源。刘备信任诸葛亮,朱元璋却杀李善长 —— 7 个"信任崩塌"或"信任永固"的王朝案例。',
    why: '互联网公司的"用户增长"本质是建立信任,古代王朝的"百年基业"本质也是。',
  },
  制度: {
    tag: '制度',
    title: '制度',
    category: '制度',
    summary: '三省六部、科举、军机处、卫所制、一条鞭法 —— 10 个"改变中国 200 年走向"的制度设计,以及它们背后"利益重新分配"的逻辑。',
    why: '制度设计本质是"用代码约束人性",这套代码运行得好,王朝 200 年;运行得差,3 年就崩。',
  },
  权力: {
    tag: '权力',
    title: '权力',
    category: '主题',
    summary: '权臣、外戚、宦官、后宫 —— 7 个"次级权力"如何绑架皇帝、架空宰相、绑架整个王朝的案例。',
    why: '如果你在创业公司做运营/产品,你每天都在处理"次级权力"(PM、产品、运营三方博弈)。古代王朝是放大 1000 倍的同款游戏。',
  },
  危机: {
    tag: '危机',
    title: '危机',
    category: '危机',
    summary: '土木堡之变、靖康之难、太平天国、鸦片战争 —— 4 个"几乎亡国"的危机,4 种不同的"绝地反弹"或"绝地崩盘"。',
    why: '判断"危机 vs 机会"的能力,是创始人最重要的能力。4 篇危机复盘给你 4 种不同决策模型。',
  },
  韧性: {
    tag: '韧性',
    title: '韧性',
    category: '主题',
    summary: '勾践卧薪尝胆、文天祥 3 年牢狱、康熙 8 岁除鳌拜 —— 5 个"在最绝望的处境里活下来"的案例,他们的共同点不是"不倒",是"倒了再起来"。',
    why: '现代创业失败率 90%,能活过 3 年的不到 5%。古人的"韧性配方"也许比 MBA 案例更真实。',
  },
  组织: {
    tag: '组织',
    title: '组织',
    category: '主题',
    summary: '从秦朝郡县制到湘军淮军,从拜上帝会到同盟会 —— 5 个"非国家形态"组织的兴亡,以及"如何让一群人愿意为共同目标干活"的古老答案。',
    why: '今天的互联网公司,本质就是一种"非国家形态组织"。读古人,学组织设计。',
  },
  联盟: {
    tag: '联盟',
    title: '联盟',
    category: '战略',
    summary: '合纵连横、三家分晋、瓦岗军、太平天国 —— 4 种"联盟"的形成、破裂和重构。联盟管理是创业者最稀缺的技能,2000 年前范雎就在研究。',
    why: '创业公司最后死掉,90% 是"内部合伙人不齐"或"盟友背刺"。联盟管理的能力 = 把外部人变成同盟。',
  },
  谈判: {
    tag: '谈判',
    title: '谈判',
    category: '战略',
    summary: '蔺相如完璧归赵、诸葛亮舌战群儒、李密陈情表 —— 4 个"高难度谈判"现场,他们如何用文字胜过刀剑。',
    why: '谈判本质是"在对方有退路的情况下,说服他接受你的方案"。古人 4 场,胜过 4 本谈判书。',
  },
  妥协: {
    tag: '妥协',
    title: '妥协',
    category: '主题',
    summary: '汉文帝让步于匈奴、唐太宗妥协于渭水之盟、嘉靖放任严嵩 —— 4 个"不得不妥协"的帝王,妥协不是软弱,是政治的高级形式。',
    why: '创业者最有杀伤力的决定,往往是"我不打了"。看古人怎么退,学创业怎么退。',
  },
  继承人: {
    tag: '继承人',
    title: '继承人',
    category: '战略',
    summary: '李世民杀李建成、朱棣夺朱允炆、康熙选雍正 —— 5 个"继承人战争"案例,以及为什么"立长立贤立爱"是历史上最难的 3 个字。',
    why: '你的下一个合伙人是谁?你的接班 CEO 怎么选?这 3 个字决定你公司 30 年后还在不在。',
  },
  帝王: {
    tag: '帝王',
    title: '帝王',
    category: '人物',
    summary: '7 位改变中国走向的帝王:秦皇汉武、唐宗宋祖、明清四帝 —— 7 种"如何坐稳这把椅子"的方法论。',
    why: '当皇帝 = 当公司 CEO + 终身制 + 继承人挑战。读这 7 位,等于读 7 个"千亿公司 CEO 自传"。',
  },
  草根: {
    tag: '草根',
    title: '草根',
    category: '人物群像',
    summary: '刘邦、朱元璋、石达开 —— 9 个"零资源起家"的草根逆袭故事,他们的共同点不是"运气好",是"在悬崖边还能睡得着"。',
    why: '今天的中国互联网,就是 9 个"草根 + 资本 + 时代"组合的延伸。读他们,是为了不重复他们跌倒的那一次。',
  },
  创始人: {
    tag: '创始人',
    title: '创始人',
    category: '人物',
    summary: '刘邦、刘秀、朱元璋、努尔哈赤、皇太极 —— 5 个"从 0 建起一个帝国"的创始人画像,他们的第一天早上都在想什么。',
    why: 'CEO 第一年决定公司第 30 年。古人开局第一年做了什么、没做什么,影响他们 30 年后的版图。',
  },
  // --- 朝代类(5+ 次) ---
  唐朝: {
    tag: '唐朝',
    title: '唐朝',
    category: '朝代',
    summary: '从玄武门到黄巢之乱,289 年唐朝兴衰 —— 12 篇核心解读,涵盖盛世、变法、亡国三阶段。读懂唐朝,就读懂中国封建文明的巅峰与崩塌。',
    why: '唐朝之后 1000 年的所有制度、文化、政治选择,都从唐朝的实验里来或对比唐朝的实验来。',
  },
  明朝: {
    tag: '明朝',
    title: '明朝',
    category: '朝代',
    summary: '从朱元璋废除丞相到崇祯煤山自缢,276 年明朝兴亡 —— 10 篇核心解读,涵盖开国、仁宣、万历中后期、崇祯、南明五个关键转折。',
    why: '明朝是离我们最近的一个"完整王朝",它的制度设计、政治挣扎,跟现代公司治理的相似度高得吓人。',
  },
  清朝: {
    tag: '清朝',
    title: '清朝',
    category: '朝代',
    summary: '从顺治 6 岁入关到宣统 1912 退位,267 年清朝兴亡 —— 9 篇核心解读,涵盖康乾盛世、嘉道中衰、鸦片战争、太平天国、戊戌变法、辛亥革命。',
    why: '清朝是离我们最近的一个"帝制王朝",它的衰亡过程,就是中国现代化的起点。',
  },
  三国: {
    tag: '三国',
    title: '三国',
    category: '朝代',
    summary: '从黄巾到三家归晋,61 年三国史 —— 8 篇核心解读,涵盖曹魏、刘蜀、孙吴三大集团的兴衰。',
    why: '三国是"非零和博弈"在乱世里最干净的样本。8 篇看完,你会有一种"原来博弈论早就被中国人玩透了"的感觉。',
  },
  南北朝: {
    tag: '南北朝',
    title: '南北朝',
    category: '朝代',
    summary: '从刘裕代晋到杨坚建隋,169 年南北朝史 —— 11 篇核心解读,涵盖宋齐梁陈 + 北朝五个少数民族政权。',
    why: '南北朝是中华民族的"混血时代",没有它就没有隋唐的开放包容。11 篇读懂,等于读懂中国第一次"民族大融合"。',
  },
  春秋: {
    tag: '春秋',
    title: '春秋',
    category: '朝代',
    summary: '从齐桓公称霸到吴越争霸,300 年春秋史 —— 5 篇核心解读,涵盖齐晋楚吴越五霸的兴衰。',
    why: '春秋是中国"国际关系"的源头,5 个霸主的"合纵连横"玩了 300 年,跟今天的全球贸易战是同一道题。',
  },
  宋: {
    tag: '宋',
    title: '宋',
    category: '朝代',
    summary: '从赵匡胤陈桥兵变到崖山南宋亡,319 年宋朝兴亡 —— 5 篇核心解读,涵盖北宋南宋的关键转折。',
    why: '宋朝是中国"重文轻武"政策的极致实验,它的失败给后世一个 1000 年的反例。',
  },
};

/** Fallback 简介 — 当 tag 没在 TOPIC_INTROS 中时,生成通用模板 */
function fallbackIntro(tag: string, count: number): TopicIntro {
  return {
    tag,
    title: tag,
    category: '主题',
    summary: `「${tag}」在 资治通鉴 183 篇解读里出现了 ${count} 次。从战国到清代,这个主题反复出现,意味着它抓住了中国 1362 年政治史的某个底层模式。`,
    why: `深入读「${tag}」相关的多篇解读,你能看到同一个主题在不同时代的"复现",这种复现本身就是历史最值得研究的现象。`,
  };
}

export interface TopicPage {
  tag: string;
  count: number;
  intro: TopicIntro;
  articles: ArticleMeta[];
}

/**
 * 收集所有 ≥ MIN_TAG_COUNT 的 tag,按出现频次倒序
 * 用于 /topic 索引页(列出所有主题入口)
 */
export function getAllTopicTags(): { tag: string; count: number }[] {
  const all = getAllArticles();
  const tagCount: Record<string, number> = {};
  for (const a of all) {
    for (const t of a.tags || []) {
      tagCount[t] = (tagCount[t] || 0) + 1;
    }
  }
  return Object.entries(tagCount)
    .filter(([, c]) => c >= MIN_TAG_COUNT)
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => ({ tag, count }));
}

/**
 * 单个主题深读页数据
 * @param tag URL 解码后的 tag
 * @returns null 当 tag 频次 < MIN_TAG_COUNT(404)或 count = 0
 */
export function getTopicPage(tag: string): TopicPage | null {
  const all = getAllArticles();
  const articles = all.filter((a) => (a.tags || []).includes(tag));
  if (articles.length < MIN_TAG_COUNT) return null;

  const count = articles.length;
  const intro = TOPIC_INTROS[tag] ?? fallbackIntro(tag, count);
  return { tag, count, intro, articles };
}

/**
 * 同 category 的相邻主题 — 给深读页底部"看其他主题"用
 */
export function getRelatedTopics(
  currentTag: string,
  currentCategory: string,
  limit = 6,
): { tag: string; count: number; category: string }[] {
  const all = getAllTopicTags();
  // 关联主题需要 category 信息 — 重读 TOPIC_INTROS 看是否有匹配 category
  return all
    .filter((t) => t.tag !== currentTag)
    .map((t) => ({
      ...t,
      category: TOPIC_INTROS[t.tag]?.category ?? '主题',
    }))
    .filter((t) => t.category === currentCategory)
    .slice(0, limit);
}
