import Link from 'next/link';
import Seal from '@/components/Seal';
import SubscribeForm from '@/components/SubscribeForm';
import CheckoutButton from '@/components/CheckoutButton';
import JsonLd from '@/components/JsonLd';
import UnlockStats from '@/components/UnlockStats';
import { getAllArticles } from '@/lib/articles';
import { MARKETING_STATS, SITE_URL } from '@/lib/site-config';

const articleCount = getAllArticles().length;

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: '订阅内容和公众号免费内容有什么区别?',
    a: '公众号免费内容是引流入口,每周一篇摘要 + 关键观点。订阅内容是 3000-5000 字的完整深度解读,加上事件脉络、人物长卷等系列内容。简单说,公众号是"预告片",订阅是"完整版"。',
  },
  {
    q: '如果订阅后觉得不合适,可以退款吗?',
    a: '可以。订阅后 7 天内,如果你觉得内容不值这个价,直接联系客服,无理由全额退款。我们不希望任何一位订阅者带着遗憾离开。',
  },
  {
    q: '一年大概会更新多少篇内容?',
    a: '每周 1-2 篇精读 + 每月 2 篇人物长卷。一年下来大约 80-100 篇精读 + 24 篇人物长卷。我们的承诺:宁可少,不肯糙。每一篇都是主编亲自把关。',
  },
  {
    q: '内容是用 AI 生成的吗?会不会不准确?',
    a: '是的,初稿用 AI 生成,但每篇都经过主编 + 编辑两轮人工校对,重点段落会对照《资治通鉴》原文和《左传》《史记》等史料交叉验证。我们在每篇文末标注"原文出处",欢迎读者挑刺。',
  },
  {
    q: '订阅之后能在哪些设备上阅读?',
    a: '我们是 Web 端产品,任何能打开浏览器的设备都可以(桌面、平板、手机)。后续会推出微信小程序版,届时同一账号可以直接登录。',
  },
];

const FAQ_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  })),
};

