/**
 * 资治通鉴目录页 — server component
 *
 * IA 三个层次:
 * 1. 顶部 hero:进度 + 总览统计
 * 2. 主视图:按朝代(8 组)展开,每组内含二级时代分组
 * 3. 横向视图:按主题(tag 云)
 *
 * 不做时间轴(50 篇时间跨度大,横轴画不下;改由 朝代内二级 era 替代)
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { getAllArticles } from '@/lib/articles';
import { findDynasty } from '@/lib/dynasties';
import { ARCHIVE_GROUPS, getArticleArchive, type ArchiveGroup } from '@/lib/archive';
import JsonLd from '@/components/JsonLd';
import { SITE_URL } from '@/lib/site-config';

export const metadata: Metadata = {
  title: '通鉴目录 — 50 篇 / 8 个时代 / 1 份 1362 年的决策复盘',
  description:
    '读通鉴全部 50 篇解读的完整目录。按朝代、主题、时代三种维度组织,从战国到一带一路。',
  alternates: { canonical: `${SITE_URL}/archive` },
};

// 资治通鉴总卷数 — 用于进度条
const TOTAL_VOLUMES = 294;

export default function ArchivePage() {
  const articles = getAllArticles();

  // 1. 给每篇文章富化 archive 字段(0 → 50)
  const enriched = articles
    .map((a) => {
      const meta = getArticleArchive(a.slug);
      if (!meta) return null;
      return { ...a, archive: meta };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    // 按发布时间倒序(沿用现有 IA),二级用 episode 升序
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );

  // 2. 按 groupId 分桶
  const byGroup: Record<string, typeof enriched> = {};
  for (const g of ARCHIVE_GROUPS) byGroup[g.id] = [];
  for (const a of enriched) byGroup[a.archive.groupId].push(a);

  // 3. 主题聚合:tag → articles
  // 注意:部分文章 tags 字段有重复(50-bri 的 "战略" 写了 2 次),先 dedupe 再按 tag 聚合
  const tagMap = new Map<string, typeof enriched>();
  for (const a of enriched) {
    const seen = new Set<string>();
    for (const t of a.tags ?? []) {
      if (seen.has(t)) continue;
      seen.add(t);
      if (!tagMap.has(t)) tagMap.set(t, []);
      // 同一文章多次命中同一 tag 也只 push 一次
      if (!tagMap.get(t)!.some((x) => x.slug === a.slug)) {
        tagMap.get(t)!.push(a);
      }
    }
  }
  // 排序:篇数降序,再按 tag 名升序
  const allTags = Array.from(tagMap.entries())
    .map(([name, arts]) => ({ name, count: arts.length, articles: arts }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  // 主题云只展示「跨文章」有价值的 tag(count >= 2) — 单次 tag 太碎,藏在展开里
  const tags = allTags.filter((t) => t.count >= 2);
  const singleCountTags = allTags.length - tags.length;

  // 4. 进度数据
  const totalCount = enriched.length;
  const progressPct = Math.round((totalCount / TOTAL_VOLUMES) * 100);

  // 5. Json-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: '读通鉴 · 通鉴目录',
    description: '50 篇资治通鉴 AI 解读,按朝代和主题组织。',
    url: `${SITE_URL}/archive`,
    isPartOf: { '@type': 'WebSite', name: '读通鉴', url: SITE_URL },
    hasPart: enriched.slice(0, 10).map((a) => ({
      '@type': 'Article',
      headline: a.title,
      url: `${SITE_URL}/article/${a.slug}`,
      datePublished: a.publishedAt,
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
            <span>通鉴目录</span>
            <span className="w-8 h-px bg-cinnabar"></span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-ink leading-tight mb-4">
            50 篇 · 8 个时代 · 一份 1362 年的决策复盘
          </h1>
          <p className="text-base md:text-lg text-ink-soft leading-relaxed mb-8">
            从三家分晋到一带一路,所有关键决策都在这里。按朝代、主题或时代浏览,找到你想读的那一篇。
          </p>

          {/* 统计卡 — 3 张 */}
          <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
            <ArchiveStat to={totalCount} unit="篇" desc="已发布解读" />
            <ArchiveStat
              to={ARCHIVE_GROUPS.length}
              unit="个时代"
              desc="从战国到现代"
            />
            <ArchiveStat
              to={tags.length}
              unit="个主题"
              desc={`跨朝代横切 · ${singleCountTags} 个专属主题`}
            />
          </div>

          {/* 进度条 */}
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between text-xs text-ink-mute mb-2">
              <span>资治通鉴 进度</span>
              <span className="tabular-nums">
                {totalCount} / {TOTAL_VOLUMES} 卷 · {progressPct}%
              </span>
            </div>
            <div
              className="h-1.5 bg-paper-deep rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`通鉴进度 ${progressPct}%`}
            >
              <div
                className="h-full bg-gradient-to-r from-cinnabar to-gold transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 主视图:按朝代 */}
      <section className="max-w-wide mx-auto px-6 py-8 md:py-12">
        <div className="flex items-end justify-between mb-6 md:mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-ink mb-1">
              按朝代浏览
            </h2>
            <p className="text-sm text-ink-mute">
              8 个时代 · 资治通鉴 7 朝代 + 通鉴之后的近现代
            </p>
          </div>
          <Link
            href="/#articles"
            className="hidden md:inline-flex items-center gap-1.5 text-xs text-ink-soft hover:text-cinnabar transition-colors"
          >
            <span>回首页看最新</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

        <div className="space-y-6">
          {ARCHIVE_GROUPS.map((g, gi) => {
            const list = byGroup[g.id];
            if (list.length === 0) return null; // 空朝代(南北朝)跳过
            const dynasty = findDynasty(g.name === '近现代' ? '' : g.name);
            const color = dynasty?.primary ?? '#3A3A3A';
            const secondary = dynasty?.secondary ?? '#A8895C';

            return (
              <ArchiveGroupCard
                key={g.id}
                group={g}
                articles={list}
                color={color}
                secondary={secondary}
                index={gi}
              />
            );
          })}
        </div>
      </section>

      {/* 横向视图:按主题 */}
      <section className="max-w-wide mx-auto px-6 py-8 md:py-12 border-t border-border-soft">
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-ink mb-1">
            按主题浏览
          </h2>
          <p className="text-sm text-ink-mute">
            同一个问题跨朝代的回响 — 比如「改革」从商鞅、王莽、王安石到邓小平
          </p>
        </div>

        <div className="flex flex-wrap gap-2 md:gap-2.5">
          {tags.map((t) => {
            // 字号:3-7 篇最大,2 篇中等,1 篇最小
            const sizeClass =
              t.count >= 5
                ? 'text-sm md:text-base px-3.5 py-1.5 font-semibold'
                : t.count >= 3
                ? 'text-xs md:text-sm px-3 py-1.5 font-medium'
                : 'text-[11px] md:text-xs px-2.5 py-1 font-normal';
            const colorClass =
              t.count >= 5
                ? 'bg-cinnabar text-paper border-cinnabar hover:bg-cinnabar-dark'
                : t.count >= 3
                ? 'bg-cinnabar-soft text-cinnabar-dark border-cinnabar/30 hover:border-cinnabar'
                : 'bg-paper-card text-ink-soft border-border hover:border-cinnabar/40 hover:text-cinnabar';

            return (
              <Link
                key={t.name}
                href={`#tag-${t.name}`}
                className={`inline-flex items-center gap-1.5 border rounded-sm transition-colors ${sizeClass} ${colorClass}`}
              >
                <span>{t.name}</span>
                {/* 去 opacity-70:text-ink-soft + 0.7 opacity 在 paper-card 上对比度 3.7:1
                   不达 AA,直接 tabular-nums 让父级 color 透传(深色 hot tag 也保持可读) */}
                <span className="tabular-nums">{t.count}</span>
              </Link>
            );
          })}
        </div>

        {/* 主题展开:每个 tag 列出前 5 篇 */}
        <div className="mt-10 space-y-4">
          {tags
            .filter((t) => t.count >= 3) // 只展开热门主题
            .slice(0, 8) // 最多展开 8 个
            .map((t) => (
              <div
                key={t.name}
                id={`tag-${t.name}`}
                className="bg-paper-card border border-border rounded-sm p-5 md:p-6 scroll-mt-20"
              >
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-sm font-semibold text-ink">#{t.name}</h3>
                  <span className="text-xs text-ink-mute">
                    {t.count} 篇 · 跨 {new Set(t.articles.map((a) => a.archive.groupId)).size}{' '}
                    个朝代
                  </span>
                </div>
                <ul className="grid md:grid-cols-2 gap-x-6 gap-y-0.5">
                  {t.articles.map((a) => (
                    <li key={a.slug} className="text-xs">
                      <Link
                        href={`/article/${a.slug}`}
                        // py-2.5 + flex 保证触摸目标 ≥ 24px(WCAG target size)
                        className="text-ink-soft hover:text-cinnabar transition-colors flex items-baseline gap-1.5 py-2.5 -mx-2 px-2 rounded-sm"
                      >
                        <span className="text-ink-mute tabular-nums shrink-0">
                          {String(a.episode).padStart(2, '0')}
                        </span>
                        <span className="truncate">{a.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      </section>
    </>
  );
}

/* ---------- 子组件 ---------- */

function ArchiveStat({ to, unit, desc }: { to: number; unit: string; desc: string }) {
  return (
    <div className="p-4 md:p-5 bg-paper-card border border-border rounded-sm text-left md:text-center">
      <div className="flex items-baseline gap-1 md:justify-center mb-1">
        <span className="classical text-2xl md:text-3xl font-bold text-cinnabar tabular-nums">
          {to}
        </span>
        <span className="text-xs md:text-sm text-ink-soft">{unit}</span>
      </div>
      <p className="text-[10px] md:text-xs text-ink-mute">{desc}</p>
    </div>
  );
}

function ArchiveGroupCard({
  group,
  articles,
  color,
  secondary,
  index,
}: {
  group: ArchiveGroup;
  articles: Array<{
    slug: string;
    title: string;
    subtitle: string;
    excerpt: string;
    readingTime: number;
    episode: number;
    publishedAt: string;
    dynasty: string;
    volume: string;
    tags: string[];
    views: number;
    archive: { volumeLabel: string; era: string; year: number };
  }>;
  color: string;
  secondary: string;
  index: number;
}) {
  // 在 group 内按 episode 升序(读 资治通鉴 应该从头读起)
  const sorted = [...articles].sort((a, b) => a.episode - b.episode);

  // 二级 era 分组
  const eraGroups = new Map<string, typeof sorted>();
  for (const a of sorted) {
    const e = a.archive.era;
    if (!eraGroups.has(e)) eraGroups.set(e, []);
    eraGroups.get(e)!.push(a);
  }

  return (
    <article
      id={`group-${group.id}`}
      className="bg-paper-card border border-border rounded-sm overflow-hidden scroll-mt-20"
      style={
        {
          ['--stagger-delay' as string]: `${index * 60}ms`,
        } as CSSProperties
      }
    >
      {/* 朝代 header */}
      <header
        className="px-5 md:px-7 py-4 md:py-5 border-b border-border-soft flex flex-wrap items-baseline gap-x-4 gap-y-1"
        style={{
          background: `linear-gradient(135deg, ${color}08, ${secondary}05)`,
        }}
      >
        <h3 className="text-lg md:text-xl font-bold text-ink classical flex items-baseline gap-2">
          <span
            className="w-1.5 h-5 rounded-sm inline-block"
            style={{ background: color }}
            aria-hidden
          />
          {group.name}
        </h3>
        <span className="text-xs text-ink-mute">{group.period}</span>
        <span className="text-xs text-ink-mute">·</span>
        <span className="text-xs text-ink-mute tabular-nums">
          {sorted.length} 篇
        </span>
        <p className="w-full mt-1 text-xs text-ink-soft leading-relaxed">
          {group.summary}
        </p>
      </header>

      {/* 文章列表 — 按 era 二级分组 */}
      <div className="divide-y divide-border-soft">
        {Array.from(eraGroups.entries()).map(([era, arts]) => (
          <div key={era} className="px-5 md:px-7 py-3">
            {/* era 标签(二级时代)— 只在 era 有 >1 篇时显示成"分组",否则 inline
                用 cinnabar-dark 而不是 dynasty.primary:某些朝代的 primary 在 paper-card 上
                对比度 < 4.5:1(隋唐金 #A8895C 是 3.0:1),改统一色保留层级不破坏 a11y */}
            {eraGroups.size > 1 && (
              <div className="flex items-center gap-2 mb-2 mt-1">
                <span
                  className="text-[10px] font-semibold tracking-widest uppercase text-cinnabar-dark"
                >
                  {era}
                </span>
                <span className="flex-1 h-px bg-border-soft"></span>
                <span className="text-[10px] text-ink-mute tabular-nums">
                  {arts.length} 篇
                </span>
              </div>
            )}

            <ul className="space-y-1">
              {arts.map((a) => (
                <li key={a.slug}>
                  <Link
                    href={`/article/${a.slug}`}
                    className="group flex items-baseline gap-3 py-1.5 hover:text-cinnabar transition-colors"
                  >
                    {/* EP 编号 */}
                    <span className="text-[10px] text-ink-mute tabular-nums w-6 shrink-0 text-right">
                      {String(a.episode).padStart(2, '0')}
                    </span>
                    {/* era 内联标签(无二级分组时)— 用斜体古典字 */}
                    {eraGroups.size === 1 && (
                      <span className="text-[10px] text-ink-mute w-16 shrink-0 truncate">
                        {a.archive.volumeLabel}
                      </span>
                    )}
                    {/* 标题 */}
                    <span className="text-sm text-ink-soft group-hover:text-cinnabar truncate">
                      {a.title}
                    </span>
                    {/* 阅读时长 */}
                    <span className="ml-auto text-[10px] text-ink-mute shrink-0 hidden sm:inline">
                      {a.readingTime} 分钟
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </article>
  );
}
