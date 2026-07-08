import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { getAllArticles, getArticleBySlug, getClassicBySlug, formatDate } from '@/lib/articles';
import ArticleCard from '@/components/ArticleCard';
import FavoriteButton from '@/components/FavoriteButton';
import Seal from '@/components/Seal';

// 静态生成所有路由
export async function generateStaticParams() {
  const articles = getAllArticles();
  return articles.map((a) => ({ slug: a.slug }));
}

// 元数据
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const article = getArticleBySlug(params.slug);
  if (!article) return {};
  return {
    title: `${article.title} — 读通鉴`,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: 'article',
      locale: 'zh_CN',
      images: [
        {
          url: 'https://history-tool.vercel.app/opengraph-image',
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
  };
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const article = getArticleBySlug(params.slug);
  if (!article) notFound();

  // 关联的原文
  const classic = getClassicBySlug(article.classicalSlug);

  // 所有文章 + 上一篇/下一篇(按发布时间倒序,索引 i-1 更新 / i+1 更早)
  const allArticles = getAllArticles();
  const currentIndex = allArticles.findIndex((a) => a.slug === article.slug);
  const prevArticle = currentIndex > 0 ? allArticles[currentIndex - 1] : null;
  const nextArticle =
    currentIndex >= 0 && currentIndex < allArticles.length - 1 ? allArticles[currentIndex + 1] : null;

  // 相关推荐(同朝代的其他文章,排除当前)
  const relatedArticles = allArticles
    .filter((a) => a.slug !== article.slug && a.dynasty === article.dynasty)
    .slice(0, 3);

  return (
    <>
      {/* 面包屑 */}
      <div className="max-w-wide mx-auto px-6 pt-6">
        <nav className="flex items-center gap-2 text-xs text-ink-mute">
          <Link href="/" className="hover:text-cinnabar transition-colors">首页</Link>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link href="/#articles" className="hover:text-cinnabar transition-colors">最新解读</Link>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-ink-soft">{article.dynasty} · {article.volume}</span>
        </nav>
      </div>

      {/* 文章头 — 杂志感开篇 */}
      <article className="max-w-reading mx-auto px-6 pt-10 pb-12">
        {/* 顶部细金线 + 期刊编号 */}
        <div className="hero-rule mb-5"></div>
        <div className="text-center mb-10 fade-in-up">
          <div className="hero-episode mb-6">
            DU TONGJIAN · 第 {article.episode} 期
          </div>

          {/* 朝代徽标 + 卷次 */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <Seal variant="gold">{article.dynasty}</Seal>
            <span className="text-xs text-ink-mute tracking-wide">资治通鉴 · {article.volume}</span>
          </div>

          {/* 主标题 */}
          <h1 className="text-4xl md:text-[52px] font-bold text-ink leading-[1.18] mb-7 tracking-tight">
            {article.title}
          </h1>

          {/* 副标题 */}
          {article.subtitle && (
            <p className="text-base md:text-lg text-ink-soft leading-relaxed mb-7 max-w-2xl mx-auto">
              {article.subtitle}
            </p>
          )}

          {/* 古文引子 — 做衬底斜体 */}
          {article.classicalQuote && (
            <blockquote className="classical text-base md:text-lg text-gold-dark italic leading-relaxed mb-10 max-w-2xl mx-auto">
              「{article.classicalQuote}」
            </blockquote>
          )}

          {/* meta 行 */}
          <div className="flex items-center justify-center gap-5 text-xs text-ink-mute mb-5">
            <span>{formatDate(article.publishedAt)}</span>
            <span className="w-1 h-1 rounded-full bg-ink-mute"></span>
            <span>{article.readingTime} 分钟阅读</span>
            <span className="w-1 h-1 rounded-full bg-ink-mute"></span>
            <span>{article.views >= 1000 ? `${(article.views / 1000).toFixed(1)}k` : article.views} 人已读</span>
          </div>

          {/* 操作:收藏 */}
          <div className="flex justify-center">
            <FavoriteButton slug={article.slug} title={article.title} />
          </div>
        </div>

        {/* 底部细金线 */}
        <div className="hero-rule mt-2"></div>

        {/* 原文区(classic) */}
        {classic && (
          <section className="mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="w-12 h-px bg-gold"></div>
              <div className="mx-4 classical text-gold text-sm">原 · 文</div>
              <div className="w-12 h-px bg-gold"></div>
            </div>

            <div className="bg-paper-card border border-border rounded-sm p-6 md:p-8 shadow-sm">
              <div className="text-center mb-5">
                <span className="text-[10px] text-ink-mute tracking-[0.3em] uppercase">
                  资治通鉴 · {classic.volume} · {classic.period}
                </span>
              </div>

              {/* 原文 */}
              {classic.classicalText && (
                <blockquote className="classical text-base md:text-lg text-ink leading-loose text-center mb-6 py-2">
                  「{classic.classicalText.trim()}」
                </blockquote>
              )}

              {/* 历史背景 */}
              {classic.background && (
                <div className="mb-5 pt-5 border-t border-border-soft">
                  <div className="text-[11px] text-gold-dark classical tracking-widest uppercase mb-2 text-center">
                    历 史 背 景
                  </div>
                  <div className="text-sm text-ink-soft leading-relaxed text-center max-w-xl mx-auto whitespace-pre-line">
                    {classic.background.trim()}
                  </div>
                </div>
              )}

              {/* 关键人物 */}
              {classic.keyFigures && classic.keyFigures.length > 0 && (
                <div className="pt-5 border-t border-border-soft">
                  <div className="text-[11px] text-gold-dark classical tracking-widest uppercase mb-3 text-center">
                    关 键 人 物
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3 max-w-xl mx-auto">
                    {classic.keyFigures.map((fig, i) => (
                      <div key={i} className="flex items-start gap-3 px-3 py-2 bg-paper-deep rounded-sm">
                        <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-cinnabar text-paper rounded-sm classical text-sm font-bold">
                          {fig.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-ink">{fig.name}</div>
                          <div className="text-xs text-ink-soft leading-snug">{fig.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 分隔:原文 → 解读 */}
        <div className="flex items-center justify-center mb-10">
          <div className="w-16 h-px bg-cinnabar"></div>
          <div className="mx-4 classical text-cinnabar text-sm">解 · 读</div>
          <div className="w-16 h-px bg-cinnabar"></div>
        </div>

        {/* 解读正文 */}
        <div className="prose-article">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
          >
            {article.content}
          </ReactMarkdown>
        </div>

        {/* 作者/编辑 */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 flex items-center justify-center bg-paper-deep border border-border rounded-full classical text-cinnabar text-lg font-bold">
              鉴
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-ink mb-1">本期解读 · 主编 Jason</div>
              <div className="text-xs text-ink-mute leading-relaxed">
                原文出自《资治通鉴·{article.volume}》,由 AI 辅助生成初稿,人工编辑校对。
                如有史实疑问,欢迎在公众号留言讨论。
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* 订阅引导 */}
      <section className="max-w-reading mx-auto px-6 pb-16">
        <div className="relative bg-gradient-to-br from-paper-deep via-paper-card to-paper-deep border border-border rounded-sm p-8 md:p-10 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
            <div className="classical text-[100px] text-cinnabar leading-none">通</div>
          </div>
          <div className="relative">
            <Seal className="mb-3">继续阅读</Seal>
            <h3 className="text-xl md:text-2xl font-bold text-ink mb-3 leading-tight">
              这只是开篇。还有 1361 年等我们读
            </h3>
            <p className="text-sm text-ink-soft leading-relaxed mb-6">
              订阅后,你将解锁每周精读、全部解读稿、事件脉络图。
              我们承诺:陪我们一起,把这部 294 卷的书,读到你能用上。
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/unlock"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-cinnabar hover:bg-cinnabar-dark text-paper rounded-md transition-all hover:shadow-lg font-medium text-sm"
              >
                <span>查看订阅方案</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/#articles"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-paper-card border border-border hover:border-cinnabar text-ink rounded-md transition-all font-medium text-sm"
              >
                <span>浏览全部解读</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 相关推荐 */}
      {relatedArticles.length > 0 && (
        <section className="max-w-wide mx-auto px-6 pb-16">
          <div className="border-t border-border pt-12">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-ink mb-2">相关解读</h2>
                <p className="text-sm text-ink-mute">读懂一个时代,需要这些上下文</p>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedArticles.map((a) => (
                <ArticleCard key={a.slug} article={a} variant="compact" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 上一篇 / 下一篇 —— 大字导航,读完一篇顺到下一篇 */}
      {(prevArticle || nextArticle) && (
        <nav
          aria-label="文章导航"
          className="max-w-wide mx-auto px-6 pb-20"
        >
          <div className="border-t border-border pt-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-0 relative">
              {/* 中央竖线(仅桌面端) */}
              <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2"></div>

              {/* 上一篇(更晚发布) */}
              {prevArticle ? (
                <Link
                  href={`/article/${prevArticle.slug}`}
                  className="group prev-next-card prev-next-card-left relative block p-6 md:p-8 rounded-sm"
                >
                  <div className="flex items-center gap-2 text-xs text-ink-mute mb-3 tracking-widest uppercase">
                    <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>上一篇 · 第 {prevArticle.episode} 期</span>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-ink mb-2 group-hover:text-cinnabar transition-colors leading-snug">
                    {prevArticle.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-ink-mute">
                    <span className="seal-gold">{prevArticle.dynasty}</span>
                    <span>{prevArticle.volume}</span>
                    <span className="w-1 h-1 rounded-full bg-ink-mute"></span>
                    <span>{prevArticle.readingTime} 分钟</span>
                  </div>
                </Link>
              ) : (
                <div className="hidden md:block" aria-hidden="true"></div>
              )}

              {/* 下一篇(更早发布) */}
              {nextArticle ? (
                <Link
                  href={`/article/${nextArticle.slug}`}
                  className="group prev-next-card prev-next-card-right relative block p-6 md:p-8 rounded-sm md:text-right"
                >
                  <div className="flex items-center justify-end gap-2 text-xs text-ink-mute mb-3 tracking-widest uppercase">
                    <span>下一篇 · 第 {nextArticle.episode} 期</span>
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-ink mb-2 group-hover:text-cinnabar transition-colors leading-snug">
                    {nextArticle.title}
                  </h3>
                  <div className="flex items-center justify-end gap-2 text-xs text-ink-mute">
                    <span className="seal-gold">{nextArticle.dynasty}</span>
                    <span>{nextArticle.volume}</span>
                    <span className="w-1 h-1 rounded-full bg-ink-mute"></span>
                    <span>{nextArticle.readingTime} 分钟</span>
                  </div>
                </Link>
              ) : (
                <div className="hidden md:block" aria-hidden="true"></div>
              )}
            </div>
          </div>
        </nav>
      )}
    </>
  );
}