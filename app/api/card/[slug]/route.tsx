/**
 * GET /api/card/[slug] — 生成文章金句卡片 PNG
 *
 * 用于社交分享(朋友圈/小红书/微博) — 用户点 "生成分享卡片" 按钮触发
 *
 * 设计:1200×1200 方形,朝代印章风视觉(沿用 dynasties.ts 配色)
 * 关键约束:Satori 严格要求 — 任何含多个子节点的 div 必须有 display: flex
 * 这里所有 div 都加 display: flex,文本用模板字符串合并(避免 Satori 把空格当子节点)
 */
import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { NextRequest } from 'next/server';
import { getArticleBySlug } from '@/lib/articles';
import { findDynasty } from '@/lib/dynasties';
import { SITE_URL } from '@/lib/site-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CARD_SIZE = { width: 1200, height: 1200 };

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

// 通用 Satori 兼容样式:每个 div 都加 display: flex(Satori 强制约束)
const flex = { display: 'flex' } as const;

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } },
) {
  const article = getArticleBySlug(params.slug);
  if (!article) {
    return new Response('Article not found', { status: 404 });
  }

  const dynasty = findDynasty(article.dynasty);
  const primary = dynasty?.primary ?? '#3A3A3A';
  const secondary = dynasty?.secondary ?? '#A8895C';
  const displayHost = SITE_URL.replace(/^https?:\/\//, '').replace(/\/$/, '');

  // 模板字符串合并多段文本,避免 Satori 把多段当多个子节点
  const subtitleText = article.subtitle
    ? article.subtitle.length > 80
      ? article.subtitle.slice(0, 80) + '…'
      : article.subtitle
    : '';
  const readingText = `${article.readingTime} 分钟 · ${article.views >= 1000 ? `${(article.views / 1000).toFixed(1)}k` : article.views} 人已读`;
  const urlText = `${displayHost}/article/${article.slug}`;

  const fontData = await getFontData();

  return new ImageResponse(
    (
      <div
        style={{
          ...flex,
          width: '100%',
          height: '100%',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          background: `linear-gradient(135deg, #F5F0E8 0%, ${secondary}10 50%, #F5F0E8 100%)`,
          fontFamily: '"Noto Serif SC"',
        }}
      >
        {/* 顶部 — 品牌 + 朝代印章 */}
        <div style={{ ...flex, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ ...flex, alignItems: 'center', gap: '20px' }}>
            <div
              style={{
                ...flex,
                width: '72px',
                height: '72px',
                alignItems: 'center',
                justifyContent: 'center',
                background: primary,
                color: '#F5F0E8',
                fontSize: '44px',
                fontWeight: 700,
                borderRadius: '4px',
              }}
            >鉴</div>
            <div style={{ ...flex, flexDirection: 'column' }}>
              <div style={{ ...flex, fontSize: '32px', color: '#1A1A1A', fontWeight: 600 }}>读通鉴</div>
              <div style={{ ...flex, fontSize: '14px', color: '#888', letterSpacing: '0.3em' }}>DU TONGJIAN</div>
            </div>
          </div>

          {/* 朝代印章 */}
          <div
            style={{
              ...flex,
              alignItems: 'center',
              gap: '12px',
              padding: '12px 20px',
              border: `3px solid ${primary}`,
              borderRadius: '4px',
              background: '#F5F0E8',
            }}
          >
            <div style={{ ...flex, fontSize: '32px', color: primary, fontWeight: 700, letterSpacing: '0.1em' }}>{article.dynasty}</div>
            <div style={{ ...flex, width: '2px', height: '28px', background: primary, opacity: 0.3 }} />
            <div style={{ ...flex, fontSize: '20px', color: '#4A4A4A', fontWeight: 500 }}>{article.volume}</div>
          </div>
        </div>

        {/* 中间 — 主标题 + 副标题 + 古典金句 */}
        <div
          style={{
            ...flex,
            flexDirection: 'column',
            gap: '40px',
            flex: 1,
            justifyContent: 'center',
            marginTop: '40px',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              ...flex,
              fontSize: '72px',
              color: '#1A1A1A',
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
            }}
          >{article.title}</div>

          {article.subtitle && (
            <div
              style={{
                ...flex,
                fontSize: '32px',
                color: '#4A4A4A',
                lineHeight: 1.5,
                maxWidth: '1040px',
              }}
            >{subtitleText}</div>
          )}

          {article.classicalQuote && (
            <div
              style={{
                ...flex,
                padding: '32px 40px',
                background: '#F5F0E8',
                borderLeft: `6px solid ${primary}`,
                borderRadius: '4px',
                marginTop: '20px',
              }}
            >
              <div
                style={{
                  ...flex,
                  fontSize: '28px',
                  color: '#5C4A2A',
                  lineHeight: 1.6,
                  fontStyle: 'italic',
                }}
              >「{article.classicalQuote}」</div>
            </div>
          )}
        </div>

        {/* 底部 — EP 编号 + 文章链接 */}
        <div
          style={{
            ...flex,
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: `3px solid ${primary}`,
            paddingTop: '32px',
          }}
        >
          <div style={{ ...flex, alignItems: 'center', gap: '20px' }}>
            <div
              style={{
                ...flex,
                fontSize: '20px',
                color: primary,
                fontWeight: 700,
                padding: '6px 14px',
                background: `${primary}15`,
                borderRadius: '4px',
                letterSpacing: '0.1em',
              }}
            >EP{String(article.episode).padStart(2, '0')}</div>
            <div style={{ ...flex, fontSize: '20px', color: '#4A4A4A' }}>{readingText}</div>
          </div>
          <div
            style={{
              ...flex,
              fontSize: '22px',
              color: primary,
              fontWeight: 600,
            }}
          >{urlText}</div>
        </div>
      </div>
    ),
    {
      ...CARD_SIZE,
      fonts: [
        {
          name: 'Noto Serif SC',
          data: fontData,
          weight: '400',
          style: 'normal',
        } as any,
      ],
    },
  );
}