export default function UnlockPage({
  searchParams,
}: {
  searchParams: { cancelled?: string };
}) {
  return (
    <>
      {/* SEO 结构化数据 — FAQ 折叠卡片(Google 搜索结果会显示 FAQ) */}
      <JsonLd data={FAQ_JSON_LD} />

      {/* 用户从 Stripe 取消付款后的轻提示 */}
      {searchParams.cancelled === '1' && (
        <section className="max-w-wide mx-auto px-6 pt-6">
          <div className="p-4 bg-paper-deep border border-border-soft rounded-sm flex items-start gap-3">
            <svg className="w-5 h-5 text-ink-soft flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="font-medium text-ink text-sm">支付已取消,没扣款</h4>
              <p className="text-xs text-ink-soft leading-relaxed mt-1">
                你刚才在 Stripe 点了取消,没事。下次想支持我们再来这一页,或者直接
                <Link href="/unlock#newsletter" className="text-cinnabar hover:text-cinnabar-dark underline mx-1">免费订邮件</Link>
                收每周新解读。
              </p>
            </div>
          </div>
        </section>
      )}
      {/* Hero 区 */}
      <section className="max-w-wide mx-auto px-6 pt-16 pb-12">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Seal>订阅</Seal>
              <span className="text-xs text-ink-mute">加入 {MARKETING_STATS.subscribers.toLocaleString()}+ 订阅用户</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-ink leading-[1.2] mb-6">
              陪我们一起,<br />
              读完这 <span className="text-cinnabar">1362 年</span>
            </h1>
            <p className="text-base md:text-lg text-ink-soft leading-relaxed mb-8">
              我们用 AI 把司马光写给皇帝的这部书,翻译成你能用得上的东西。
              不是百度百科式的史实复述,是把每一段古文背后的人性决策,讲给你听。
            </p>
            <div className="flex flex-wrap items-center gap-5">
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 px-6 py-3 bg-cinnabar hover:bg-cinnabar-dark text-paper rounded-md transition-all hover:shadow-lg font-medium"
              >
                <span>查看订阅方案</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </a>
              <Link
                href="/article/01-zhishi-wang"
                className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-cinnabar transition-colors"
              >
                <span>先看一篇试读</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>

          <div>
            <div className="relative bg-paper-card border border-border rounded-sm p-8 md:p-12 shadow-md">
              <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-cinnabar"></div>
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-cinnabar"></div>

              <div className="text-center mb-6">
                <span className="text-[10px] text-ink-mute tracking-[0.3em] uppercase">订阅者说</span>
              </div>

              <blockquote className="text-base md:text-lg text-ink leading-loose text-center">
                "以前看资治通鉴,看到第三页就睡着了。<br />
                订阅读通鉴之后,我每周追更,<br />
                已经用里面的逻辑给团队开过两次会了。"
              </blockquote>

              <div className="mt-6 pt-6 border-t border-border-soft flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cinnabar text-paper flex items-center justify-center classical text-sm font-bold">
                  陈
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-ink">陈先生</div>
                  <div className="text-xs text-ink-mute">某互联网公司 VP · 订阅 11 个月</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 免费邮件订阅 — 0 元入口 */}
      <section className="max-w-wide mx-auto px-6 py-12 md:py-16">
        <div className="relative bg-gradient-to-br from-paper-deep via-paper-card to-paper-deep border border-border rounded-sm overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 opacity-10 dark:opacity-15">
            <div className="classical text-[140px] text-cinnabar leading-none">信</div>
          </div>
          <div className="relative grid md:grid-cols-2 gap-8 md:gap-12 p-8 md:p-12">
            <div>
              <Seal className="mb-3">免费入口</Seal>
              <h2 className="text-2xl md:text-3xl font-bold text-ink mb-4 leading-tight">
                还没决定订阅?<br />
                <span className="text-cinnabar">先留个邮箱,</span>我们每周三送你一篇
              </h2>
              <p className="text-base text-ink-soft leading-relaxed mb-6">
                完全免费。一封信就是一篇文章。不想继续了,每封信底部点一下就走。
              </p>
              <ul className="space-y-2.5 text-sm text-ink-soft">
                <li className="flex items-start gap-2">
                  <span className="text-cinnabar mt-0.5">✓</span>
                  <span>不卖,不分享,只发订阅邮件</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cinnabar mt-0.5">✓</span>
                  <span>每周一封,频率固定,不灌水</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cinnabar mt-0.5">✓</span>
                  <span>想退就退,留 30 秒就能完成</span>
                </li>
              </ul>
            </div>
            <div className="md:bg-paper-card md:rounded-sm md:p-6 md:border md:border-border md:shadow-sm">
              <h3 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-cinnabar" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                填邮箱,确认后即可每周收到
              </h3>
              <SubscribeForm />
            </div>
          </div>
        </div>
      </section>

      {/* 为什么订阅 */}
      <section className="max-w-wide mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <Seal variant="gold" className="mb-3">核心利益</Seal>
          <h2 className="text-2xl md:text-3xl font-bold text-ink mb-3">订阅后,你能拿到什么</h2>
          <p className="text-sm text-ink-mute max-w-xl mx-auto">三件事,我们会持续做好</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-8 bg-paper-card border border-border rounded-sm">
            <div className="w-12 h-12 flex items-center justify-center bg-cinnabar-soft text-cinnabar rounded-sm classical text-xl font-bold mb-5">壹</div>
            <h3 className="text-lg font-semibold text-ink mb-3">每周深度精读</h3>
            <p className="text-sm text-ink-soft leading-relaxed mb-4">
              每周一篇 3000-5000 字深度解读,选一段最值得讲的历史,
              从原文、背景、人物、决策、现代映射五个维度拆给你看。
            </p>
            <div className="text-xs text-gold-dark classical">已更新 {articleCount} 期 · 持续连载中</div>
          </div>

          <div className="p-8 bg-paper-card border border-border rounded-sm">
            <div className="w-12 h-12 flex items-center justify-center bg-gold-soft text-gold-dark rounded-sm classical text-xl font-bold mb-5">贰</div>
            <h3 className="text-lg font-semibold text-ink mb-3">事件脉络图谱</h3>
            <p className="text-sm text-ink-soft leading-relaxed mb-4">
              重大事件的多源对照 + 时间轴图谱,
              一眼看懂"为什么是这里""关键转折是什么",
              不再被史书里的碎片叙事绕晕。
            </p>
            <div className="text-xs text-gold-dark classical">覆盖战国至五代 · 持续更新</div>
          </div>

          <div className="p-8 bg-paper-card border border-border rounded-sm">
            <div className="w-12 h-12 flex items-center justify-center bg-paper-deep text-cinnabar border border-cinnabar/30 rounded-sm classical text-xl font-bold mb-5">叁</div>
            <h3 className="text-lg font-semibold text-ink mb-3">人物决策长卷</h3>
            <p className="text-sm text-ink-soft leading-relaxed mb-4">
              帝王将相的关键决策逐个拆解,
              把"古代权谋"翻译成"今天能用的人性洞察",
              每周一个"历史人物 + 当代映射"。
            </p>
            <div className="text-xs text-gold-dark classical">已上线 23 位 · 持续更新</div>
          </div>
        </div>
      </section>

      {/* 价格方案 */}
      <section id="pricing" className="max-w-wide mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <Seal className="mb-3">订阅方案</Seal>
          <h2 className="text-2xl md:text-3xl font-bold text-ink mb-3">选一个适合你的</h2>
          <p className="text-sm text-ink-mute max-w-xl mx-auto">所有方案都包含全部已发布的解读稿 + 持续更新的新内容</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* 方案 1:单期试读 */}
          <div className="relative bg-paper-card border border-border rounded-sm p-8 transition-all hover:-translate-y-1 hover:shadow-xl">
            <div className="mb-6">
              <div className="text-sm font-semibold text-ink-soft mb-2">单期试读</div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-2xl text-ink-soft font-medium mr-1">¥</span>
                <span className="text-5xl font-bold text-ink leading-none font-sans tabular-nums">9.9</span>
              </div>
              <div className="text-xs text-ink-mute">/ 单篇解读</div>
            </div>
            <p className="text-sm text-ink-soft leading-relaxed mb-6 pb-6 border-b border-border-soft">
              先用一篇的成本,试试我们的解读风格。
              不满意,我们的所有免费内容也够你看一阵。
            </p>
            <ul className="space-y-3 mb-8 text-sm">
              <li className="flex items-start gap-2.5">
                <svg className="w-5 h-5 text-cinnabar flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-ink-soft">任选 1 篇深度解读</span>
              </li>
              <li className="flex items-start gap-2.5">
                <svg className="w-5 h-5 text-cinnabar flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-ink-soft">永久阅读该篇</span>
              </li>
              <li className="flex items-start gap-2.5">
                <svg className="w-5 h-5 text-ink-mute flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-ink-mute">不含新内容更新</span>
              </li>
            </ul>
            <CheckoutButton plan="single" label="真·付 ¥9.90 → Stripe" />
          </div>

          {/* 方案 2:年度会员(推荐) */}
          <div className="relative bg-gradient-to-b from-paper-card to-paper border-2 border-cinnabar rounded-sm p-8 shadow-lg">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cinnabar text-paper px-4 py-1 text-xs font-semibold classical tracking-widest rounded-sm">
              最受欢迎
            </div>
            <div className="mb-6">
              <div className="text-sm font-semibold text-cinnabar mb-2">年度会员</div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-2xl text-ink-soft font-medium mr-1">¥</span>
                <span className="text-5xl font-bold text-ink leading-none font-sans tabular-nums">99</span>
              </div>
              <div className="text-xs text-ink-mute">/ 年 · 相当于 8.25 元 / 月</div>
            </div>
            <p className="text-sm text-ink-soft leading-relaxed mb-6 pb-6 border-b border-border-soft">
              我们主推的方案。陪你走完一整年,看 80-100 篇解读,
              把资治通鉴的核心脉络读懂。
            </p>
            <ul className="space-y-3 mb-8 text-sm">
              <li className="flex items-start gap-2.5">
                <svg className="w-5 h-5 text-cinnabar flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-ink-soft"><strong>全部已发布解读</strong>({articleCount} 篇+)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <svg className="w-5 h-5 text-cinnabar flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-ink-soft">每周新解读(预计 80-100 篇/年)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <svg className="w-5 h-5 text-cinnabar flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-ink-soft">所有事件脉络图谱</span>
              </li>
              <li className="flex items-start gap-2.5">
                <svg className="w-5 h-5 text-cinnabar flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-ink-soft">人物决策长卷合集</span>
              </li>
              <li className="flex items-start gap-2.5">
                <svg className="w-5 h-5 text-cinnabar flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-ink-soft">会员专属社群(可选)</span>
              </li>
            </ul>
            <button
              disabled
              className="w-full py-3 bg-paper-deep text-ink-mute rounded-md transition-colors font-medium text-sm cursor-not-allowed"
              title="年付方案需要用户系统(Supabase Auth),等接入后开放"
            >
              即将开放 — 等用户系统
            </button>
            <div className="mt-3 text-center text-[11px] text-ink-mute">年付需要登录 · Stripe / 微信支付</div>
          </div>

          {/* 方案 3:三年会员 */}
          <div className="relative bg-paper-card border border-border rounded-sm p-8 transition-all hover:-translate-y-1 hover:shadow-xl">
            <div className="mb-6">
              <div className="text-sm font-semibold text-gold-dark mb-2 flex items-center gap-2">
                <span>三年会员</span>
                <Seal variant="gold" className="text-[10px] py-0 px-1.5">限时</Seal>
              </div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-2xl text-ink-soft font-medium mr-1">¥</span>
                <span className="text-5xl font-bold text-ink leading-none font-sans tabular-nums">199</span>
              </div>
              <div className="text-xs text-ink-mute">/ 3 年 · 相当于 5.5 元 / 月</div>
            </div>
            <p className="text-sm text-ink-soft leading-relaxed mb-6 pb-6 border-b border-border-soft">
              给"我要认真读完"的读者。
              三年时间够你把核心三百年(战国到唐末)的脉络追完。
            </p>
            <ul className="space-y-3 mb-8 text-sm">
              <li className="flex items-start gap-2.5">
                <svg className="w-5 h-5 text-cinnabar flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-ink-soft"><strong>年度会员全部权益</strong></span>
              </li>
              <li className="flex items-start gap-2.5">
                <svg className="w-5 h-5 text-cinnabar flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-ink-soft">三年时长(价值 297 元)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <svg className="w-5 h-5 text-cinnabar flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-ink-soft">提前加入会员社群</span>
              </li>
              <li className="flex items-start gap-2.5">
                <svg className="w-5 h-5 text-cinnabar flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-ink-soft">会员限定纸质书(每季度邮寄)</span>
              </li>
            </ul>
            <button
              disabled
              className="w-full py-3 border border-gold/50 text-gold-dark/60 rounded-md transition-colors font-medium text-sm cursor-not-allowed"
            >
              即将开放 — 等用户系统
            </button>
            <div className="mt-3 text-center text-[11px] text-ink-mute">年付需要登录 · Stripe / 微信支付</div>
          </div>
        </div>
      </section>

      {/* 信任标识 */}
      <section className="max-w-wide mx-auto px-6 py-12">
        <div className="bg-paper-card border border-border rounded-sm p-8 md:p-10">
          <UnlockStats />
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-ink mb-3">常见问题</h2>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <details
              key={i}
              className="group bg-paper-card border border-border rounded-sm"
              itemScope
              itemProp="mainEntity"
              itemType="https://schema.org/Question"
            >
              <summary className="flex items-center justify-between p-5 cursor-pointer font-medium text-ink hover:text-cinnabar transition-colors list-none">
                <span itemProp="name">{item.q}</span>
                <svg
                  className="w-5 h-5 text-ink-mute group-open:rotate-180 transition-transform shrink-0 ml-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div
                className="px-5 pb-5 text-sm text-ink-soft leading-relaxed"
                itemScope
                itemProp="acceptedAnswer"
                itemType="https://schema.org/Answer"
              >
                <div itemProp="text">{item.a}</div>
              </div>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}