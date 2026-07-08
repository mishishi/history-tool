import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-border mt-12">
      <div className="max-w-wide mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* 品牌介绍 */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 flex items-center justify-center bg-cinnabar text-paper rounded-sm">
                <span className="classical text-base font-bold">鉴</span>
              </div>
              <div>
                <div className="text-base font-semibold text-ink">读通鉴</div>
                <div className="text-[10px] text-ink-mute tracking-widest uppercase">Du Tongjian</div>
              </div>
            </div>
            <p className="text-sm text-ink-soft leading-relaxed max-w-md">
              我们用 AI 把司马光写给皇帝的这部书,翻译成当代人能读懂、能用上的东西。
              资治通鉴不只是历史,它是 1362 年里所有关键决策的复盘。
            </p>
          </div>

          {/* 内容 */}
          <div>
            <h4 className="text-sm font-semibold text-ink mb-3">内容</h4>
            <ul className="space-y-2 text-xs text-ink-soft">
              <li>
                <Link href="/#articles" className="hover:text-cinnabar transition-colors">
                  最新解读
                </Link>
              </li>
              <li>
                <Link href="/#dynasties" className="hover:text-cinnabar transition-colors">
                  按朝代
                </Link>
              </li>
              <li>
                <Link href="/#hero" className="hover:text-cinnabar transition-colors">
                  本周精读
                </Link>
              </li>
              <li>
                <Link href="/unlock" className="hover:text-cinnabar transition-colors">
                  订阅会员
                </Link>
              </li>
            </ul>
          </div>

          {/* 关于 */}
          <div>
            <h4 className="text-sm font-semibold text-ink mb-3">关于</h4>
            <ul className="space-y-2 text-xs text-ink-soft">
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
          </div>
        </div>

        {/* 版权 */}
        <div className="pt-6 border-t border-border-soft flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-ink-mute">
          <div>© 2026 读通鉴 · 用 AI 重读 1362 年</div>
          <div className="flex items-center gap-4">
            <span>资治通鉴原文属公共领域</span>
            <span className="w-1 h-1 rounded-full bg-ink-mute"></span>
            <span>解读由 AI 生成 · 编辑校对</span>
          </div>
        </div>
      </div>
    </footer>
  );
}