/**
 * /topic/[tag] — 主题深读页
 *
 * 跨朝代聚合,展示所有 tag 匹配的文章,带:
 * - tag 简介(预写/通用 fallback)
 * - 朝代分布(朝代 color bar)
 * - 文章列表(按朝代分组,每个朝代下按 episode 升序)
 * - 关联主题(同 category)
 *
 * SEO:
 * - title: 主题名 + 副标题
 * - description: 简介 + 文章数
 * - canonical: /topic/{tag}
 * - JSON-LD: CollectionPage + ItemList
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllArticles } from '@/lib/articles';
import {
  getTopicPage,
  getRelatedTopics,
  getAllTopicTags,
  TOPIC_INTROS,
} from '@/lib/topics';
import { findDynasty } from '@/lib/dynasties';
import { ARCHIVE_GROUPS, getArticleArchive } from '@/lib/archive';
import ArticleCard from '@/components/ArticleCard';
import JsonLd from '@/components/JsonLd';
import Seal from '@/components/Seal';
import { SITE_URL } from '@/lib/site-config';

// --- 静态生成所有 tag 路由 ---
export async function generateStaticParams() {
  const all = getAllTopicTags();
  return all.map(({ tag }) => ({ tag: encodeURIComponent(tag) }));
}

// --- SEO metadata ---
export async function generateMetadata({
  params,
}: {
  params: { tag: string };
}): Promise<Metadata> {
  const tag = decodeURIComponent(params.tag);
  const page = getTopicPage(tag);
  if (!page) return {};

  const { intro, count } = page;
  const title = `${tag} — ${count} 篇解读 | 主题深读`;
  const description = `${intro.summary.slice(0, 90)}… 涵盖 ${count} 篇跨朝代深度解读。`;

  return {
    title,
    description,
    keywords: [tag, '资治通鉴', '历史解读', intro.category],
    alternates: { canonical: `${SITE_URL}/topic/${encodeURIComponent(tag)}` },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${SITE_URL}/topic/${encodeURIComponent(tag)}`,
      siteName: '读通鉴',
      locale: 'zh_CN',
      images: [
        {
          url: `${SITE_URL}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_URL}/opengraph-image`],
    },
  };
}

// --- 按朝代分组的辅助 ---
type Group = {
  groupId: string;
  groupName: string;
  archiveGroupName: string;
  articles: ReturnType<typeof getAllArticles>;
};

export default function TopicPage({ params }: { params: { tag: string } }) {
  const tag = decodeURIComponent(params.tag);
  const page = getTopicPage(tag);
  if (!page) notFound();

  const { intro, count, articles } = page;

  // 按朝代 archive groupId 分组
  const byGroup: Record<string, Group> = {};
  for (const a of articles) {
    const arch = getArticleArchive(a.slug);
    if (!arch) continue;
    const groupId = arch.groupId;
    if (!byGroup[groupId]) {
      const groupMeta = ARCHIVE_GROUPS.find((g) => g.id === groupId);
      byGroup[groupId] = {
        groupId,
        groupName: groupMeta?.name ?? groupId,
        archiveGroupName: groupMeta?.name ?? groupId,
        articles: [],
      };
    }
    byGroup[groupId].articles.push(a);
  }

  // 按 ARCHIVE_GROUPS 顺序排(战国 → 近现代)
  const groups = ARCHIVE_GROUPS
    .map((g) => byGroup[g.id])
    .filter((g): g is Group => Boolean(g));

  // 每个朝代内按 episode 升序
  for (const g of groups) {
    g.articles.sort((a, b) => a.episode - b.episode);
  }

  // 朝代分布数据
  const dynastyDistribution = groups.map((g) => ({
    name: g.groupName,
    count: g.articles.length,
    pct: Math.round((g.articles.length / count) * 100),
  }));

  // 关联主题(同 category)
  const relatedTopics = getRelatedTopics(tag, intro.category, 6);

  // JSON-LD: CollectionPage + ItemList
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${tag} — 主题深读`,
    description: intro.summary,
    url: `${SITE_URL}/topic/${encodeURIComponent(tag)}`,
    isPartOf: {
      '@type': 'WebSite',
      name: '读通鉴',
      url: SITE_URL,
    },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: count,
      itemListElement: articles.slice(0, 20).map((a, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${SITE_URL}/article/${a.slug}`,
        name: a.title,
      })),
    },
  };

  return (
    <>
      <JsonLd data={jsonLd} />

      <div className="max-w-wide mx-auto px-4 sm:px-6 pt-8 pb-6">
        {/* 面包屑 */}
        <nav className="flex items-center gap-2 text-xs text-ink-mute mb-6">
          <Link href="/" className="hover:text-cinnabar transition-colors">
            首页
          </Link>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link href="/archive" className="hover:text-cinnabar transition-colors">
            目录
          </Link>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-ink-soft">主题 · {tag}</span>
        </nav>

        {/* Hero */}
        <header className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="seal-gold">{intro.category}</span>
            <span className="text-xs text-ink-mute">主题深读</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-ink leading-tight mb-4">
            {tag}
          </h1>
          <p className="text-base sm:text-lg text-ink-soft leading-relaxed max-w-3xl">
            {intro.summary}
          </p>

          {/* 数据条 */}
          <div className="flex flex-wrap items-center gap-6 mt-6 pt-6 border-t border-border">
            <div>
              <div className="text-2xl font-bold text-cinnabar tabular-nums">{count}</div>
              <div className="text-xs text-ink-mute">篇文章</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-ink tabular-nums">{groups.length}</div>
              <div className="text-xs text-ink-mute">个朝代</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-ink tabular-nums">
                {Math.min(...articles.map((a) => a.episode))}–{Math.max(...articles.map((a) => a.episode))}
              </div>
              <div className="text-xs text-ink-mute">通鉴期数</div>
            </div>
          </div>
        </header>

        {/* 朝代分布条 */}
        {dynastyDistribution.length > 0 && (
          <div className="mb-10 p-4 bg-paper-card border border-border rounded-sm">
            <div className="text-xs text-ink-mute mb-2">朝代分布</div>
            <div className="flex h-3 rounded-full overflow-hidden bg-paper-deep">
              {dynastyDistribution.map((d) => (
                <div
                  key={d.name}
                  className="bg-cinnabar/80"
                  style={{ width: `${d.pct}%` }}
                  title={`${d.name}: ${d.count} 篇 (${d.pct}%)`}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-3 mt-3 text-xs">
              {dynastyDistribution.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cinnabar/80" />
                  <span className="text-ink-soft">
                    {d.name} · <span className="tabular-nums">{d.count}</span> 篇
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 「为什么读」— 给犹豫中的用户一个 push */}
        <div className="mb-12 p-5 md:p-6 bg-paper-deep border-l-2 border-cinnabar rounded-sm">
          <div className="text-[11px] text-cinnabar classical tracking-widest uppercase mb-2">
            为 何 读 这 个 主 题
          </div>
          <p className="text-sm md:text-base text-ink-soft leading-relaxed">
            {intro.why}
          </p>
        </div>

        {/* 主视图:按朝代分组的文章列表 */}
        <div className="mb-12">
          <h2 className="text-xl md:text-2xl font-bold text-ink mb-6">
            {count} 篇深度解读
          </h2>
          {groups.map((g) => (
            <section key={g.groupId} className="mb-10">
              <div className="flex items-baseline justify-between mb-4 pb-2 border-b border-border">
                <h3 className="text-lg md:text-xl font-bold text-ink">
                  {g.groupName}
                </h3>
                <span className="text-xs text-ink-mute tabular-nums">
                  {g.articles.length} 篇
                </span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {g.articles.map((a) => (
                  <ArticleCard key={a.slug} article={a} />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* 关联主题 */}
        {relatedTopics.length > 0 && (
          <div className="mb-10 pt-10 border-t border-border">
            <h2 className="text-lg md:text-xl font-bold text-ink mb-2">
              同类主题
            </h2>
            <p className="text-sm text-ink-mute mb-5">
              同一分类「{intro.category}」下的其他主题
            </p>
            <div className="flex flex-wrap gap-2">
              {relatedTopics.map((t) => (
                <Link
                  key={t.tag}
                  href={`/topic/${encodeURIComponent(t.tag)}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-paper-card border border-border hover:border-cinnabar rounded-sm text-sm transition-colors"
                >
                  <span className="font-medium text-ink">{t.tag}</span>
                  <span className="text-xs text-ink-mute tabular-nums">
                    {t.count} 篇
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 主题索引回链 */}
        <div className="text-center pt-8 border-t border-border">
          <Link
            href="/topic"
            className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-cinnabar transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            查看全部主题索引
          </Link>
        </div>
      </div>
    </>
  );
}
