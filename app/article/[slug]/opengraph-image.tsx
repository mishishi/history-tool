/**
 * per-article 1200×630 og 卡片
 *
 * 用途: 文章页 og:image — 朋友圈/Twitter/小红书/微博 分享预览
 * 设计: 横版(1.91:1),朝代印章风视觉 + 文章标题 + excerpt
 *
 * 关键约束(Satori):
 * - 任何含多个子节点的 div 必须 display: flex
 * - JSX 模板字符串里避免反引号
 * - 文本用模板字符串合并(避免 Satori 把空格当子节点)
 *
 * 路径: app/article/[slug]/opengraph-image.tsx
 *  → 访问 /article/<slug>/opengraph-image 返回 1200×630 PNG
 *  → Next.js 在 build 时调用 generateImageMetadata 枚举所有 slug
 *  → Vercel 部署后,每篇文章的 og:image URL 在 build 期已生成,首抓快(<100ms)
 */
import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getAllArticles } from '@/lib/articles';
import { findDynasty } from '@/lib/dynasties';
import { SITE_URL } from '@/lib/site-config';

// 静态枚举所有文章 — build 时为每篇生成一张
export async function generateImageMetadata({
  params,
}: {
  params: { slug: string };
}) {
  return [
    {
      id: params.slug,
      size: { width: 1200, height: 630 },
      contentType: 'image/png',
      alt: `${params.slug} og`,
    },
  ];
}

export const runtime = 'nodejs';
export const alt = '读通鉴文章预览';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

let _fontCache: ArrayBuffer | null = null;
async function getFontData(): Promise<ArrayBuffer> {
  if (_fontCache) return _fontCache;
  const fontPath = join(process.cwd(), 'public', 'fonts', 'NotoSerifSC-subset.ttf');
  const buffer = await readFile(fontPath);
  _fontCache = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  );
  return _fontCache;
}

export default async function Image({ params }: { params: { slug: string } }) {
  const article = getAllArticles().find((a) => a.slug === params.slug);
  if (!article) {
    // 兜底:站点 og
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#1A1A1A',
            color: '#F5F0E8',
            fontSize: 48,
          }}
        >
          读通鉴
        </div>
      ),
      { ...size },
    );
  }

  const dynasty = findDynasty(article.dynasty);
  const primary = dynasty?.primary ?? '#B23A3A';
  const secondary = dynasty?.secondary ?? '#A8895C';
  const displayHost = SITE_URL.replace(/^https?:\/\//, '').replace(/\/$/, '');

  const fontData = await getFontData();
  // 文本预先合并(Satori 严格约束)
  const excerptText = article.excerpt.length > 90
    ? article.excerpt.slice(0, 90) + '…'
    : article.excerpt;
  const readingText = `${article.readingTime} 分钟 · 第 ${article.episode} 期`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
          background: 'linear-gradient(135deg, #F5F0E8 0%, #EFE8DA 50%, #F5F0E8 100%)',
          fontFamily: '"Noto Serif SC"',
        }}
      >
        {/* 左侧 60% — 主标题 + 摘要 */}
        <div
          style={{
            width: '60%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '60px',
          }}
        >
          {/* 顶部品牌 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#B23A3A',
                color: '#F5F0E8',
                fontSize: '32px',
                fontWeight: 700,
                borderRadius: '4px',
              }}
            >
              鉴
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '24px', color: '#1A1A1A', fontWeight: 600 }}>
                读通鉴
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: '#888',
                  letterSpacing: '0.3em',
                }}
              >
                DU TONGJIAN
              </div>
            </div>
          </div>

          {/* 中间 — 标题 + excerpt */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              flex: 1,
              justifyContent: 'center',
              marginTop: '30px',
              marginBottom: '30px',
            }}
          >
            <div
              style={{
                fontSize: '54px',
                color: '#1A1A1A',
                fontWeight: 700,
                lineHeight: 1.2,
                letterSpacing: '-0.01em',
                display: 'flex',
              }}
            >
              {article.title}
            </div>
            <div
              style={{
                fontSize: '24px',
                color: '#4A4A4A',
                lineHeight: 1.5,
                display: 'flex',
              }}
            >
              {excerptText}
            </div>
          </div>

          {/* 底部 — readingTime + 期数 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              fontSize: '18px',
              color: '#666',
            }}
          >
            <div style={{ display: 'flex' }}>{readingText}</div>
            <div
              style={{
                width: '4px',
                height: '4px',
                background: '#888',
                borderRadius: '50%',
                display: 'flex',
              }}
            />
            <div style={{ display: 'flex', color: primary, fontWeight: 600 }}>
              {displayHost}
            </div>
          </div>
        </div>

        {/* 右侧 40% — 朝代印章(大块色 + 印章文字) */}
        <div
          style={{
            width: '40%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: `linear-gradient(180deg, ${primary} 0%, ${secondary} 100%)`,
            color: '#F5F0E8',
            padding: '40px',
          }}
        >
          {/* 卷号 */}
          <div
            style={{
              fontSize: '20px',
              letterSpacing: '0.3em',
              opacity: 0.7,
              display: 'flex',
              marginBottom: '20px',
            }}
          >
            {article.volume}
          </div>
          {/* 朝代印章框 */}
          <div
            style={{
              width: '280px',
              height: '280px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '6px solid #F5F0E8',
              borderRadius: '8px',
              fontSize: '92px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              background: 'rgba(245, 240, 232, 0.08)',
            }}
          >
            {article.dynasty}
          </div>
          <div
            style={{
              fontSize: '16px',
              marginTop: '24px',
              opacity: 0.85,
              letterSpacing: '0.2em',
              display: 'flex',
            }}
          >
            DU TONGJIAN
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'Noto Serif SC',
          data: fontData,
          weight: 400,
          style: 'normal',
        },
      ],
    },
  );
}
