/**
 * 站点配置 — 单点管理,改一处全部生效
 *
 * SITE_URL: 生产域名,被 sitemap / robots / RSS / 邮件确认链接 / OG image / canonical 等引用。
 * 改域名/多环境部署,只改这里(也可用 NEXT_PUBLIC_SITE_URL 环境变量覆盖)。
 *
 * MARKETING_STATS: 营销数字,Header / Footer / Unlock 页 / UnlockStats / SubscribersBadge 等地方共用。
 * figuresCount: 人物长卷数(项目目前不存 stats,可手动维护)。
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://history-tool.vercel.app';

export const MARKETING_STATS = {
  subscribers: 2800,
  ratings: 4.9,
  figuresCount: 23,
} as const;

/** 客服邮箱(也用于邮件 from 默认值) */
export const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'hello@du-tongjian.com';

/**
 * 静态资源 CDN base URL(音频 / 封面)。
 * 默认走 Vercel 静态资源(/audios/{slug}.mp3),
 * 走 TCB/对象存储时,设 NEXT_PUBLIC_AUDIO_BASE_URL = "https://xxx.tcb.qcloud.la/audio"
 * ——
 * AUDIO_BASE_URL 已包含 /audio 子路径(避免每个 src 都拼两段)
 */
export const AUDIO_BASE_URL =
  process.env.NEXT_PUBLIC_AUDIO_BASE_URL || '';
/** 构造 audio src:`${AUDIO_BASE_URL}/${slug}.mp3`(默认空 → Vercel 静态) */
export function audioUrl(slug: string): string {
  return AUDIO_BASE_URL ? `${AUDIO_BASE_URL}/${slug}.mp3` : `/audios/${slug}.mp3`;
}

/** Resend / SMTP 发件人(可被 SUBSCRIBE_FROM_EMAIL 环境变量覆盖) */
export const MAIL_FROM = process.env.SUBSCRIBE_FROM_EMAIL || '读通鉴 <hello@du-tongjian.com>';