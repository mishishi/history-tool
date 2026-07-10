/**
 * 单人物详情页 — /figures/[slug]
 *
 * slug 是 URL-encoded primary name(e.g. 智瑶 → %E6%99%BA%E7%91%B0)
 * Next.js 自动 decode,params.slug = "智瑶"
 *
 * IA:
 * 1. 人物 header:名字 + 别名 + 角色 + 统计
 * 2. 时间轴:所有相关文章,按发布时间倒序,每篇标注朝代 + 时期
 * 3. 回链:通鉴目录、首页
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllArticles } from '@/lib/articles';
import { getAllFigures, getFigureBySlug } from '@/lib/figures';
import { getArticleArchive } from '@/lib/archive';
import JsonLd from '@/components/JsonLd';
import { SITE_URL } from '@/lib/site-config';

export const dynamicParams = false; // 只生成已有 slug,其他 404

export async function generateStaticParams() {
  return getAllFigures().map((f) => ({
    slug: f.name, // Next.js 自动 URL-encode 路径段
  }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  // params.slug 已经是 URL-decoded(Next.js 处理过)
  const figure = getFigureBySlug(params.slug);
  if (!figure) return { title: '人物未找到' };
  const title = `${figure.name} — 人物长卷`;
  const desc =
    figure.role.slice(0, 80) +
    ` · 出现在 ${figure.articleSlugs.length} 篇解读中`;
  return {
    title,
    description: desc,
    alternates: { canonical: `${SITE_URL}/figures/${encodeURIComponent(figure.name)}` },
  };
}

export default function FigureDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  // params.slug 是 URL-decoded 的(Next.js 已处理)
  const figure = getFigureBySlug(params.slug);
  if (!figure) notFound();

  const allArticles = getAllArticles();
  const articleMap = new Map(allArticles.map((a) => [a.slug, a]));

  // 该人物的 article 详情 — 按发布时间倒序(跟全站 IA 一致)
  const relatedArticles = figure.articleSlugs
    .map((slug) => articleMap.get(slug))
    .filter((a): a is NonNullable<typeof a> => a !== undefined)
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );

  // 给每篇 article 附 archive 富化(朝代组 / era / year)给时间轴用
  const enriched = relatedArticles
    .map((a) => {
      const arch = getArticleArchive(a.slug);
      return arch ? { ...a, archive: arch } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  // 朝代分布
  const dynastyCount = new Map<string, number>();
  for (const a of enriched) {
    dynastyCount.set(a.archive.groupId, (dynastyCount.get(a.archive.groupId) || 0) + 1);
  }
  const dynastiesTouched = Array.from(dynastyCount.keys());

  // JSON-LD: Person schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: figure.name,
    alternateName: figure.aliases,
    description: figure.role,
    url: `${SITE_URL}/figures/${encodeURIComponent(figure.name)}`,
    isPartOf: { '@type': 'WebSite', name: '读通鉴', url: SITE_URL },
  };

  return (
    <>
      <JsonLd data={jsonLd} />

      <article className="max-w-narrow mx-auto px-6 pt-12 md:pt-16 pb-12">
        {/* 面包屑 */}
        <nav
          aria-label="面包屑"
          className="flex items-center gap-2 text-xs text-ink-mute mb-6"
        >
          <Link href="/figures" className="hover:text-cinnabar transition-colors">
            人物长卷
          </Link>
          <span>/</span>
          <span className="text-ink-soft">{figure.name}</span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <h1 className="text-3xl md:text-5xl font-bold text-ink leading-tight mb-3 classical">
            {figure.name}
            {figure.aliases.length > 0 && (
              <span className="ml-3 text-base md:text-lg text-ink-mute font-normal">
                ({figure.aliases.join(' · ')})
              </span>
            )}
          </h1>

          <p className="text-base md:text-lg text-ink-soft leading-relaxed mb-6">
            {figure.role}
          </p>

          {/* meta 行 */}
          <div className="flex flex-wrap items-center gap-3 md:gap-5 text-xs text-ink-mute">
            <span className="inline-flex items-center gap-1.5">
              <span className="text-ink-soft font-medium tabular-nums">
                {relatedArticles.length}
              </span>
              <span>篇解读</span>
            </span>
            <span className="w-1 h-1 rounded-full bg-ink-mute"></span>
            <span className="inline-flex items-center gap-1.5">
              <span className="text-ink-soft font-medium tabular-nums">
                {dynastiesTouched.length}
              </span>
              <span>个朝代</span>
            </span>
            {dynastiesTouched.length > 0 && (
              <>
                <span className="w-1 h-1 rounded-full bg-ink-mute"></span>
                <span className="text-ink-soft">
                  {dynastiesTouched.slice(0, 4).map((d) => {
                    const labels: Record<string, string> = {
                      zhanguo: '战国',
                      qinhan: '秦汉',
                      sanguo: '三国',
                      liangjin: '两晋',
                      nanbeichao: '南北朝',
                      suitang: '隋唐',
                      wudai: '五代',
                      modern: '近现代',
                    };
                    return labels[d] || d;
                  }).join(' · ')}
                  {dynastiesTouched.length > 4 && ' 等'}
                </span>
              </>
            )}
          </div>
        </header>

        {/* 文章时间轴 */}
        {enriched.length === 0 ? (
          <div className="text-center py-12 text-ink-mute">
            <p>暂无相关解读</p>
          </div>
        ) : (
          <div>
            <h2 className="text-lg md:text-xl font-semibold text-ink mb-5 flex items-baseline gap-2">
              <span className="w-1 h-5 bg-cinnabar rounded-sm"></span>
              <span>所有相关解读</span>
              <span className="text-xs text-ink-mute font-normal">
                · 按发布时间
              </span>
            </h2>

            <ol className="space-y-3">
              {enriched.map((a) => (
                <li key={a.slug}>
                  <Link
                    href={`/article/${a.slug}`}
                    className="group block p-4 md:p-5 bg-paper-card border border-border hover:border-cinnabar rounded-sm transition-colors"
                  >
                    <div className="flex items-baseline gap-3 mb-2">
                      <span className="text-xs text-ink-mute tabular-nums shrink-0">
                        EP{String(a.episode).padStart(2, '0')}
                      </span>
                      <span className="text-xs text-cinnabar-dark font-medium uppercase tracking-widest">
                        {a.archive.era}
                      </span>
                      <span className="text-xs text-ink-mute">
                        {a.archive.groupId === 'modern'
                          ? '近现代'
                          : a.dynasty}
                      </span>
                    </div>
                    <h3 className="text-base md:text-lg font-semibold text-ink group-hover:text-cinnabar transition-colors leading-snug mb-1.5">
                      {a.title}
                    </h3>
                    {a.subtitle && (
                      <p className="text-xs md:text-sm text-ink-soft leading-relaxed line-clamp-2">
                        {a.subtitle}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* 底部链接 */}
        <div className="mt-12 pt-6 border-t border-border-soft flex flex-wrap items-center gap-3 text-sm">
          <Link
            href="/archive"
            className="text-ink-soft hover:text-cinnabar transition-colors"
          >
            ← 回到通鉴目录
          </Link>
          <span className="text-ink-mute">·</span>
          <Link
            href="/figures"
            className="text-ink-soft hover:text-cinnabar transition-colors"
          >
            全部人物
          </Link>
        </div>
      </article>
    </>
  );
}
