import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import {
  getAllArticles,
  getArticleBySlug,
  getClassicBySlug,
  extractToc,
} from '@/lib/articles';
import ArticleCard from '@/components/ArticleCard';
import ArticleHero from '@/components/ArticleHero';
import ArticleToc from '@/components/ArticleToc';
import ArticleCompleteToast from '@/components/ArticleCompleteToast';
import RevealOnScroll from '@/components/RevealOnScroll';
import ShareButtons from '@/components/ShareButtons';
import Seal from '@/components/Seal';
import JsonLd from '@/components/JsonLd';

// 静态生成所有路由
export async function generateStaticParams() {
  const articles = getAllArticles();
  return articles.map((a) => ({ slug: a.slug }));
}

// 元数据 — 全套增强:OG + Twitter Card + 文章专属
const SITE_URL = 'https://history-tool.vercel.app';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const article = getArticleBySlug(params.slug);
  if (!article) return {};
  const url = `${SITE_URL}/article/${article.slug}`;
  return {
    title: `${article.title} — 读通鉴`,
    description: article.excerpt,
    keywords: article.tags?.length ? article.tags : [article.dynasty, '资治通鉴', '历史解读'],
    authors: [{ name: '读通鉴 · 主编 Jason', url: SITE_URL }],
    creator: '读通鉴 · 主编 Jason',
    publisher: '读通鉴',
    alternates: { canonical: url },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: 'article',
      locale: 'zh_CN',
      url,
      siteName: '读通鉴',
      publishedTime: article.publishedAt,
      authors: ['读通鉴 · 主编 Jason'],
      tags: article.tags,
      images: [
        {
          url: `${SITE_URL}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
      images: [`${SITE_URL}/opengraph-image`],
      creator: '@du_tongjian',
    },
    other: {
      'article:section': '历史解读',
      'article:published_time': article.publishedAt,
      'article:author': '读通鉴 · 主编 Jason',
    },
  };
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const article = getArticleBySlug(params.slug);
  if (!article) notFound();

  // 关联的原文
  const classic = getClassicBySlug(article.classicalSlug);

  // 提取 ToC + 改写 h3 自动加 id
  const { toc, content: articleContent } = extractToc(article.content);

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

  // Schema.org Article JSON-LD(让搜索引擎理解文章结构)
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    image: [`${SITE_URL}/opengraph-image`],
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
    inLanguage: 'zh-CN',
    articleSection: '历史解读',
    keywords: (article.tags?.length ? article.tags : [article.dynasty, '资治通鉴']).join(','),
    wordCount: article.content.length,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/article/${article.slug}`,
    },
    author: {
      '@type': 'Person',
      name: '读通鉴 · 主编 Jason',
      url: `${SITE_URL}/about`,
    },
    publisher: {
      '@type': 'Organization',
      name: '读通鉴',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/icons/icon-512.png`,
        width: 512,
        height: 512,
      },
    },
  };

  // Breadcrumb JSON-LD
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '首页', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: '最新解读', item: `${SITE_URL}/#articles` },
      { '@type': 'ListItem', position: 3, name: article.title, item: `${SITE_URL}/article/${article.slug}` },
    ],
  };

  return (
    <>
      {/* JSON-LD 结构化数据(SEO) */}
      <JsonLd data={articleJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      {/* 滚动驱动:hero 视差 + h3 fade-in */}
      <RevealOnScroll />

      {/* 右侧 ToC(xl+ 显示) */}
      <ArticleToc items={toc} />

      {/* 阅读完成反馈 Toast — 滚到 90% 触发 */}
      <ArticleCompleteToast
        slug={article.slug}
        title={article.title}
        nextSlug={nextArticle?.slug}
        nextTitle={nextArticle?.title}
      />

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

      {/* 文章 Hero — 滚动视差 */}
      <article className="max-w-reading mx-auto px-6 pt-10 pb-12">
        <ArticleHero article={article} />

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
                  资治通鉴 · {classic.volume || article.volume} · {classic.period}
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
                        <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-cinnabar text-paper rounded-sm classical text-sm font-bold text-center leading-none">
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
            {articleContent}
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

        {/* 分享按钮 */}
        <div className="mt-10 no-print">
          <ShareButtons article={article} />
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
              这只是开篇。<br />
              剩下的故事,<br />
              我们一起读完
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
                  aria-label={`上一篇 · ${prevArticle.dynasty} · 第 ${prevArticle.episode} 期 · ${prevArticle.title}`}
                  className="group prev-next-card prev-next-card-left relative block p-6 md:p-8 rounded-sm"
                >
                  <div className="flex items-center gap-2 text-xs text-ink-mute mb-3 tracking-widest uppercase">
                    <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 18l-6-6 6-6" />
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
                  aria-label={`下一篇 · ${nextArticle.dynasty} · 第 ${nextArticle.episode} 期 · ${nextArticle.title}`}
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