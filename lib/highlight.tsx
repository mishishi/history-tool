// 搜索结果关键字高亮 — 安全的 escape + 不区分大小写匹配

export function highlightMatch(
  text: string,
  query: string,
  highlightClassName = 'search-hit'
): React.ReactNode {
  if (!text) return null;
  const q = query.trim();
  if (!q) return text;

  // 转义 regex 元字符
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(re);

  return parts.map((part, i) => {
    // 大小写不敏感比较
    if (part.toLowerCase() === q.toLowerCase()) {
      return (
        <mark key={i} className={highlightClassName}>
          {part}
        </mark>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
