import Link from 'next/link';
import type { CSSProperties } from 'react';
import { getAllArticles, getTrendingArticles } from '@/lib/articles';
import { getDynastiesWithCount } from '@/lib/dynasties.server';
import ArticleCard from '@/components/ArticleCard';
import Seal from '@/components/Seal';
import JsonLd from '@/components/JsonLd';
import SubscribersBadge from '@/components/SubscribersBadge';
import DiscoveryGrid from '@/components/DiscoveryGrid';
import { SITE_URL } from '@/lib/site-config';

export default function HomePage() {
  const articles = getAllArticles();
  // "今日推荐" — 按 day-of-year 取模轮换(50 篇覆盖 50 天)
  // 同一个 build 周期所有用户看到同一篇(SSR 稳定 + CDN cache 友好)
  // 比"永远是最新的"更"推荐"——给 49 篇非最新文章也曝光
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000
  );
  // 用 slug 排序后取模(避免 sort 顺序不稳定导致每天 featured 不一致)
  const sortedBySlug = [...articles].sort((a, b) => a.slug.localeCompare(b.slug));
  const featured = sortedBySlug[dayOfYear % sortedBySlug.length];
  const latestArticles = articles.filter((a) => a.slug !== featured.slug); // 其余做列表
  // Top 3 — trending 算法(取代假 views 排序):
  //   - 0.30 recency (近 30 天线性衰减)
  //   - 0.40 classic (ep 越小分越高,通鉴开篇经典前置)
  //   - 0.15 density (tag 数量)
  //   - 0.15 brevity (8 分钟短文优先,读完率高)
  // 见 lib/articles.ts:getTrendingArticles
  const topArticles = getTrendingArticles(3, [featured.slug]);
  // mini 朝代入口:聚焦前 6 个古典朝代(战国→隋唐),明清/现代/宋/元 留给 /archive
  // count 用 getDynastiesWithCount() 实时算(取代手填,加新文章自动同步)
  const featuredDynasties = getDynastiesWithCount().slice(0, 6);
  // 完整朝代时间线 — 9 个全显示(count 都实时算)
  const allDynasties = getDynastiesWithCount();

  // Schema.org JSON-LD
  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: '读通鉴',
    alternateName: 'Du Tongjian',
    url: SITE_URL,
    description: '我们用 AI 把司马光写给皇帝的这部书,翻译成当代人能读懂、能用上的东西。资治通鉴不只是历史,它是 1362 年里所有关键决策的复盘。',
    inLanguage: 'zh-CN',
    publisher: {
      '@type': 'Organization',
      name: '读通鉴',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/icons/icon-512.png`, width: 512, height: 512 },
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/?search={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      {/* SEO 结构化数据 */}
      <JsonLd data={websiteJsonLd} />
      {/* Hero 区 */}
      <section id="hero" className="max-w-wide mx-auto px-6 pt-12 md:pt-20 pb-12">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div className="fade-in-up">
            <div className="flex items-center gap-3 mb-6">
              <Seal>本周精读</Seal>
              <span className="text-xs text-ink-mute">
                {featured
                  ? `${new Date(featured.publishedAt).getFullYear()} 年 ${
                      new Date(featured.publishedAt).getMonth() + 1
                    } 月 · 第 ${featured.episode} 期`
                  : '第 1 期'}
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-ink leading-[1.2] mb-6">
              {featured?.title || '读通鉴 · 让历史变得有用'}
            </h1>
            <p className="text-base md:text-lg text-ink-soft leading-relaxed mb-8">
              {featured?.subtitle || '把资治通鉴讲成你听得懂、用得上的故事'}
            </p>
            {featured && (
              <div className="flex items-center gap-5">
                <Link
                  href={`/article/${featured.slug}`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-cinnabar hover:bg-cinnabar-dark text-paper rounded-md transition-all hover:shadow-lg font-medium"
                >
                  <span>开始阅读</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <div className="flex items-center gap-2 text-xs text-ink-mute">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{featured.readingTime} 分钟阅读</span>
                  <span className="w-1 h-1 rounded-full bg-ink-mute"></span>
                  <span>{featured.views >= 1000 ? `${(featured.views / 1000).toFixed(1)}k` : featured.views} 人已读</span>
                </div>
              </div>
            )}
          </div>

          <div className="fade-in-up delay-200">
            <div className="relative bg-paper-card border border-border rounded-sm p-8 md:p-12 shadow-md">
              <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-cinnabar"></div>
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-cinnabar"></div>

              <div className="text-center mb-6">
                <span className="text-[10px] text-ink-mute tracking-[0.3em] uppercase">
                  资治通鉴 · 开篇
                </span>
              </div>

              <blockquote className="classical text-base md:text-lg text-ink leading-loose text-center">
                「天子之职莫大于礼,<br />
                礼莫大于分,<br />
                分莫大于名。<br /><br />
                何谓礼?纪纲是也。<br />
                何谓分?君臣是也。<br />
                何谓名?公侯卿大夫是也。」
              </blockquote>

              <div className="mt-6 pt-6 border-t border-border-soft text-center text-xs text-ink-soft classical">
                —— 司马光 · 卷一开篇
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 发现三栏 — 今日推荐 / 朝代入口 / 最热 3 篇 */}
      <DiscoveryGrid
        latest={articles[0]}
        topArticles={topArticles}
        featuredDynasties={featuredDynasties}
      />

      {/* 最新解读 */}
      <section id="articles" className="max-w-wide mx-auto px-6 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-ink mb-2">最新解读</h2>
            <p className="text-sm text-ink-mute">每一段古文,都是当时人的困境与选择</p>
          </div>
        </div>

        {latestArticles.length === 0 ? (
          <div className="text-center py-16 text-ink-mute">
            <p>暂无更多文章</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestArticles.map((article, i) => (
              <ArticleCard key={article.slug} article={article} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* 按朝代浏览 — 横向时间轴(点击跳到 /archive 完整目录) */}
      <section id="dynasties" className="max-w-wide mx-auto px-6 py-12 md:py-16">
        <div className="text-center mb-10 md:mb-14">
          <div className="flex items-center justify-center gap-3 mb-2">
            <h2 className="text-2xl md:text-3xl font-bold text-ink">按朝代浏览</h2>
            <Link
              href="/timeline"
              className="inline-flex items-center gap-1 px-3 py-1 bg-cinnabar-soft text-cinnabar-dark hover:bg-cinnabar hover:text-paper rounded-sm text-xs font-medium transition-colors"
            >
              时间线视图 →
            </Link>
          </div>
          <p className="text-sm text-ink-mute">1362 年的历史,从战国走到五代</p>
        </div>

        {/* 时间轴主体 */}
        <div className="relative">
          {/* 横向轴线 */}
          <div className="timeline-rail"></div>

          {/* 节点(横向滚动适配窄屏)
              用原生 <a> 不用 <Link>:跨页面 hash 链接需要完整页面加载,
              浏览器原生处理 hash 锚点跳转 — 比 Next.js 客户端 SPA + scroll-to-top
              后再手动滚更可靠 */}
          <div className="flex items-start justify-between gap-6 md:gap-4 -mt-[6px] overflow-x-auto pb-4 px-2 md:px-4 snap-x snap-mandatory scrollbar-thin">
            {allDynasties.map((d, i) => (
              <a
                key={d.slug}
                href={`/archive#group-${d.slug}`}
                className="timeline-node snap-center stagger-card"
                style={{ ['--stagger-delay' as string]: `${i * 80}ms` } as CSSProperties}
                // 不写 aria-label:让屏幕阅读器读可视文本(朝代名 + 时期 + 计数)
                // 之前的 aria-label 跟 dynasties.ts 旧 count 不一致,且会替换 visible text
              >
                {/* 朝代名 */}
                <div className="timeline-name">{d.name}</div>
                {/* dot 节点 */}
                <div className="timeline-dot"></div>
                {/* 时期 */}
                <div className="timeline-period">{d.period}</div>
                {/* 计数徽标 */}
                <div className="timeline-count">{d.count} 篇</div>
              </a>
            ))}
            {/* 末尾追加「近现代」节点 — 跳到 archive 完整目录 */}
            <a
              href="/archive#group-modern"
              className="timeline-node snap-center stagger-card"
              style={{ ['--stagger-delay' as string]: `${allDynasties.length * 80}ms` } as CSSProperties}
            >
              <div className="timeline-name">近现代</div>
              <div className="timeline-dot"></div>
              <div className="timeline-period">960 - 2013</div>
              <div className="timeline-count">通鉴之后</div>
            </a>
          </div>
        </div>

        {/* 移动端左右提示 */}
        <div className="md:hidden mt-4 text-center text-[10px] text-ink-mute tracking-widest uppercase">
          ← 横向滑动查看更多 →
        </div>

        {/* 查看完整目录 — 桌面端显示,移动端由横向时间轴自带滚动 */}
        <div className="mt-8 text-center">
          <Link
            href="/archive"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-paper-card border border-border hover:border-cinnabar hover:text-cinnabar rounded-sm text-sm text-ink-soft transition-all hover:shadow-md"
          >
            <span>查看完整通鉴目录</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* 订阅引导条 */}
      <section className="max-w-wide mx-auto px-6 py-12">
        <div className="relative bg-gradient-to-br from-paper-deep via-paper-card to-paper-deep border border-border rounded-sm p-10 md:p-16 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 opacity-10 dark:opacity-15">
            <div className="classical text-[200px] text-cinnabar leading-none">通</div>
          </div>

          <div className="relative max-w-2xl">
            <Seal className="mb-4">会员订阅</Seal>
            <h2 className="text-2xl md:text-4xl font-bold text-ink mb-4 leading-tight">
              陪我们一起,读完这 1362 年
            </h2>
            <p className="text-base text-ink-soft leading-relaxed mb-8">
              订阅后,你能解锁全部解读、每周精读音频、以及我们整理的事件脉络图。
              我们承诺:用 AI 把司马光写给皇帝的这部书,翻译成你能用得上的东西。
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/unlock"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-cinnabar hover:bg-cinnabar-dark text-paper rounded-md transition-all hover:shadow-xl font-medium"
              >
                <span>查看订阅方案</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <div className="flex items-center gap-4 text-xs text-ink-mute">
                <SubscribersBadge />
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-gold" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>7 天无理由退款</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}