import Link from 'next/link';
import Seal from './Seal';
import SubscribeForm from './SubscribeForm';

export default function Footer() {
  return (
    <footer className="border-t border-border mt-12 bg-paper-deep/30">
      {/* 上半 — 订阅 + 导航 + 关于 */}
      <div className="max-w-wide mx-auto px-6 py-12 md:py-16">
        <div className="grid md:grid-cols-12 gap-8 mb-10">
          {/* 品牌介绍 — 占 5 列 */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 flex items-center justify-center bg-cinnabar text-paper rounded-sm shadow-sm">
                <span className="classical text-lg font-bold">鉴</span>
              </div>
              <div>
                <div className="text-base font-semibold text-ink leading-tight">读通鉴</div>
                <div className="text-[10px] text-ink-mute tracking-widest uppercase leading-tight">Du Tongjian</div>
              </div>
            </div>
            <p className="text-sm text-ink-soft leading-relaxed max-w-md mb-5">
              我们用 AI 把司马光写给皇帝的这部书,翻译成当代人能读懂、能用上的东西。
              资治通鉴不只是历史,它是 1362 年里所有关键决策的复盘。
            </p>

            {/* 邮件订阅表单 */}
            <div className="max-w-md">
              <SubscribeForm compact />
            </div>
          </div>

          {/* 内容导航 — 占 3 列 */}
          <div className="md:col-span-3">
            <h4 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
              <span className="w-3 h-px bg-cinnabar"></span>
              <span>内容</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-ink-soft">
              <li>
                <Link href="/#articles" className="hover:text-cinnabar transition-colors">
                  最新解读
                </Link>
              </li>
              <li>
                <Link href="/#dynasties" className="hover:text-cinnabar transition-colors">
                  按朝代浏览
                </Link>
              </li>
              <li>
                <Link href="/#hero" className="hover:text-cinnabar transition-colors">
                  本周精读
                </Link>
              </li>
              <li>
                <Link href="/favorites" className="hover:text-cinnabar transition-colors">
                  我的收藏
                </Link>
              </li>
              <li>
                <Link href="/feed.xml" className="hover:text-cinnabar transition-colors inline-flex items-center gap-1.5">
                  <span>RSS 订阅</span>
                  <span className="text-[10px] text-ink-mute">(XML)</span>
                </Link>
              </li>
              <li>
                <Link href="/unlock" className="hover:text-cinnabar transition-colors">
                  付费订阅会员
                </Link>
              </li>
            </ul>
          </div>

          {/* 关于 + 友链 — 占 4 列 */}
          <div className="md:col-span-4">
            <h4 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
              <span className="w-3 h-px bg-cinnabar"></span>
              <span>关于</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-ink-soft mb-6">
              <li>
                <Link href="/about#who-we-are" className="hover:text-cinnabar transition-colors">
                  我们是谁
                </Link>
              </li>
              <li>
                <Link href="/about#how-we-read" className="hover:text-cinnabar transition-colors">
                  如何解读
                </Link>
              </li>
              <li>
                <a href="mailto:hello@du-tongjian.com" className="hover:text-cinnabar transition-colors">
                  联系我们
                </a>
              </li>
            </ul>

            <h4 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
              <span className="w-3 h-px bg-gold"></span>
              <span>友链</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-ink-soft">
              <li>
                <a
                  href="https://github.com/mishishi/history-tool"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cinnabar transition-colors inline-flex items-center gap-1.5"
                >
                  <span>本项目源码</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </li>
            </ul>
            <p className="text-[10px] text-ink-mute mt-3 italic">
              想交换友链?发邮件到 hello@du-tongjian.com
            </p>
          </div>
        </div>

        {/* 印章 + 版权 */}
        <div className="pt-6 border-t border-border-soft flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-ink-mute">
          <div className="flex items-center gap-3">
            <Seal className="shrink-0">读通鉴</Seal>
            <div className="flex flex-col">
              <span>© 2026 · 用 AI 重读 1362 年</span>
              <span className="text-[10px] mt-0.5">资治通鉴原文属公共领域 · 解读由 AI 生成 · 人工编辑校对</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[10px]">
            <span className="classical text-gold-dark text-base">通</span>
            <span className="text-ink-mute italic">「鉴于往事,有资于治道」</span>
          </div>
        </div>
      </div>
    </footer>
  );
}