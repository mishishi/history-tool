import Link from 'next/link';
import type { Metadata } from 'next';
import Seal from '@/components/Seal';
import JsonLd from '@/components/JsonLd';

const SITE_URL = 'https://history-tool.vercel.app';

export const metadata: Metadata = {
  title: '关于我们 — 读通鉴',
  description:
    '读通鉴是谁?我们如何用 AI 重读 1362 年的资治通鉴?AI 解读 + 人类编辑 + 公共领域原文,这是我们的工作流。',
  keywords: ['关于读通鉴', 'AI 解读工作流', '资治通鉴', 'AI 历史解读'],
};

export default function AboutPage() {
  // Schema.org Organization JSON-LD — 让 Google Knowledge Graph 关联
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: '读通鉴',
    alternateName: 'Du Tongjian',
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/icons/icon-512.png`,
      width: 512,
      height: 512,
    },
    description: '读通鉴是一个独立运营的内容项目,主编 Jason + AI 协作生产,用 AI 把司马光写给皇帝的这部书翻译成当代人能读懂、能用上的东西。',
    foundingDate: '2026',
    founder: {
      '@type': 'Person',
      name: 'Jason',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'hello@du-tongjian.com',
    },
    sameAs: [
      `${SITE_URL}/feed.xml`,
    ],
  };

  return (
    <>
      {/* SEO 结构化数据 */}
      <JsonLd data={orgJsonLd} />

      {/* Hero */}
      <section className="max-w-wide mx-auto px-6 pt-12 md:pt-20 pb-12">
        <div className="max-w-3xl">
          <Seal className="mb-4">关于读通鉴</Seal>
          <h1 className="text-3xl md:text-5xl font-bold text-ink leading-[1.2] mb-6">
            1362 年,<br />不该只是一部给皇帝看的书
          </h1>
          <p className="text-base md:text-lg text-ink-soft leading-relaxed">
            司马光写《资治通鉴》,原本是给帝王看的 ——
            "鉴于往事,有资于治道"。
            但 900 年过去,这本书真正能影响的人,应该是正在做决策的每一个人。
            我们想做的,就是把这部书从"皇帝的镜子"变成"现代人的镜子"。
          </p>
        </div>
      </section>

      {/* 我们是谁 */}
      <section id="who-we-are" className="max-w-wide mx-auto px-6 py-12 scroll-mt-20">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <span className="classical text-3xl text-cinnabar font-bold">1</span>
            <h2 className="text-2xl md:text-3xl font-bold text-ink">我们是谁</h2>
          </div>

          <div className="space-y-4 text-base text-ink-soft leading-relaxed">
            <p>
              <strong className="text-ink">读通鉴</strong> 是一个独立运营的内容项目,
              主编 Jason + AI 协作生产。
            </p>
            <p>
              我们专注一件事:把《资治通鉴》294 卷、1362 年的历史,
              翻译成现代人能读懂、能用上的东西 —— 一周一篇文章,一段古文 + 一段现代解读 + 一段当代映射。
            </p>
            <p>
              我们不写段子,不蹭热点,不灌水。
              我们的目标读者是 30-50 岁、正在做决策的职场人和创业者,
              你可能不需要知道"玄武门之变是哪一年",
              但你可能想知道 ——
              <em>李世民在那个关键夜晚做的决定,跟你现在面对的"上还是不上"有没有共通之处。</em>
            </p>

            <div className="mt-8 grid md:grid-cols-3 gap-4">
              {[
                { num: '50', unit: '篇', desc: '已发布深度解读' },
                { num: '1362', unit: '年', desc: '从战国到当代的时间跨度' },
                { num: '1', unit: '人 + AI', desc: '主编 + 模型的协作生产' },
              ].map((stat) => (
                <div
                  key={stat.desc}
                  className="p-6 bg-paper-card border border-border rounded-sm"
                >
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="classical text-3xl font-bold text-cinnabar">
                      {stat.num}
                    </span>
                    <span className="text-sm text-ink-soft">{stat.unit}</span>
                  </div>
                  <p className="text-xs text-ink-mute">{stat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 如何解读 */}
      <section id="how-we-read" className="max-w-wide mx-auto px-6 py-12 scroll-mt-20">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <span className="classical text-3xl text-cinnabar font-bold">2</span>
            <h2 className="text-2xl md:text-3xl font-bold text-ink">如何解读</h2>
          </div>

          <div className="space-y-6 text-base text-ink-soft leading-relaxed">
            <p>
              我们的每一篇文章,都遵循一个固定的工作流:
            </p>

            <div className="space-y-4">
              {[
                {
                  step: '01',
                  title: '原文(资治通鉴)',
                  desc: '严格采用中华书局或类似权威校勘本的公共领域原文,标注卷次、年份。古文逐字保留,不简化、不缩写。',
                },
                {
                  step: '02',
                  title: '背景(史实还原)',
                  desc: 'AI 根据原文生成历史背景、关键人物、当时局势,然后主编对照正史、学术论文做事实核查,确保不出硬伤。',
                },
                {
                  step: '03',
                  title: '解读(当代映射)',
                  desc: 'AI 提取原文中"决策逻辑"(谁、为什么、怎么做的、后果是什么),然后映射到当代管理/职场/创业场景。',
                },
                {
                  step: '04',
                  title: '编辑(人类把关)',
                  desc: '主编逐篇校对,删除 AI 的废话和"正确的废话",补充一手的细节和判断,确保每篇都有"信息增量",不是"AI 翻译机"。',
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="flex gap-4 p-5 bg-paper-card border border-border rounded-sm"
                >
                  <div className="shrink-0 classical text-xl text-cinnabar font-bold pt-1">
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-ink mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-ink-soft leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 bg-paper-deep border border-border-soft rounded-sm">
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  <svg
                    className="w-5 h-5 text-cinnabar"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-ink mb-1">
                    我们不做什么
                  </h4>
                  <p className="text-sm text-ink-soft leading-relaxed">
                    不预测未来,不算命,不写阴谋论。
                    不做"如果 XXX 当时怎么怎么,历史会怎样"这种廉价假设。
                    每一篇只回答一个问题:这一段古文里,做决策的人,真正在乎的是什么?
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PWA 使用指南 */}
      <section id="pwa-guide" className="max-w-wide mx-auto px-6 py-12 scroll-mt-20">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <span className="classical text-3xl text-cinnabar font-bold">3</span>
            <h2 className="text-2xl md:text-3xl font-bold text-ink">装到桌面,像 App 一样用</h2>
          </div>

          <div className="space-y-6 text-base text-ink-soft leading-relaxed">
            <p>
              读通鉴是一个 PWA(渐进式网络应用) ——
              浏览器会给你一个「添加到主屏幕」的提示,装完之后:
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  title: '离线也能读',
                  desc: '你打开过的页面、最近读的文章、断网也能接着看。',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728M5.636 18.364a9 9 0 010-12.728M12 9v4m0 4h.01" />
                    </svg>
                  ),
                },
                {
                  title: '收藏 + 阅读进度',
                  desc: '喜欢的文章点❤ 收藏,读到哪里自动记住,下次接着看。',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  ),
                },
                {
                  title: '不占内存',
                  desc: '不是真 App,只在浏览器里跑,占 1MB 还是 100MB 都一样轻。',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  ),
                },
                {
                  title: '每次新文章自动更新',
                  desc: '不用去应用商店更新,刷新就是最新版。',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  ),
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="p-5 bg-paper-card border border-border rounded-sm"
                >
                  <div className="w-9 h-9 flex items-center justify-center bg-cinnabar/10 text-cinnabar rounded-sm mb-3">
                    {item.icon}
                  </div>
                  <h3 className="font-semibold text-ink mb-1.5">{item.title}</h3>
                  <p className="text-sm text-ink-soft leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid md:grid-cols-2 gap-4">
              {/* Android / Chrome */}
              <div className="p-5 bg-paper-deep border border-border-soft rounded-sm">
                <div className="text-[10px] text-gold-dark tracking-widest uppercase mb-2">Android · Chrome</div>
                <p className="text-sm text-ink-soft leading-relaxed">
                  浏览器地址栏右侧会出现「安装」图标,点一下就有桌面图标。或者等页面底部的提示条弹出。
                </p>
              </div>
              {/* iOS Safari */}
              <div className="p-5 bg-paper-deep border border-border-soft rounded-sm">
                <div className="text-[10px] text-gold-dark tracking-widest uppercase mb-2">iOS · Safari</div>
                <p className="text-sm text-ink-soft leading-relaxed">
                  点底部的「分享」⬆️ 按钮 → 选「添加到主屏幕」→ 点「添加」。桌面就有图标了。
                </p>
              </div>
            </div>

            <p className="text-xs text-ink-mute">
              数据(收藏 + 阅读进度)存在你本机,清浏览器缓存会丢。订阅后可同步到云端(规划中)。
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-wide mx-auto px-6 py-12">
        <div className="max-w-3xl bg-gradient-to-br from-paper-deep via-paper-card to-paper-deep border border-border rounded-sm p-8 md:p-12">
          <h2 className="text-xl md:text-2xl font-bold text-ink mb-3">
            开始读
          </h2>
          <p className="text-sm md:text-base text-ink-soft leading-relaxed mb-6">
            50 篇文章,每一篇都是一段真实的决策复盘。
            选一篇,开始读通鉴。
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-cinnabar hover:bg-cinnabar-dark text-paper rounded-md transition-colors font-medium text-sm"
            >
              <span>浏览全部解读</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
            <Link
              href="/unlock"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-paper border border-border hover:border-cinnabar text-ink rounded-md transition-colors font-medium text-sm"
            >
              <span>了解订阅</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
