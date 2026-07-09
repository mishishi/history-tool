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