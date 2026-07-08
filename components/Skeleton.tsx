/**
 * 骨架屏基础组件
 * 用 CSS 渐变 + animate-pulse 实现,避免引入额外依赖
 */

interface SkeletonProps {
  className?: string;
  /** 圆角 */
  rounded?: 'sm' | 'md' | 'full';
}

const roundedMap = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  full: 'rounded-full',
};

/**
 * 单个骨架块 — 浅色背景 + 缓慢 pulse
 */
export function Skeleton({ className = '', rounded = 'sm' }: SkeletonProps) {
  return (
    <div
      className={`skeleton-block ${roundedMap[rounded]} ${className}`}
      aria-hidden="true"
    />
  );
}

/**
 * 文章卡骨架 — 模拟 ArticleCard 视觉结构
 */
export function ArticleCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`block bg-paper-card border border-border rounded-sm overflow-hidden ${compact ? '' : ''}`}
      aria-hidden="true"
    >
      <Skeleton className="h-1" />
      <div className={`p-6 ${compact ? 'p-5' : ''}`}>
        {/* 标签行 */}
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
        {/* 标题 */}
        <Skeleton className={`mb-2 ${compact ? 'h-4' : 'h-5'}`} />
        <Skeleton className={`mb-4 ${compact ? 'h-4 w-4/5' : 'h-5 w-4/5'}`} />
        {/* 摘要 */}
        {!compact && (
          <>
            <Skeleton className="h-3 mb-2" />
            <Skeleton className="h-3 w-3/4 mb-4" />
          </>
        )}
        {/* 古文引子 */}
        <Skeleton className="h-3 w-2/3 mb-4" />
        {/* meta */}
        <div className="mt-5 pt-4 border-t border-border-soft flex items-center justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    </div>
  );
}

/**
 * 标题骨架 — 大字号文字占位
 */
export function TitleSkeleton({ lines = 2 }: { lines?: number }) {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-8 md:h-10 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

/**
 * 段落骨架 — 模拟正文段落
 */
export function ParagraphSkeleton({ lines = 6 }: { lines?: number }) {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${
            i === lines - 1 ? 'w-5/6' : i === lines - 2 ? 'w-11/12' : 'w-full'
          }`}
        />
      ))}
    </div>
  );
}