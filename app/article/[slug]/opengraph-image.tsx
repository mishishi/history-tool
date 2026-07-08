import { ImageResponse } from 'next/og';
import fs from 'node:fs';
import path from 'node:path';
import { getArticleBySlug } from '@/lib/articles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const alt = '读通鉴文章';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

let _fontData: ArrayBuffer | null = null;
function getFontData(): ArrayBuffer {
  if (_fontData) return _fontData;
  const fontPath = path.join(process.cwd(), 'public', 'fonts', 'NotoSerifSC-Regular.ttf');
  const buf = fs.readFileSync(fontPath);
  _fontData = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  return _fontData;
}

export default async function Image({ params }: { params: { slug: string } }) {
  const article = getArticleBySlug(params.slug);
  const fontData = getFontData();

  // fallback,如果文章不存在
  if (!article) {
    return new ImageResponse(
      <div style={{ width: '100%', height: '100%', background: '#F5F0E8' }} />,
      { ...size, fonts: [{ name: 'Noto Serif SC', data: fontData, weight: 400, style: 'normal' }] }
    );
  }

  // 截断长标题
  const truncatedTitle =
    article.title.length > 32
      ? article.title.slice(0, 30) + '…'
      : article.title;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          background:
            'linear-gradient(135deg, #F5F0E8 0%, #EFE8DA 60%, #E8DFD0 100%)',
          fontFamily: '"Noto Serif SC"',
        }}
      >
        {/* 顶部 — 印章 + 朝代标签 + 期号 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#B23A3A',
                color: '#F5F0E8',
                fontSize: '36px',
                fontWeight: 700,
                borderRadius: '4px',
              }}
            >
              鉴
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  fontSize: '24px',
                  color: '#1A1A1A',
                  fontWeight: 600,
                }}
              >
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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '8px 20px',
              border: '1.5px solid #B23A3A',
              color: '#B23A3A',
              fontSize: '16px',
              fontWeight: 600,
              borderRadius: '2px',
            }}
          >
            {article.dynasty} · 第 {article.episode} 期
          </div>
        </div>

        {/* 中间 — 标题 + 副标题 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            flex: 1,
            justifyContent: 'center',
            marginTop: '40px',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              fontSize: '64px',
              color: '#1A1A1A',
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
            }}
          >
            {truncatedTitle}
          </div>
          {article.subtitle && (
            <div
              style={{
                fontSize: '26px',
                color: '#666',
                lineHeight: 1.5,
                maxWidth: '900px',
              }}
            >
              {article.subtitle}
            </div>
          )}
        </div>

        {/* 底部 — 古典原文 + 站点 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            borderTop: '2px solid #B23A3A',
            paddingTop: '24px',
          }}
        >
          <div
            style={{
              fontSize: '16px',
              color: '#888',
              fontStyle: 'italic',
            }}
          >
            资治通鉴 · {article.volume}
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ fontSize: '16px', color: '#666' }}>
              {article.readingTime} 分钟阅读 · {article.views} 人已读
            </div>
            <div
              style={{
                fontSize: '18px',
                color: '#B23A3A',
                fontWeight: 600,
              }}
            >
              history-tool.vercel.app
            </div>
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
    }
  );
}
