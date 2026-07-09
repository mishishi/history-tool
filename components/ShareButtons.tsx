'use client';

import { useEffect, useState } from 'react';
import type { ArticleMeta } from '@/lib/types';

interface Props {
  article: ArticleMeta;
}

/**
 * 文章分享按钮组
 * - 复制链接(所有平台)
 * - Web Share API(移动端原生分享面板)
 * - 微博分享(桌面)
 * - Twitter / X(桌面)
 * - 「已复制」toast 反馈
 */
export default function ShareButtons({ article }: Props) {
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [shareSupported, setShareSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUrl(window.location.href);
      setShareSupported(typeof navigator !== 'undefined' && !!navigator.share);
    }
  }, []);

  const onCopy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // 兜底:用 prompt 让用户手动复制
      window.prompt('复制以下链接分享:', url);
    }
  };

  const onWebShare = async () => {
    if (!shareSupported || !url) return;
    try {
      await navigator.share({
        title: article.title,
        text: article.subtitle || article.excerpt || article.title,
        url,
      });
    } catch {
      // 用户取消分享
    }
  };

  const weiboUrl = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(article.title)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(article.title)}`;

  return (
    <>
      <div className="border-t border-border pt-10">
        <div className="flex flex-wrap items-center gap-3">
          {/* 分享标题 */}
          <div className="flex items-center gap-2 text-xs text-ink-mute tracking-[0.3em] uppercase mr-2">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span>分享这一篇</span>
          </div>

          {/* 复制链接(所有平台) */}
          <button
            type="button"
            onClick={onCopy}
            className="share-btn"
            aria-label="复制链接"
            title="复制链接"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            <span>复制链接</span>
          </button>

          {/* Web Share API(仅移动端) */}
          {shareSupported && (
            <button
              type="button"
              onClick={onWebShare}
              className="share-btn md:hidden"
              aria-label="更多分享"
              title="更多分享"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
              <span>更多分享</span>
            </button>
          )}

          {/* 微博(桌面) */}
          <a
            href={weiboUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="share-btn hidden md:inline-flex"
            aria-label="分享到微博"
            title="分享到微博"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9.31 8.17c-3.45.32-6.04 2.34-5.78 4.51.26 2.17 3.27 3.66 6.72 3.34 3.45-.32 6.04-2.34 5.78-4.51-.26-2.17-3.27-3.66-6.72-3.34zm-.97 5.74c-1.69.16-3.16-.6-3.27-1.7-.11-1.1 1.18-2.12 2.87-2.28 1.69-.16 3.16.6 3.27 1.7.11 1.1-1.18 2.12-2.87 2.28zm-.94-1.7c-.5.4-1.36.41-1.92.02-.56-.39-.6-1.04-.1-1.44.5-.4 1.36-.41 1.92-.02.56.39.6 1.04.1 1.44zm.69-.92c-.18.15-.5.16-.71.02-.21-.14-.22-.39-.04-.54.18-.15.5-.16.71-.02.21.14.22.39.04.54zM20.04 11.5c-.32-.13-.55-.21-.38-.59.37-.84.41-1.57.01-2.09-.74-.97-2.77-.92-5.08.01 0 0-.73.32-.55-.26.36-1.16.31-2.13-.26-2.7-1.27-1.27-4.65.05-7.55 2.96-2.18 2.18-3.43 4.59-3.43 6.46 0 3.62 4.65 5.81 8.66 5.81 5.62 0 9.36-3.27 9.36-5.88 0-1.58-1.32-2.36-2.78-2.72zm-5.81 6.4c-2.07.19-3.86-.65-4-1.87-.14-1.22 1.44-2.36 3.51-2.55 2.07-.19 3.86.65 4 1.87.14 1.22-1.44 2.36-3.51 2.55z" />
            </svg>
            <span>微博</span>
          </a>

          {/* Twitter / X(桌面) */}
          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="share-btn hidden md:inline-flex"
            aria-label="分享到 X (Twitter)"
            title="分享到 X"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span>X</span>
          </a>

          {/* 微信(桌面 + 移动)— 二维码小弹窗 */}
          <WeChatShare url={url} title={article.title} />

          {/* 打印 */}
          <button
            type="button"
            onClick={() => window.print()}
            className="share-btn"
            aria-label="打印文章"
            title="打印 / 导出 PDF"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            <span>打印</span>
          </button>
        </div>
      </div>

      {/* 复制成功 toast */}
      {copied && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[80] px-4 py-2.5 bg-ink text-paper text-sm rounded-sm shadow-xl fade-in-up flex items-center gap-2">
          <svg className="w-4 h-4 text-cinnabar" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <span>链接已复制 · 去发给朋友吧</span>
        </div>
      )}
    </>
  );
}

/**
 * 微信分享 — 弹小窗显示二维码
 */
function WeChatShare({ url, title }: { url: string; title: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="share-btn"
        aria-label="分享到微信"
        title="分享到微信(扫二维码)"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8.5 8.5a1 1 0 100-2 1 1 0 000 2zm5 0a1 1 0 100-2 1 1 0 000 2zM8.69 13.84c-.7-.59-1.55-.84-2.43-.84-1.16 0-2.31.4-3.18 1.15-.7.61-.99 1.39-.99 2.18 0 .79.39 1.55 1.05 2.05.69.51 1.62.78 2.59.78.55 0 1.11-.1 1.65-.3l1.49.79-.41-1.42c.99-.65 1.65-1.62 1.65-2.74 0-.65-.27-1.31-.92-1.65zm5.31-6.34C10.6 7.5 8.07 9.7 8.07 12.32c0 .95.31 1.85.88 2.62 1.55 2.13 4.84 2.45 6.96.85.13-.1.34-.07.43.06.43.6.95 1.05 1.55 1.34l-.51-1.84c-.05-.18.02-.37.18-.46 1.39-.83 2.31-2.21 2.31-3.84 0-2.62-2.6-4.55-5.87-4.55zm-1.92 4.99a1 1 0 110-2 1 1 0 010 2zm3.84 0a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
        <span>微信</span>
      </button>

      {open && (
        <>
          {/* 遮罩 */}
          <div
            className="fixed inset-0 z-[60]"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          {/* 弹出 */}
          <div
            className="absolute right-0 top-full mt-2 w-[260px] z-[70] bg-paper-card border border-border rounded-sm shadow-2xl p-4 fade-in-up"
            role="dialog"
            aria-label="微信扫码分享"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-ink-mute tracking-[0.3em] uppercase">微信扫一扫</span>
            </div>
            {url ? (
              <WeChatQR url={url} />
            ) : (
              <div className="aspect-square w-full bg-paper-deep animate-pulse" />
            )}
            <p className="mt-3 text-[11px] text-ink-mute leading-relaxed">
              打开微信扫一扫,把链接发给朋友 / 文件传输助手 / 朋友圈
            </p>
            <p className="mt-1 text-[11px] text-ink-soft truncate" title={title}>
              《{title}》
            </p>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * 微信小弹窗里的 QR
 * — 复用 qrcode 包(已经装)
 */
function WeChatQR({ url }: { url: string }) {
  const [svg, setSvg] = useState('');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    let mounted = true;
    setIsDark(document.documentElement.classList.contains('dark'));
    import('qrcode').then(({ default: QRCode }) => {
      QRCode.toString(url, {
        type: 'svg',
        margin: 1,
        width: 220,
        errorCorrectionLevel: 'M',
        color: {
          dark: isDark ? '#D65A5A' : '#1A1A1A',
          light: isDark ? '#1F1B17' : '#FBF8F2',
        },
      })
        .then((s) => {
          if (mounted) setSvg(s);
        })
        .catch(() => {});
    });
    return () => {
      mounted = false;
    };
  }, [url, isDark]);

  return (
    <div className="aspect-square w-full p-2 bg-paper rounded-sm border border-border-soft">
      {svg ? (
        <div className="qr-svg-wrap w-full h-full" dangerouslySetInnerHTML={{ __html: svg }} />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-xs text-ink-mute">
          生成中…
        </div>
      )}
    </div>
  );
}