import Link from 'next/link';
import { getAllArticles, DYNASTIES } from '@/lib/articles';
import ArticleCard from '@/components/ArticleCard';
import Seal from '@/components/Seal';

export default function HomePage() {
  const articles = getAllArticles();
  const featured = articles[0]; // 最新一篇做 Hero
  const latestArticles = articles.slice(1); // 其余做列表

  return (
    <>
      {/* Hero 区 */}
      <section id="hero" className="max-w-wide mx-auto px-6 pt-12 md:pt-20 pb-12">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div className="fade-in-up">
            <div className="flex items-center gap-3 mb-6">
              <Seal>本周精读</Seal>
              <span className="text-xs text-ink-mute">
                2026 年 7 月 · 第 {featured?.episode ?? 1} 期
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

      {/* 栏目入口 */}
      <section className="max-w-wide mx-auto px-6 py-8">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { tag: '史', title: '每周精读', desc: '每周一篇深度解读,从一段古文读懂一段历史', bg: 'bg-cinnabar-soft text-cinnabar' },
            { tag: '事', title: '事件脉络', desc: '同一事件的多源对照,还原历史现场', bg: 'bg-gold-soft text-gold-dark' },
            { tag: '人', title: '人物长卷', desc: '帝王将相的关键决策,映射当代管理者的人性洞察', bg: 'bg-paper-deep text-gold-dark border border-gold/30' },
          ].map((col) => (
            <Link
              key={col.title}
              href="/#articles"
              className="group p-6 bg-paper-card border border-border hover:border-cinnabar rounded-sm transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 flex items-center justify-center ${col.bg} rounded-sm classical text-lg font-bold`}>
                  {col.tag}
                </div>
                <svg
                  className="w-4 h-4 text-ink-mute group-hover:text-cinnabar group-hover:translate-x-1 transition-all"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-ink mb-2">{col.title}</h3>
              <p className="text-xs text-ink-soft leading-relaxed">{col.desc}</p>
            </Link>
          ))}
        </div>
      </section>

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
            {latestArticles.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        )}
      </section>

      {/* 按朝代浏览 */}
      <section id="dynasties" className="max-w-wide mx-auto px-6 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-ink mb-2">按朝代浏览</h2>
            <p className="text-sm text-ink-mute">1362 年的历史,从战国走到五代</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {DYNASTIES.map((d) => (
            <Link
              key={d.slug}
              href={`/?dynasty=${d.slug}`}
              className="group relative p-4 bg-paper-card border border-border hover:border-cinnabar rounded-sm text-center transition-all hover:shadow-md hover:-translate-y-1"
            >
              <div className="classical text-2xl text-cinnabar font-bold mb-1">{d.name}</div>
              <div className="text-[10px] text-ink-mute">{d.period}</div>
              <div className="mt-2 text-[10px] text-ink-mute group-hover:text-cinnabar">{d.count} 篇</div>
            </Link>
          ))}
        </div>
      </section>

      {/* 订阅引导条 */}
      <section className="max-w-wide mx-auto px-6 py-12">
        <div className="relative bg-gradient-to-br from-paper-deep via-paper-card to-paper-deep border border-border rounded-sm p-10 md:p-16 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 opacity-5">
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
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-gold" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span>2,800+ 订阅用户</span>
                </div>
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