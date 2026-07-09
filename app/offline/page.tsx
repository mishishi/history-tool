import Link from 'next/link';
import RetryButton from './RetryButton';

export const metadata = {
  title: '离线模式 · 读通鉴',
  robots: { index: false, follow: false },
};

const FALLBACK_TIPS = [
  {
    title: '检查 Wi-Fi 或数据',
    desc: '如果你在地铁、电梯、隧道 — 周围信号本来就弱,先挪一下。',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071a10 10 0 0114.142 0M1.394 9.393a15 15 0 0121.213 0" />
      </svg>
    ),
  },
  {
    title: '最近读过的文章可以看',
    desc: '我们把你上次打开过的页面缓存到本地,断网了仍能读。',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: '试着重连',
    desc: '回到网络后,点下面按钮就自动刷新到最新。',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
];

export default function OfflinePage() {
  return (
    <section className="max-w-narrow mx-auto px-6 py-16 md:py-24">
      {/* 顶部细金线 + 期刊编号 — 跟 404 / 500 / subscribed 风格一致 */}
      <div className="hero-rule mb-5"></div>
      <div className="hero-episode mb-6 text-center">DU TONGJIAN · 离 线</div>

      <div className="text-center mb-12">
        {/* 朱红印章作"未读" 标记,反过来用 */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-cinnabar/10 text-cinnabar rounded-sm mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636a9 9 0 010 12.728M5.636 18.364a9 9 0 010-12.728M12 9v4m0 4h.01" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3l18 18" />
          </svg>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-ink mb-3">
          暂无网络连接
        </h1>
        <p className="text-ink-soft text-lg">
          司马光写资治通鉴那会儿,估计也没 Wi-Fi。
        </p>
      </div>

      {/* 底部细金线 — 闭合装饰 */}
      <div className="hero-rule mb-12"></div>

      {/* 操作 */}
      <div className="flex flex-wrap justify-center gap-3 mb-16">
        <RetryButton />
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-paper border border-border text-ink hover:bg-paper-deep rounded-md transition-colors font-medium"
        >
          回首页
        </Link>
      </div>

      {/* 离线小贴士 */}
      <div className="border-t border-border pt-12">
        <h2 className="text-sm font-semibold text-ink-mute uppercase tracking-widest mb-6 text-center">
          断网时你可以做的
        </h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {FALLBACK_TIPS.map((tip) => (
            <div
              key={tip.title}
              className="p-5 bg-paper border border-border rounded-sm"
            >
              <div className="w-9 h-9 flex items-center justify-center bg-cinnabar/10 text-cinnabar rounded-sm mb-3">
                {tip.icon}
              </div>
              <h3 className="font-semibold text-ink mb-2">{tip.title}</h3>
              <p className="text-sm text-ink-soft leading-relaxed">{tip.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
