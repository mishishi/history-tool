/**
 * 日期格式化工具(纯 JS,无 node:fs 依赖,server/client 都能用)
 */

/**
 * 格式化日期(YYYY 年 M 月 D 日)
 */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
}

/**
 * 格式化相对日期(今天 / 昨天 / N 天前 / N 周前 / YYYY 年 M 月 D 日)
 */
export function formatRelativeDate(iso: string): string {
  const now = new Date();
  const d = new Date(iso);
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '昨天';
  if (diffDays < 7) return `${diffDays} 天前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} 周前`;

  return formatDate(iso);
}