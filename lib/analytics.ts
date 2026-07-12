/**
 * Vercel Analytics 埋点统一入口
 *
 * 集中管理所有自定义事件,避免在每个组件里直接 import track —
 * 后续要换 PostHog / Plausible / 自建分析服务,只改这一个文件
 *
 * 用法:  import { track } from '@/lib/analytics'
 *        track('tts_play', { slug: '09-anshi' })
 *
 * 事件命名规范: 动词_名词,小写下划线
 *  - tts_play / tts_pause / tts_complete       (AudioPlayer)
 *  - favorite_add / favorite_remove            (FavoriteButton)
 *  - share_copy / share_weibo / share_twitter / share_native  (ShareButtons + Toast)
 *  - search_open / search_query / search_result_click         (SearchModal)
 *  - subscribe_open / subscribe_submit / subscribe_confirm    (SubscribeForm)
 *  - fab_click                                  (MobileMenu / MobileQR / ContinueReading)
 *  - ask_open / ask_submit / ask_response_done   (AskChat)
 *
 * Vercel Analytics dashboard 看:
 *   https://vercel.com/<team>/history-tool/analytics
 *   → "Events" tab → 事件名 + 触发次数 + properties
 */
import { track as vercelTrack } from '@vercel/analytics';

/** 统一埋点入口 — 静默失败,埋点不应影响主功能 */
export function track(
  name: string,
  properties?: Record<string, string | number | boolean | null | undefined>
): void {
  try {
    vercelTrack(name, properties ?? {});
  } catch {
    // 静默失败
  }
}
