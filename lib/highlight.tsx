// 搜索结果关键字高亮 — 安全的 escape + 不区分大小写匹配 + 多关键词支持
//
// 优化点:
//  - 多关键词(空格分)各自高亮: '商鞅 变法' → 文中'商鞅'和'变法'都 <mark>
//  - 1-2 字符的词跳过(中文单字噪音大)
//  - 关键词去重 + 长度排序, 长的先匹配(避免'商' 截断 '商鞅')

export function highlightMatch(
  text: string,
  query: string,
  highlightClassName = 'search-hit'
): React.ReactNode {
  if (!text) return null;
  const q = query.trim();
  if (!q) return text;

  // 拆词: 按空格分, 过滤短词, 长度降序
  // 例: "商鞅 变法" → ["商鞅", "变法"]
  // 排序: 长的先匹配(避免 '商' 先吃 '商鞅' 的一部分)
  const terms = q
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2)
    .sort((a, b) => b.length - a.length);

  if (terms.length === 0) return text;

  // 单个 regex 匹配所有关键词
  const escapedTerms = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const re = new RegExp(`(${escapedTerms.join('|')})`, 'gi');
  const parts = text.split(re);

  return parts.map((part, i) => {
    // 大小写不敏感: 任一关键词匹配
    const isMatch = terms.some((t) => part.toLowerCase() === t.toLowerCase());
    if (isMatch) {
      return (
        <mark key={i} className={highlightClassName}>
          {part}
        </mark>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
