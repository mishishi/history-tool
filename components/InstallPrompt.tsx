'use client';

import { useEffect, useState } from 'react';

// beforeinstallprompt 事件的 TS 类型(Chrome/Edge 用)
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

// 检测 iOS Safari(WebKit 上才能"添加到主屏幕")
function isIos() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
}

// 检测当前是不是已经在 standalone 模式(已安装)
function isStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS 旧写法
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigator as any).standalone === true
  );
}

// 关闭记录:7 天内不再出现
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const DISMISS_KEY = 'dt-pwa-dismissed-at';

function isDismissedRecently() {
  if (typeof window === 'undefined') return true;
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const t = Number(raw);
    if (!Number.isFinite(t)) return false;
    return Date.now() - t < DISMISS_TTL_MS;
  } catch {
    return true;
  }
}

function markDismissed() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosVisible, setIosVisible] = useState(false);
  const [chromeVisible, setChromeVisible] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // 已安装 → 退出
    if (isStandalone()) return;
    // 用户最近关过 → 退出
    if (isDismissedRecently()) return;

    // iOS 路径
    if (isIos()) {
      setIosVisible(true);
      return;
    }

    // Chrome / Edge / Android 路径
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setChromeVisible(true);
    };
    const onAppInstalled = () => {
      setInstalled(true);
      setChromeVisible(false);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const dismiss = () => {
    markDismissed();
    setChromeVisible(false);
    setIosVisible(false);
  };

  const onChromeInstall = async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === 'accepted') {
        setChromeVisible(false);
      } else {
        markDismissed();
        setChromeVisible(false);
      }
    } catch {
      markDismissed();
      setChromeVisible(false);
    }
  };

  if (installed) return null;
  if (!chromeVisible && !iosVisible) return null;

  return (
    <div
      role="dialog"
      aria-label="安装读通鉴到桌面"
      className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4 animate-[slideUp_0.3s_ease-out]"
      style={{ animation: 'slideUp 0.3s ease-out' }}
    >
      <div className="mx-auto max-w-md bg-paper border border-border rounded-lg shadow-2xl overflow-hidden">
        <div className="p-4 sm:p-5 flex items-start gap-3">
          <div className="w-11 h-11 shrink-0 rounded-sm overflow-hidden flex items-center justify-center bg-cinnabar text-paper">
            <span className="classical text-lg font-bold">鉴</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-ink text-sm sm:text-base mb-1">
              安装读通鉴到桌面
            </h3>
            <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
              {chromeVisible && '像 App 一样打开,离线也能读,推送新文章不漏。'}
              {iosVisible && '像 App 一样打开,离线也能读,新文章不漏。'}
            </p>
          </div>
          <button
            onClick={dismiss}
            aria-label="关闭"
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded text-ink-mute hover:bg-paper-dark hover:text-ink transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Chrome/Edge:原生的 install 流程 */}
        {chromeVisible && (
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 flex gap-2">
            <button
              onClick={onChromeInstall}
              className="flex-1 px-4 py-2 bg-cinnabar hover:bg-cinnabar-dark text-paper text-sm rounded-md transition-colors font-medium"
            >
              安装
            </button>
            <button
              onClick={dismiss}
              className="px-4 py-2 text-ink-soft hover:bg-paper-dark text-sm rounded-md transition-colors"
            >
              稍后
            </button>
          </div>
        )}

        {/* iOS:三步图文 */}
        {iosVisible && (
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-border pt-4 space-y-3">
            <ol className="space-y-2.5 text-xs sm:text-sm text-ink-soft">
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 w-5 h-5 flex items-center justify-center bg-cinnabar/10 text-cinnabar rounded-full text-[10px] font-bold">
                  1
                </span>
                <span className="flex-1 pt-0.5">
                  点底部的 <span className="inline-flex items-center px-1.5 py-0.5 bg-paper-dark rounded text-[11px]">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0-12l-4 4m4-4l4 4" />
                    </svg>
                  </span> 分享按钮
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 w-5 h-5 flex items-center justify-center bg-cinnabar/10 text-cinnabar rounded-full text-[10px] font-bold">
                  2
                </span>
                <span className="flex-1 pt-0.5">在弹出菜单里选 <strong className="text-ink">「添加到主屏幕」</strong></span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 w-5 h-5 flex items-center justify-center bg-cinnabar/10 text-cinnabar rounded-full text-[10px] font-bold">
                  3
                </span>
                <span className="flex-1 pt-0.5">
                  点右上 <strong className="text-ink">「添加」</strong>,桌面就有读通鉴图标了
                </span>
              </li>
            </ol>
            <button
              onClick={dismiss}
              className="w-full px-4 py-2 text-ink-soft hover:bg-paper-dark text-sm rounded-md transition-colors"
            >
              我知道了
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
