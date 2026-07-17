/**
 * 文章页 → 主题深读页 流量闭环
 *
 * 位置:文章正文(作者/分享)之后,订阅引导 CTA 之前
 * 内容:从文章 tags 里筛出"有独立深读页"的 tag(≥ MIN_TAG_COUNT),
 *       展示 top 3 主题 chip + "全部 →" 链 /topic 索引
 * 目的:刚读完一篇 → 用户想"看同主题其他文章" → 直接跳 /topic/[tag]
 *       不再"读完即走" 或"被推去订阅"
 *
 * 跟 archive hero 热门主题 chip 的区别:
 * - archive:全局热门(所有 tag 频次倒序)
 * - 这里:文章专属(只显示当前文章相关的)
 *
 * server component,无 client 逻辑
 */
import Link from 'next/link';
import { getAllTopicTags } from '@/lib/topics';

interface Props {
  /** 文章的 tags 字段(可能含 numeric — 用前要 String() 转型,见 archive page 经验) */
  tags: (string | number)[];
  /** 最多展示几个 chip,默认 3 */
  limit?: number;
}

export default function RelatedTopics({ tags, limit = 3 }: Props) {
  // 把 numeric tag 强制转 string(gray-matter 解析裸数字会保留 number 类型)
  const safeTags = (tags || []).map(String);

  // 取所有 ≥ MIN_TAG_COUNT 的 tag,做成 Set 用于 O(1) 查询
  const allTopics = getAllTopicTags();
  const validTags = new Set(allTopics.map((t) => t.tag));
  const counts = new Map(allTopics.map((t) => [t.tag, t.count] as const));

  // 顺序:文章 tags 出现顺序(已被 frontmatter 排过优先级),去重,只保留有效主题
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const t of safeTags) {
    if (validTags.has(t) && !seen.has(t)) {
      seen.add(t);
      ordered.push(t);
      if (ordered.length >= limit) break;
    }
  }

  // 没有任何"主题性"tag 时不渲染(虽然文章有 tag 但都是 1-2 次的零散标签)
  if (ordered.length === 0) return null;

  return (
    <div className="mt-10 pt-8 border-t border-border-soft">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-ink-mute text-xs mr-1">深入这个主题:</span>
        {ordered.map((tag) => (
          <Link
            key={tag}
            href={`/topic/${encodeURIComponent(tag)}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-paper-card border border-border hover:border-cinnabar hover:text-cinnabar rounded-sm transition-colors"
          >
            <span>{tag}</span>
            <span className="text-[10px] text-ink-mute tabular-nums">
              {counts.get(tag)}
            </span>
          </Link>
        ))}
        <Link
          href="/topic"
          className="text-xs text-ink-mute hover:text-cinnabar transition-colors ml-1"
        >
          全部主题 →
        </Link>
      </div>
    </div>
  );
}
