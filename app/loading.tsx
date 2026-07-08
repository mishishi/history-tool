import { Skeleton, ArticleCardSkeleton } from '@/components/Skeleton';

export default function Loading() {
  return (
    <>
      {/* Hero 区骨架 */}
      <section className="max-w-wide mx-auto px-6 pt-12 md:pt-20 pb-12">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-10 w-full mb-3" />
            <Skeleton className="h-10 w-3/4 mb-6" />
            <Skeleton className="h-5 w-full mb-2" />
            <Skeleton className="h-5 w-5/6 mb-8" />
            <div className="flex items-center gap-5">
              <Skeleton className="h-12 w-32" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <div>
            <div className="bg-paper-card border border-border rounded-sm p-8 md:p-12 shadow-md">
              <Skeleton className="h-3 w-24 mx-auto mb-6" />
              <div className="space-y-3 mb-6">
                <Skeleton className="h-5 w-3/4 mx-auto" />
                <Skeleton className="h-5 w-2/3 mx-auto" />
                <Skeleton className="h-5 w-1/2 mx-auto" />
                <Skeleton className="h-5 w-3/4 mx-auto" />
              </div>
              <Skeleton className="h-px mb-6" />
              <Skeleton className="h-3 w-40 mx-auto" />
            </div>
          </div>
        </div>
      </section>

      {/* 栏目入口骨架 */}
      <section className="max-w-wide mx-auto px-6 py-8">
        <div className="grid md:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="p-6 bg-paper-card border border-border rounded-sm">
              <div className="flex items-start justify-between mb-3">
                <Skeleton className="h-10 w-10" />
                <Skeleton className="h-4 w-4" />
              </div>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-3 w-full mb-1" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      </section>

      {/* 最新解读骨架 */}
      <section className="max-w-wide mx-auto px-6 py-12">
        <div className="mb-8">
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <ArticleCardSkeleton key={i} />
          ))}
        </div>
      </section>

      {/* 时间轴骨架 */}
      <section className="max-w-wide mx-auto px-6 py-12 md:py-16">
        <div className="text-center mb-10 md:mb-14">
          <Skeleton className="h-8 w-32 mx-auto mb-2" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
        <Skeleton className="h-px mb-6" />
        <div className="flex items-start justify-between gap-6 -mt-[6px] px-2 md:px-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 min-w-[92px]">
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}