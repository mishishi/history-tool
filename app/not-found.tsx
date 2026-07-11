import Link from 'next/link';
import { getTrendingArticles } from '@/lib/articles';
import Seal from '@/components/Seal';

export default function NotFound() {
  // 404 兜底推荐: 跟首页'最热 3 篇'用同一套 trending 算法
  //   - 同朝代 + tag 重叠, recency 30d, classic ep 越小分越高
  //   - 用户进 404 大概率是搜了一个不存在的 slug
  //     给 ta 3 篇'开篇经典'(ep 1-10)比最新文章更有用
  //     (如果搜的是'玄武门之变'找不到, 给'商鞅变法'/'围魏救赵'/'三家分晋'是连贯体验)
  // 跟首页 topArticles 保持一致, 减少认知割裂
  const recent = getTrendingArticles(3);

  return (
    <div className="max-w-reading mx-auto px-6 py-20 md:py-32">
      {/* 顶部细金线 */}
      <div className="hero-rule mb-10"></div>

      <div className="text-center fade-in-up">
        {/* 期刊编号 */}
        <div className="hero-episode mb-8">DU TONGJIAN · 寻卷</div>

        {/* 大字号 404 */}
        <div className="relative inline-block mb-8">
          <div className="text-[120px] md:text-[180px] font-bold text-cinnabar leading-none tracking-tight classical">
            404
          </div>
          <div className="absolute -top-3 -right-3 md:-top-4 md:-right-4">
            <Seal>未 寻</Seal>
          </div>
        </div>

        {/* 文人调侃 */}
        <h1 className="text-2xl md:text-3xl font-bold text-ink mb-4 leading-tight">
          这一卷,不在架上
        </h1>
        <p className="classical text-base md:text-lg text-ink-soft leading-relaxed mb-10 max-w-xl mx-auto">
          「书到用时方恨少,<br />
          事非经过不知难。」<br />
          <span className="text-sm text-ink-mute not-italic">—— 陆游 · 冬夜读书示子聿</span>
        </p>

        {/* 操作按钮组 */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-16">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-cinnabar hover:bg-cinnabar-dark text-paper rounded-md transition-all hover:shadow-lg font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>回到首页</span>
          </Link>
          <Link
            href="/#dynasties"
            className="inline-flex items-center gap-2 px-6 py-3 bg-paper-card border border-border hover:border-cinnabar text-ink rounded-md transition-all font-medium"
          >
            <span>按朝代查找</span>
          </Link>
        </div>

        {/* 底部细金线 */}
        <div className="hero-rule mb-10"></div>

        {/* 兜底推荐 — 也许你想读 */}
        {recent.length > 0 && (
          <div>
            <div className="text-xs text-ink-mute tracking-[0.3em] uppercase mb-6">
              或 许 你 想 读
            </div>
            <div className="grid sm:grid-cols-3 gap-4 text-left">
              {recent.map((a, i) => (
                <Link
                  key={a.slug}
                  href={`/article/${a.slug}`}
                  className="article-card stagger-card group block bg-paper-card border border-border hover:border-cinnabar rounded-sm p-5"
                  style={{ ['--stagger-delay' as string]: `${i * 80}ms` } as React.CSSProperties}
                >
                  <div className="card-accent h-1 bg-cinnabar mb-4"></div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="seal-gold">{a.dynasty}</span>
                    <span className="text-[10px] text-ink-mute">第 {a.episode} 期</span>
                  </div>
                  <h3 className="text-sm font-semibold text-ink leading-snug line-clamp-2 group-hover:text-cinnabar">
                    {a.title}
                  </h3>
                  <div className="mt-3 text-[10px] text-ink-mute">{a.readingTime} 分钟阅读</div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}