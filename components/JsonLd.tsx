/**
 * Schema.org JSON-LD 通用组件
 * - 接受任意 schema 对象,序列化为 <script type="application/ld+json">
 * - 搜索引擎(Google / Bing / 微信搜一搜)会解析这些结构化数据
 * - 用于:
 *   - Article(文章页)
 *   - WebSite(首页 — 让搜索框出现 sitelinks searchbox)
 *   - Organization(About)
 *   - FAQPage(/unlock)
 *   - BreadcrumbList(导航层级)
 */
interface Props {
  data: Record<string, unknown> | Record<string, unknown>[];
}

export default function JsonLd({ data }: Props) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data),
      }}
    />
  );
}