import Link from 'next/link';

export const metadata = {
  title: '订阅成功 · 读通鉴',
  description: '欢迎成为读通鉴的订阅者',
  robots: { index: false, follow: false },
};

export default function SubscribedPage({
  searchParams,
}: {
  searchParams: { email?: string };
}) {
  const email = searchParams.email;

  return (
    <section className="max-w-narrow mx-auto px-6 py-16 md:py-24 text-center">
      {/* 朱红印章 ✓ */}
      <div className="inline-flex w-20 h-20 items-center justify-center bg-cinnabar text-paper rounded-sm mb-6">
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-3xl md:text-4xl font-bold text-ink mb-3 leading-tight">
        收到 ✓ 你是读通鉴的人了
      </h1>
      <p className="text-ink-soft text-lg mb-2">接下来:</p>
      <p className="text-ink-soft mb-10">
        每周三上午 9 点,
        {email ? (
          <span className="text-ink"> <code className="px-2 py-1 bg-paper-deep rounded text-sm">{email}</code> </span>
        ) : (
          '你的邮箱'
        )}
        会出现一篇新解读。
      </p>

      {/* 三件小事告诉你这个订阅是怎么走的 */}
      <div className="border-t border-border pt-10 mb-10">
        <div className="grid sm:grid-cols-3 gap-6 text-left">
          {[
            {
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              ),
              title: '一封信,一个故事',
              desc: '古文原文 + 关键人物 + 当代映射,15 分钟读完。',
            },
            {
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              title: '不会塞广告',
              desc: '一封信就一篇文章,不会夹任何促销、合作、第三方链接。',
            },
            {
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              ),
              title: '随时取消',
              desc: '每封信底部都有「不再收到」,点一下就走,不留客。',
            },
          ].map((item) => (
            <div key={item.title} className="p-5 bg-paper-card border border-border rounded-sm">
              <div className="w-9 h-9 flex items-center justify-center bg-cinnabar/10 text-cinnabar rounded-sm mb-3">
                {item.icon}
              </div>
              <h3 className="font-semibold text-ink mb-1.5">{item.title}</h3>
              <p className="text-sm text-ink-soft leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-cinnabar hover:bg-cinnabar-dark text-paper rounded-md transition-colors font-medium"
        >
          开始读第一篇
        </Link>
        <Link
          href="/#articles"
          className="inline-flex items-center gap-2 px-6 py-3 bg-paper border border-border hover:border-cinnabar text-ink rounded-md transition-colors font-medium"
        >
          浏览全部解读
        </Link>
      </div>
    </section>
  );
}
