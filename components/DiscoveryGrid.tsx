/**
 * DiscoveryGrid — 首页"发现"三栏
 *
 * Hero 下面的实用入口,帮用户从开场仪式感过渡到"随便翻翻":
 * - 左:今日推荐 — 最新发布的一篇(大图 cover + 标题 + 摘要)
 * - 中:朝代入口 — mini 横向时间轴,6 个核心朝代 + "全部 →"
 * - 右:最热 3 篇 — 按 views 降序 Top 3,数字徽标
 *
 * 替换原来的"史/事/人"栏目入口(都跳 /#articles 没意义)
 */
import Link from 'next/link';
import type { ArticleMeta } from '@/lib/types';
import type { Dynasty } from '@/lib/dynasties';
import { formatDate } from '@/lib/date';

interface Props {
  latest: ArticleMeta | undefined;
  topArticles: ArticleMeta[];
  featuredDynasties: Dynasty[];
}

export default function DiscoveryGrid({ latest, topArticles, featuredDynasties }: Props) {
  return (
    <section className="max-w-wide mx-auto px-6 py-8 md:py-10">
      <div className="grid md:grid-cols-3 gap-4 md:gap-5">
        {/* 左:今日推荐 */}
        {latest && <TodayPick article={latest} />}

        {/* 中:朝代入口 */}
        <DynastyPicker dynasties={featuredDynasties} />

        {/* 右:最热 3 篇 */}
        <TopThree articles={topArticles} />
      </div>
    </section>
  );
}

/* ===== 子组件 ===== */

function TodayPick({ article }: { article: ArticleMeta }) {
  return (
    <Link
      href={`/article/${article.slug}`}
      className="group block bg-paper-card border border-border hover:border-cinnabar rounded-sm overflow-hidden transition-all hover:shadow-md"
    >
      {/* cover 缩略 */}
      <div className="relative aspect-[16/9] overflow-hidden bg-paper-deep">
        <img
          src={`/covers/${article.slug}.webp`}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-2 left-2 px-2 py-0.5 bg-cinnabar text-paper text-[10px] tracking-widest rounded-sm">
          今日推荐
        </div>
      </div>

      <div className="p-4">
        <div className="text-[10px] text-ink-mute tracking-widest uppercase mb-2">
          {article.dynasty} · 第 {article.episode} 期
        </div>
        <h3 className="text-sm md:text-base font-semibold text-ink leading-snug mb-2 group-hover:text-cinnabar transition-colors line-clamp-2">
          {article.title}
        </h3>
        <p className="text-xs text-ink-soft leading-relaxed line-clamp-2 mb-3">
          {article.subtitle}
        </p>
        <div className="flex items-center gap-2 text-[10px] text-ink-mute">
          <span>{formatDate(article.publishedAt)}</span>
          <span className="w-1 h-1 rounded-full bg-ink-mute"></span>
          <span>{article.readingTime} 分钟</span>
        </div>
      </div>
    </Link>
  );
}

function DynastyPicker({ dynasties }: { dynasties: Dynasty[] }) {
  return (
    <div className="bg-paper-card border border-border rounded-sm p-4 flex flex-col">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-sm font-semibold text-ink">按朝代浏览</h3>
        <Link
          href="/archive"
          className="text-[10px] text-ink-mute hover:text-cinnabar transition-colors tracking-widest uppercase"
        >
          全部 →
        </Link>
      </div>

      {/* 6 朝代 mini 网格(2 列) */}
      <div className="grid grid-cols-2 gap-1.5 flex-1">
        {dynasties.map((d) => (
          <a
            key={d.slug}
            href={`/archive#group-${d.slug}`}
            className="group flex items-center gap-2 px-2 py-1.5 bg-paper-deep hover:bg-cinnabar-soft rounded-sm transition-colors"
            style={{ borderLeft: `2px solid ${d.primary}` }}
          >
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-ink group-hover:text-cinnabar transition-colors truncate">
                {d.name}
              </div>
              <div className="text-[10px] text-ink-mute tabular-nums">{d.count} 篇</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

function TopThree({ articles }: { articles: ArticleMeta[] }) {
  return (
    <div className="bg-paper-card border border-border rounded-sm p-4 flex flex-col">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-sm font-semibold text-ink">最热 3 篇</h3>
        <Link
          href="/archive"
          className="text-[10px] text-ink-mute hover:text-cinnabar transition-colors tracking-widest uppercase"
        >
          全部 →
        </Link>
      </div>

      {articles.length === 0 ? (
        <div className="text-xs text-ink-mute py-6 text-center">暂无阅读数据</div>
      ) : (
        <ol className="space-y-2 flex-1">
          {articles.slice(0, 3).map((article, i) => (
            <li key={article.slug}>
              <Link
                href={`/article/${article.slug}`}
                className="group flex items-start gap-3 p-2 -mx-2 rounded-sm hover:bg-paper-deep transition-colors"
              >
                {/* 排名数字 */}
                <div
                  className={`shrink-0 w-6 h-6 flex items-center justify-center text-sm font-bold tabular-nums rounded-sm ${
                    i === 0
                      ? 'bg-cinnabar text-paper'
                      : i === 1
                      ? 'bg-cinnabar-soft text-cinnabar-dark'
                      : 'bg-paper-deep text-ink-mute'
                  }`}
                >
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-medium text-ink leading-snug group-hover:text-cinnabar transition-colors line-clamp-2 mb-1">
                    {article.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] text-ink-mute">
                    <span className="tabular-nums">
                      {article.views >= 1000
                        ? `${(article.views / 1000).toFixed(1)}k`
                        : article.views}{' '}
                      人已读
                    </span>
                    <span className="w-1 h-1 rounded-full bg-ink-mute"></span>
                    <span>{article.dynasty}</span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
