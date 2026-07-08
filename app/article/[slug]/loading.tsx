import { Skeleton, TitleSkeleton, ParagraphSkeleton, ArticleCardSkeleton } from '@/components/Skeleton';

export default function Loading() {
  return (
    <>
      {/* 面包屑占位 */}
      <div className="max-w-wide mx-auto px-6 pt-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-3 w-3" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-3" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>

      {/* 文章 hero 骨架 */}
      <article className="max-w-reading mx-auto px-6 pt-10 pb-12">
        <Skeleton className="h-px mb-5" />
        <div className="text-center mb-10">
          {/* 期刊编号 */}
          <Skeleton className="h-3 w-40 mx-auto mb-6" />
          {/* 朝代徽标 + 卷次 */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <Skeleton className="h-6 w-12" />
            <Skeleton className="h-3 w-24" />
          </div>
          {/* 标题 */}
          <div className="mb-7">
            <TitleSkeleton lines={2} />
          </div>
          {/* 副标题 */}
          <Skeleton className="h-5 w-3/4 mx-auto mb-10" />
          {/* meta */}
          <div className="flex items-center justify-center gap-5 mb-5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-1 w-1" rounded="full" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-1 w-1" rounded="full" />
            <Skeleton className="h-3 w-12" />
          </div>
          {/* 收藏按钮 */}
          <Skeleton className="h-9 w-24 mx-auto" />
        </div>
        <Skeleton className="h-px mt-2" />

        {/* 原文区骨架 */}
        <section className="mb-12 mt-10">
          <div className="flex items-center justify-center mb-6">
            <Skeleton className="h-px w-12" />
            <Skeleton className="h-4 w-16 mx-4" />
            <Skeleton className="h-px w-12" />
          </div>
          <div className="bg-paper-card border border-border rounded-sm p-6 md:p-8 shadow-sm">
            <Skeleton className="h-3 w-40 mx-auto mb-5" />
            <div className="space-y-3 mb-6">
              <Skeleton className="h-5 w-11/12 mx-auto" />
              <Skeleton className="h-5 w-3/4 mx-auto" />
            </div>
            <Skeleton className="h-px mb-5" />
            <div className="space-y-2 mb-5">
              <Skeleton className="h-3 w-1/2 mx-auto" />
              <Skeleton className="h-3 w-2/3 mx-auto" />
            </div>
            <Skeleton className="h-px mb-5" />
            <div className="grid sm:grid-cols-2 gap-3 max-w-xl mx-auto">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </section>

        {/* 解读区分隔 */}
        <div className="flex items-center justify-center mb-10">
          <Skeleton className="h-px w-16" />
          <Skeleton className="h-4 w-16 mx-4" />
          <Skeleton className="h-px w-16" />
        </div>

        {/* 解读正文骨架 */}
        <div className="prose-article">
          <ParagraphSkeleton lines={8} />
          <div className="my-6" />
          <ParagraphSkeleton lines={5} />
          <div className="my-6" />
          <ParagraphSkeleton lines={6} />
        </div>
      </article>

      {/* 底部相关推荐 + 上一篇下一篇骨架 */}
      <section className="max-w-wide mx-auto px-6 pb-16">
        <Skeleton className="h-px mb-12" />
        <Skeleton className="h-6 w-32 mb-3" />
        <Skeleton className="h-4 w-48 mb-8" />
        <div className="grid md:grid-cols-3 gap-6">
          <ArticleCardSkeleton compact />
          <ArticleCardSkeleton compact />
          <ArticleCardSkeleton compact />
        </div>
      </section>

      {/* 上一篇下一篇骨架 */}
      <nav className="max-w-wide mx-auto px-6 pb-20" aria-hidden="true">
        <Skeleton className="h-px mb-10 pt-10" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-0">
          <div className="p-6 md:p-8">
            <Skeleton className="h-3 w-24 mb-3" />
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-6 w-2/3 mb-3" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-1 w-1" rounded="full" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
          <div className="p-6 md:p-8 md:text-right">
            <Skeleton className="h-3 w-24 ml-auto mb-3" />
            <Skeleton className="h-6 w-3/4 ml-auto mb-2" />
            <Skeleton className="h-6 w-2/3 ml-auto mb-3" />
            <div className="flex items-center justify-end gap-2">
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-1 w-1" rounded="full" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}