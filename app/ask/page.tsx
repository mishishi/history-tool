/**
 * AI 问典 — 服务端壳
 * 实际聊天交互在 <AskChat /> 客户端组件
 */
import type { Metadata } from 'next';
import { isRagConfigured } from '@/lib/rag/config';
import AskChat from '@/components/AskChat';
import JsonLd from '@/components/JsonLd';
import SectionErrorBoundary from '@/components/SectionErrorBoundary';
import { SITE_URL } from '@/lib/site-config';
import { getAllArticles } from '@/lib/articles';

/**
 * Dynamic metadata — 文章数实时算(取代 hardcode "100 篇")
 */
export async function generateMetadata(): Promise<Metadata> {
  const articleCount = getAllArticles().length;
  const title = 'AI 问典 — 用对话读通鉴';
  const description = `跟 ${articleCount} 篇通鉴解读对话。问"战国怎么当诸侯" / "改革为什么总是失败" / "X 和 Y 有何相似" — AI 给你基于原文的回答。`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/ask` },
    openGraph: {
      title,
      description: `跟 ${articleCount} 篇通鉴解读对话。AI 基于原文给你回答。`,
      type: 'website',
      url: `${SITE_URL}/ask`,
      siteName: '读通鉴',
      locale: 'zh_CN',
      images: [
        {
          url: `${SITE_URL}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: `跟 ${articleCount} 篇通鉴解读对话`,
      images: [`${SITE_URL}/opengraph-image`],
    },
  };
}

export default function AskPage() {
  const configured = isRagConfigured();
  const articleCount = getAllArticles().length;

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: '读通鉴 · AI 问典',
          description: `跟 ${articleCount} 篇资治通鉴 AI 解读对话,基于原文回答`,
          url: `${SITE_URL}/ask`,
        }}
      />
      <div className="max-w-narrow mx-auto px-4 md:px-6 pt-10 md:pt-14 pb-6">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-3 text-xs text-ink-mute tracking-widest uppercase">
            <span className="w-8 h-px bg-cinnabar"></span>
            <span>AI 问典</span>
            <span className="w-8 h-px bg-cinnabar"></span>
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-ink leading-tight mb-2">
            跟通鉴对话
          </h1>
          <p className="text-sm md:text-base text-ink-soft leading-relaxed">
            {articleCount} 篇 AI 解读,问什么都行
          </p>
        </div>

        {configured ? (
          <SectionErrorBoundary name="AI 问典">
            <AskChat />
          </SectionErrorBoundary>
        ) : (
          <NotConfiguredNotice />
        )}
      </div>
    </>
  );
}

/** 服务端配置未就绪时的占位 UI(让用户知道功能存在但需要 setup) */
function NotConfiguredNotice() {
  return (
    <div className="mt-8 p-6 md:p-8 bg-paper-card border border-border rounded-sm">
      <div className="text-center">
        <div className="inline-flex w-12 h-12 items-center justify-center rounded-full bg-cinnabar-soft text-cinnabar mb-4">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-ink mb-2">AI 问典暂未上线</h2>
        <p className="text-sm text-ink-soft leading-relaxed max-w-md mx-auto mb-4">
          这个功能需要 LLM API key 和 Upstash Vector 数据库。
          部署后运行 <code className="text-xs px-1 py-0.5 bg-paper-deep rounded">npm run build-embeddings</code> 一次即可启用。
        </p>
        <a
          href="https://github.com/mishishi/history-tool#ai-问典"
          className="text-sm text-cinnabar hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          查看 README 设置步骤 →
        </a>
      </div>
    </div>
  );
}
