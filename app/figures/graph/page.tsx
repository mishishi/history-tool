/**
 * /figures/graph — 人物关系图谱页
 *
 * server component:调 getFiguresGraph() 拿静态数据
 * client component:FigureGraph 渲染 d3-force 力学布局 + react-flow
 *
 * weightThreshold=1 (默认)— 共现 1+ 次的边都显示
 * 边太多可调高(2 / 3)减少噪声
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { getFiguresGraph } from '@/lib/figures-graph';
import { SITE_URL } from '@/lib/site-config';
import FigureGraph from '@/components/FigureGraph';

export const metadata: Metadata = {
  title: '人物关系图谱 — 读通鉴',
  description:
    '把 100 篇通鉴文章里 230+ 人物的关系画成一张图。同一个事件里同时出现 = 一条关系;反复共同出现 = 关系越强。',
  alternates: { canonical: `${SITE_URL}/figures/graph` },
  openGraph: {
    title: '人物关系图谱 — 读通鉴',
    description: '把 100 篇通鉴文章里 230+ 人物的关系画成一张图。',
    type: 'website',
    url: `${SITE_URL}/figures/graph`,
    siteName: '读通鉴',
    locale: 'zh_CN',
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: '人物关系图谱 — 读通鉴',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '人物关系图谱 — 读通鉴',
    description: '把 100 篇通鉴文章里 230+ 人物的关系画成一张图。',
    images: [`${SITE_URL}/opengraph-image`],
  },
};

export default function FiguresGraphPage() {
  const graph = getFiguresGraph(1);

  return (
    <div className="max-w-wide mx-auto px-6 py-8 md:py-12">
      {/* Hero */}
      <header className="mb-6">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-4 text-xs text-ink-mute tracking-widest uppercase">
            <span className="w-8 h-px bg-cinnabar"></span>
            <span>人物关系图谱</span>
            <span className="w-8 h-px bg-cinnabar"></span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-ink leading-tight mb-3">
            {graph.nodes.length} 个人物 · {graph.edges.length} 条关系
          </h1>
          <p className="text-sm md:text-base text-ink-soft leading-relaxed mb-4">
            同一篇通鉴里同时出现 = 一条关系;反复共同出现 = 关系越强。
            拖动节点,点击查看人物。
          </p>
          <div className="flex items-center justify-center gap-3 text-xs text-ink-mute">
            <Link href="/figures" className="hover:text-cinnabar transition-colors">
              ← 回到人物长卷
            </Link>
            <span>·</span>
            <span>力学布局已自动展开</span>
          </div>
        </div>
      </header>

      {/* 图谱 */}
      <FigureGraph graph={graph} />

      {/* 底部图例 + 说明 */}
      <section className="mt-8 grid md:grid-cols-3 gap-4 text-sm">
        <div className="p-4 bg-paper-card border border-border rounded-sm">
          <h3 className="font-semibold text-ink mb-2">节点大小</h3>
          <ul className="space-y-1 text-xs text-ink-soft">
            <li>字号 = 出现次数 (×1 ~ ×6+)</li>
            <li>边框色 = 朝代主色</li>
            <li>拖动节点调整位置</li>
          </ul>
        </div>
        <div className="p-4 bg-paper-card border border-border rounded-sm">
          <h3 className="font-semibold text-ink mb-2">边粗细</h3>
          <ul className="space-y-1 text-xs text-ink-soft">
            <li>细线 = 共同出现 1 次</li>
            <li>较粗 = 2 次</li>
            <li>最粗 + label = 3+ 次</li>
          </ul>
        </div>
        <div className="p-4 bg-paper-card border border-border rounded-sm">
          <h3 className="font-semibold text-ink mb-2">操作</h3>
          <ul className="space-y-1 text-xs text-ink-soft">
            <li>滚轮 = 缩放</li>
            <li>拖空白 = 平移</li>
            <li>点节点 = 跳转到人物详情</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
