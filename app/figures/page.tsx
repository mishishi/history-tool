/**
 * 人物长卷页 — server component
 *
 * IA 三个层次:
 * 1. Hero:总人物数 / 跨朝代数(出现 2+ 篇)/ 反复出现(3+ 篇)
 * 2. 跨朝代人物:FeaturedFigures — 21 人在 2+ 篇(SEO 黄金)
 * 3. 全部人物:238 人,按「出现频次」降序,4 列卡片
 *
 * 单人物详情页在 /figures/[slug],链接从这里出去
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllArticles } from '@/lib/articles';
import { getAllFigures, getFeaturedFigures, type FigureEntry } from '@/lib/figures';
import JsonLd from '@/components/JsonLd';
import { SITE_URL } from '@/lib/site-config';

export const metadata: Metadata = {
  title: '人物长卷 — 238 个跨越 1362 年的关键人物',
  description:
    '从三家分晋到一带一路,所有关键人物一目了然。按出现频次排序,看一个人的全部决策。',
  alternates: { canonical: `${SITE_URL}/figures` },
};

export default function FiguresPage() {
  const allFigures = getAllFigures();
  const featured = getFeaturedFigures(); // 2+ 篇
  const repeating = allFigures.filter((f) => f.articleSlugs.length >= 3); // 3+ 篇
  const articles = getAllArticles();

  // 给每个 figure 附 article 详情(title/dynasty/episode)给 index 用
  const articleMap = new Map(articles.map((a) => [a.slug, a]));

  // 统计
  const totalFigures = allFigures.length;
  const featuredCount = featured.length;
  const repeatingCount = repeating.length;

  // JSON-LD:ItemList schema(人物列表)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: '读通鉴 · 人物长卷',
    description: '资治通鉴 50 篇解读中所有关键人物',
    numberOfItems: totalFigures,
    itemListElement: featured.slice(0, 20).map((f, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: f.name,
      url: `${SITE_URL}/figures/${encodeURIComponent(f.name)}`,
    })),
  };

  return (
    <>
      <JsonLd data={jsonLd} />

      {/* Hero */}
      <section className="max-w-wide mx-auto px-6 pt-12 md:pt-16 pb-8">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-4 text-xs text-ink-mute tracking-widest uppercase">
            <span className="w-8 h-px bg-cinnabar"></span>
            <span>人物长卷</span>
            <span className="w-8 h-px bg-cinnabar"></span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-ink leading-tight mb-4">
            {totalFigures} 个人物 · 跨越 1362 年的关键决策者
          </h1>
          <p className="text-base md:text-lg text-ink-soft leading-relaxed mb-8">
            从智瑶到邓小平,所有在通鉴里走过场的人,都按「出现频次」聚在这里。点开一个,看他所有相关解读。
          </p>

          {/* 3 张统计卡 */}
          <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
            <FiguresStat to={totalFigures} unit="位" desc="已收录人物" />
            <FiguresStat
              to={featuredCount}
              unit="位"
              desc="跨 2+ 篇文章"
            />
            <FiguresStat
              to={repeatingCount}
              unit="位"
              desc="反复出现 (3+ 篇)"
            />
          </div>
        </div>
      </section>

      {/* 跨朝代核心人物(2+ 篇)— 突出展示 */}
      {featured.length > 0 && (
        <section className="max-w-wide mx-auto px-6 py-8 md:py-12">
          <div className="mb-6 md:mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-ink mb-1">
              跨朝代核心人物
            </h2>
            <p className="text-sm text-ink-mute">
              这些人在 2+ 篇解读里出现,看他们的反复出场能串起整个时代
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {featured.map((fig) => (
              <FigureCard
                key={fig.name}
                figure={fig}
                articles={articleMap}
                variant="featured"
              />
            ))}
          </div>
        </section>
      )}

      {/* 全部人物(1+ 篇)— 完整列表 */}
      <section className="max-w-wide mx-auto px-6 py-8 md:py-12 border-t border-border-soft">
        <div className="mb-6 md:mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-ink mb-1">
              全部人物
            </h2>
            <p className="text-sm text-ink-mute">
              按出现频次降序 · 共 {totalFigures} 位
            </p>
          </div>
          <span className="hidden md:inline text-xs text-ink-mute">
            ← 滚动浏览 →
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3">
          {allFigures.map((fig) => (
            <FigureCard
              key={fig.name}
              figure={fig}
              articles={articleMap}
              variant="compact"
            />
          ))}
        </div>
      </section>
    </>
  );
}

