import { getAllArticles } from '@/lib/articles';
import FavoritesContent from '@/components/FavoritesContent';
import SectionErrorBoundary from '@/components/SectionErrorBoundary';

export const metadata = {
  title: '我的收藏 · 读通鉴',
  description: '你收藏的文章,和读到一半想接着看的。',
  robots: { index: false, follow: false },
};

export default function FavoritesPage() {
  const allArticles = getAllArticles();
  return (
    <section className="max-w-narrow mx-auto px-6 py-12 md:py-16">
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-ink mb-3">
          我的收藏
        </h1>
        <p className="text-ink-soft">
          数据存在你本机,清浏览器缓存会丢。
        </p>
      </div>
      <SectionErrorBoundary name="我的收藏">
        <FavoritesContent allArticles={allArticles} />
      </SectionErrorBoundary>
    </section>
  );
}
