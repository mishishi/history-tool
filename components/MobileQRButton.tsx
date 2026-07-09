'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

/**
 * 全站右下角浮动按钮 + Modal
 * - 桌面端用户在任何页面都能一键唤起 QR,扫码到当前页
 * - 与 ScrollToTop 在右下角垂直堆叠:QR 上方(始终可见),ScrollToTop 下方(滚动 >400px 出现)
 */
export default function MobileQRButton() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [qrSvg, setQrSvg] = useState('');
  const [copied, setCopied] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // 取当前 URL + 检测 dark 模式(用于 QR 配色)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setUrl(window.location.href);
    setIsDark(document.documentElement.classList.contains('dark'));

    // 监听 dark 模式切换(QR 配色跟随)
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // 生成 QR code
  useEffect(() => {
    if (!open || !url) return;
    let cancelled = false;
    QRCode.toString(url, {
      type: 'svg',
      margin: 1,
      width: 240,
      errorCorrectionLevel: 'M',
      color: {
        // dark: 朱红前景 + 暖白底; light: 深墨前景 + 米色底
        dark: isDark ? '#D65A5A' : '#1A1A1A',
        light: isDark ? '#1F1B17' : '#FBF8F2',
      },
    })
      .then((svg) => {
        if (!cancelled) setQrSvg(svg);
      })
      .catch(() => {
        if (!cancelled) setQrSvg('');
      });
    return () => {
      cancelled = true;
    };
  }, [open, url, isDark]);

  // Esc 关闭
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  // 打开时锁定 body 滚动
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [open]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // 静默失败,用户可手动复制
    }
  };

  return (
    <>
      {/* 浮动按钮 — 右下角 FAB,在 ScrollToTop 上方(fab-2 spacing token) */}
      <div
        className="floating-qr-wrap group fixed right-4 md:right-6 z-40 bottom-fab-2"
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="在手机上继续阅读"
          className="floating-qr-btn relative w-12 h-12 md:w-14 md:h-14 rounded-full bg-cinnabar hover:bg-cinnabar-dark text-paper shadow-lg hover:shadow-xl flex items-center justify-center transition-all hover:-translate-y-0.5"
          style={{
            transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s ease, box-shadow 0.2s ease',
          }}
        >
          {/* 手机+QR 图标 */}
          <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>

          {/* hover 时显示 tooltip */}
          <span className="absolute right-full mr-3 px-3 py-1.5 bg-ink text-paper text-xs whitespace-nowrap rounded-sm opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-md">
            手机继续读
          </span>

          {/* 脉冲呼吸点(吸引注意) */}
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-gold border-2 border-paper animate-pulse-soft"></span>
        </button>
      </div>

      {/* Modal */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          {/* 居中用 flex,不用 -translate-X/Y — 避免 fade-in-up 关键帧覆盖 transform 把模态推到角落 */}
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
            <div
              className="fade-in-up pointer-events-auto w-full max-w-md max-h-[90vh] overflow-y-auto bg-paper-card border border-border rounded-sm shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-label="在手机上继续阅读"
            >
            {/* 头部 */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-soft">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-cinnabar" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-sm font-semibold text-ink">在手机上继续阅读</span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="关闭"
                className="p-1 text-ink-mute hover:text-ink transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* QR + 提示 */}
            <div className="px-6 py-6 md:py-8">
              <div className="flex flex-col items-center">
                {/* QR 容器 — 固定底色,无论主题 */}
                <div className="p-3 rounded-sm bg-paper shadow-md border border-border-soft">
                  {qrSvg ? (
                    <div
                      className="w-[200px] h-[200px] md:w-[240px] md:h-[240px] qr-svg-wrap"
                      dangerouslySetInnerHTML={{ __html: qrSvg }}
                    />
                  ) : (
                    <div className="w-[200px] h-[200px] md:w-[240px] md:h-[240px] flex items-center justify-center text-xs text-ink-mute">
                      生成中…
                    </div>
                  )}
                </div>

                {/* 提示 */}
                <div className="mt-5 text-center">
                  <p className="text-sm text-ink leading-relaxed">
                    打开手机相机或微信,<br />对准上方二维码即可继续阅读
                  </p>
                  <p className="mt-2 text-xs text-ink-mute">
                    阅读进度、收藏、文章列表都会同步到手机
                  </p>
                </div>
              </div>

              {/* URL + 复制 */}
              <div className="mt-6 flex items-stretch gap-2">
                <div className="flex-1 px-3 py-2 bg-paper-deep border border-border rounded-sm text-xs text-ink-soft truncate font-mono">
                  {url}
                </div>
                <button
                  type="button"
                  onClick={onCopy}
                  className={`shrink-0 px-4 py-2 rounded-md text-xs font-medium transition-all ${
                    copied
                      ? 'bg-cinnabar text-paper'
                      : 'bg-paper-card border border-border text-ink hover:border-cinnabar hover:text-cinnabar'
                  }`}
                >
                  {copied ? '已复制' : '复制'}
                </button>
              </div>
            </div>

            {/* 底部 */}
            <div className="px-5 py-2.5 border-t border-border-soft text-[10px] text-ink-mute text-center tracking-widest uppercase">
              ← 按 ESC 关闭 →
            </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}