/* ---------- 子组件 ---------- */

function FiguresStat({ to, unit, desc }: { to: number; unit: string; desc: string }) {
  return (
    <div className="p-4 md:p-5 bg-paper-card border border-border rounded-sm text-left md:text-center">
      <div className="flex items-baseline gap-1 md:justify-center mb-1">
        <span className="classical text-2xl md:text-3xl font-bold text-cinnabar tabular-nums">
          {to}
        </span>
        <span className="text-xs md:text-sm text-ink-soft">{unit}</span>
      </div>
      <p className="text-xs text-ink-mute">{desc}</p>
    </div>
  );
}

function FigureCard({
  figure,
  articles,
  variant,
}: {
  figure: FigureEntry;
  articles: Map<string, { slug: string; title: string; dynasty: string; episode: number }>;
  variant: 'featured' | 'compact';
}) {
  const count = figure.articleSlugs.length;
  const href = `/figures/${encodeURIComponent(figure.name)}`;

  if (variant === 'compact') {
    return (
      <Link
        href={href}
        className="group block p-3 bg-paper-card border border-border hover:border-cinnabar rounded-sm transition-colors"
      >
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <h3 className="text-sm font-semibold text-ink group-hover:text-cinnabar transition-colors truncate">
            {figure.name}
          </h3>
          <span className="text-xs text-ink-mute tabular-nums shrink-0">
            ×{count}
          </span>
        </div>
        {figure.aliases.length > 0 && (
          <p className="text-xs text-ink-mute truncate">
            {figure.aliases.join(' · ')}
          </p>
        )}
      </Link>
    );
  }

  // featured 卡片:大卡片,显示角色 + 关联文章预览
  return (
    <Link
      href={href}
      className="group block p-4 md:p-5 bg-paper-card border border-border hover:border-cinnabar rounded-sm transition-colors"
    >
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <h3 className="text-base md:text-lg font-semibold text-ink group-hover:text-cinnabar transition-colors">
          {figure.name}
        </h3>
        <span
          className={`px-1.5 py-0.5 text-xs tabular-nums rounded-sm ${
            count >= 3
              ? 'bg-cinnabar text-paper'
              : 'bg-cinnabar-soft text-cinnabar-dark'
          }`}
        >
          ×{count}
        </span>
      </div>

      {figure.aliases.length > 0 && (
        <p className="text-xs text-ink-mute mb-2">
          {figure.aliases.join(' · ')}
        </p>
      )}

      <p className="text-xs text-ink-soft leading-relaxed line-clamp-2 mb-3 min-h-[2.5rem]">
        {figure.role}
      </p>

      {/* 关联文章(前 3 篇)— 用 episode + 短标题 */}
      <ul className="space-y-0.5 pt-2 border-t border-border-soft">
        {figure.articleSlugs.slice(0, 3).map((slug) => {
          const a = articles.get(slug);
          if (!a) return null;
          return (
            <li
              key={slug}
              className="text-xs text-ink-mute flex items-baseline gap-1.5 truncate"
            >
              <span className="text-ink-mute/60 tabular-nums shrink-0 w-5 text-right">
                {String(a.episode).padStart(2, '0')}
              </span>
              <span className="truncate">{a.title}</span>
            </li>
          );
        })}
        {figure.articleSlugs.length > 3 && (
          <li className="text-xs text-ink-mute/70">
            等 {figure.articleSlugs.length - 3} 篇…
          </li>
        )}
      </ul>
    </Link>
  );
}
