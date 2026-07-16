/**
 * /topic — 主题深读索引
 *
 * 列出所有 ≥3 次出现的主题(30+ 个),按 category 分组展示
 * 每个主题显示:tag 名 + 简介(100 字内)+ 文章数
 *
 * 跟 archive 互补:
 * - archive:按朝代/时间线
 * - topic:按主题/跨朝代
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllTopicTags, TOPIC_INTROS, fallbackIntro, MIN_TAG_COUNT } from '@/lib/topics';
import { getAllArticles } from '@/lib/articles';
import JsonLd from '@/components/JsonLd';
import { SITE_URL } from '@/lib/site-config';

export const metadata: Metadata = {
  title: '主题深读 — 跨朝代聚合 30+ 个关键主题',
  description: '资治通鉴 183 篇深度解读按主题重新组织。改革、决策、创业、战略、团队 — 跨朝代看同一个母题。',
  alternates: { canonical: `${SITE_URL}/topic` },
  openGraph: {
    title: '主题深读 — 跨朝代聚合 30+ 个关键主题',
    description: '资治通鉴按主题重新组织。',
    type: 'website',
    url: `${SITE_URL}/topic`,
    siteName: '读通鉴',
    locale: 'zh_CN',
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: '主题深读 — 跨朝代聚合 30+ 个关键主题',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '主题深读 — 跨朝代聚合 30+ 个关键主题',
    description: '资治通鉴按主题重新组织。',
    images: [`${SITE_URL}/opengraph-image`],
  },
};

const CATEGORIES_ORDER: ('战略' | '改革' | '制度' | '危机' | '人物' | '人物群像' | '主题' | '朝代')[] = [
  '战略',
  '改革',
  '制度',
  '危机',
  '人物',
  '人物群像',
  '主题',
  '朝代',
];

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  战略: '决策、创业、用人、联盟、谈判 — 古代权力博弈的核心方法论。',
  改革: '王安石到张居正 — 改革者怎么输,比怎么赢更值得研究。',
  制度: '三省六部、科举、军机处 — 改变中国 200 年走向的制度设计。',
  危机: '4 个几乎亡国的危机和 4 种不同的反弹路径。',
  人物: '7 位改变中国走向的帝王、创始人画像。',
  人物群像: '9 个零资源起家的草根逆袭故事。',
  主题: '信用、信任、权力、韧性 — 跨朝代的母题。',
  朝代: '按朝代聚合:唐朝、明朝、清朝等核心朝代集中读。',
};

export default function TopicIndexPage() {
  const allTags = getAllTopicTags();
  const allArticles = getAllArticles();
  const totalArticles = allArticles.length;

  // 按 category 分组
  const byCategory: Record<string, { tag: string; count: number; intro: ReturnType<typeof fallbackIntro> }[]> = {};
  for (const { tag, count } of allTags) {
    const intro = TOPIC_INTROS[tag] ?? fallbackIntro(tag, count);
    if (!byCategory[intro.category]) byCategory[intro.category] = [];
    byCategory[intro.category].push({ tag, count, intro });
  }

  // 每个 category 内按频次降序
  for (const k of Object.keys(byCategory)) {
    byCategory[k].sort((a, b) => b.count - a.count);
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: '主题深读 — 资治通鉴按主题',
    description: '资治通鉴 183 篇按主题重新组织,跨朝代看同一个母题。',
    url: `${SITE_URL}/topic`,
    isPartOf: {
      '@type': 'WebSite',
      name: '读通鉴',
      url: SITE_URL,
    },
  };

  return (
    <>
      <JsonLd data={jsonLd} />

      <div className="max-w-wide mx-auto px-4 sm:px-6 pt-8 pb-12">
        {/* Hero */}
        <header className="mb-10 pb-8 border-b border-border">
          <div className="flex items-center gap-2 mb-3">
            <span className="seal-gold">主题深读</span>
            <span className="text-xs text-ink-mute">Topic Hub</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-ink leading-tight mb-4">
            主题深读
          </h1>
          <p className="text-base sm:text-lg text-ink-soft leading-relaxed max-w-3xl mb-6">
            资治通鉴 183 篇按主题重新聚合 — 改革、决策、创业、战略、团队,
            跨朝代看同一个母题。读者不必按时间顺序读完,可以从一个你关心的母题切入。
          </p>

          <div className="flex flex-wrap items-center gap-6">
            <div>
              <div className="text-2xl font-bold text-cinnabar tabular-nums">
                {allTags.length}
              </div>
              <div className="text-xs text-ink-mute">个主题</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-ink tabular-nums">
                {MIN_TAG_COUNT}+
              </div>
              <div className="text-xs text-ink-mute">篇起建</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-ink tabular-nums">
                {totalArticles}
              </div>
              <div className="text-xs text-ink-mute">总文章</div>
            </div>
          </div>
        </header>

        {/* 面包屑替代 */}
        <div className="mb-6">
          <Link
            href="/archive"
            className="text-sm text-ink-soft hover:text-cinnabar transition-colors inline-flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            按朝代查看目录
          </Link>
        </div>

        {/* 按 category 分组的主题列表 */}
        {CATEGORIES_ORDER.filter((c) => byCategory[c]?.length).map((cat) => (
          <section key={cat} className="mb-10">
            <div className="flex items-baseline justify-between mb-2">
              <h2 className="text-xl md:text-2xl font-bold text-ink">
                {cat}
              </h2>
              <span className="text-xs text-ink-mute tabular-nums">
                {byCategory[cat].length} 个主题
              </span>
            </div>
            <p className="text-sm text-ink-soft mb-5">
              {CATEGORY_DESCRIPTIONS[cat]}
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {byCategory[cat].map(({ tag, count, intro }) => (
                <Link
                  key={tag}
                  href={`/topic/${encodeURIComponent(tag)}`}
                  className="group block p-5 bg-paper-card border border-border hover:border-cinnabar rounded-sm transition-all hover:shadow-sm"
                >
                  <div className="flex items-baseline justify-between mb-2">
                    <h3 className="text-base font-bold text-ink group-hover:text-cinnabar transition-colors">
                      {tag}
                    </h3>
                    <span className="text-xs text-ink-mute tabular-nums shrink-0 ml-2">
                      {count} 篇
                    </span>
                  </div>
                  <p className="text-xs text-ink-soft leading-relaxed line-clamp-3">
                    {intro.summary}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
