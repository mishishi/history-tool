/**
 * /timeline — 资治通鉴朝代时间线
 *
 * 横向 8 列(朝代) × 纵向 N 张文章(按 episode 升序)
 * - 桌面:横向滚动
 * - 移动:竖向按朝代分组
 *
 * 跟 figures-graph 形成"网+轴"双视角
 * 跟 archive 形成"列表+图"双视图
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import TimelineView from '@/components/TimelineView';
import { getTimelineColumns, getTimelineMeta } from '@/lib/timeline';
import { SITE_URL } from '@/lib/site-config';

export const metadata: Metadata = {
  title: '朝代时间线 — 100 篇 / 1362 年 / 一条河',
  description:
    '把 100 篇文章铺在朝代时间线上,从战国到一带一路。每列是一个朝代,按时间顺序展开,一眼看清一个朝代的全貌。',
  alternates: { canonical: `${SITE_URL}/timeline` },
  openGraph: {
    title: '朝代时间线 — 100 篇 / 1362 年 / 一条河',
    description: '把 100 篇文章铺在朝代时间线上,一眼看清一个朝代的全貌。',
    type: 'website',
    url: `${SITE_URL}/timeline`,
    siteName: '读通鉴',
    locale: 'zh_CN',
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: '朝代时间线 — 100 篇 / 1362 年',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '朝代时间线 — 100 篇 / 1362 年 / 一条河',
    description: '把 100 篇文章铺在朝代时间线上',
    images: [`${SITE_URL}/opengraph-image`],
  },
};

export default function TimelinePage() {
  const columns = getTimelineColumns();
  const meta = getTimelineMeta(columns);

  // JSON-LD:ItemList(每篇文章)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: '读通鉴 · 朝代时间线',
    description: '资治通鉴 100 篇文章按朝代时间线组织',
    numberOfItems: meta.totalArticles,
  };

  return (
    <>
      <JsonLd data={jsonLd} />

      <div className="max-w-wide mx-auto px-6 py-8 md:py-12">
        {/* Hero */}
        <header className="mb-8 md:mb-12">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 mb-4 text-xs text-ink-mute tracking-widest uppercase">
              <span className="w-8 h-px bg-cinnabar"></span>
              <span>朝代时间线</span>
              <span className="w-8 h-px bg-cinnabar"></span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-ink leading-tight mb-3">
              {meta.totalArticles} 篇 · {meta.totalDynasties} 个朝代 · {meta.yearSpan} 年
            </h1>
            <p className="text-sm md:text-base text-ink-soft leading-relaxed mb-4">
              横向看朝代,纵向看时间。同一朝代内按事件先后铺开,一眼看清一个时代的全部关键决策。
            </p>
            <div className="flex items-center justify-center gap-3 text-xs text-ink-mute">
              <Link href="/archive" className="hover:text-cinnabar transition-colors">
                列表视图 →
              </Link>
              <span>·</span>
              <Link href="/figures/graph" className="hover:text-cinnabar transition-colors">
                人物关系图谱 →
              </Link>
            </div>
          </div>
        </header>

        {/* 时间线主体 */}
        <TimelineView columns={columns} />

        {/* 底部说明 */}
        <section className="mt-12 grid sm:grid-cols-3 gap-4 text-sm">
          <div className="p-4 bg-paper-card border border-border rounded-sm">
            <h3 className="font-semibold text-ink mb-2">怎么看</h3>
            <ul className="space-y-1 text-xs text-ink-soft">
              <li>· 桌面:横向滚动浏览朝代</li>
              <li>· 移动:竖向按朝代分组滚动</li>
              <li>· 点文章卡片进入阅读</li>
            </ul>
          </div>
          <div className="p-4 bg-paper-card border border-border rounded-sm">
            <h3 className="font-semibold text-ink mb-2">配色规则</h3>
            <ul className="space-y-1 text-xs text-ink-soft">
              <li>· 列顶色条 = 朝代主色</li>
              <li>· 卡片左边框 = 文章朝代色</li>
              <li>· 同朝代卡片同左边框色</li>
            </ul>
          </div>
          <div className="p-4 bg-paper-card border border-border rounded-sm">
            <h3 className="font-semibold text-ink mb-2">其他视图</h3>
            <ul className="space-y-1 text-xs text-ink-soft">
              <li>· <Link href="/archive" className="hover:text-cinnabar">列表视图</Link> — 按朝代分组</li>
              <li>· <Link href="/figures/graph" className="hover:text-cinnabar">人物图谱</Link> — 关系网络</li>
              <li>· <Link href="/" className="hover:text-cinnabar">首页</Link> — 推荐 + 朝代入口</li>
            </ul>
          </div>
        </section>
      </div>
    </>
  );
}
