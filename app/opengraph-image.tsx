import { ImageResponse } from 'next/og';
import fs from 'node:fs';
import path from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const alt = '读通鉴 — 用 AI 重读 1362 年';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

let _fontData: ArrayBuffer | null = null;
function getFontData(): ArrayBuffer {
  if (_fontData) return _fontData;
  const fontPath = path.join(process.cwd(), 'public', 'fonts', 'NotoSerifSC-Regular.ttf');
  const buf = fs.readFileSync(fontPath);
  // ArrayBufferLike → ArrayBuffer 转换
  _fontData = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  return _fontData;
}

export default async function Image() {
  const fontData = getFontData();

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
          background: 'linear-gradient(135deg, #F5F0E8 0%, #EFE8DA 100%)',
          fontFamily: '"Noto Serif SC"',
        }}
      >
        {/* 顶部印章 + 站名 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#B23A3A',
              color: '#F5F0E8',
              fontSize: '44px',
              fontWeight: 700,
              borderRadius: '4px',
            }}
          >
            鉴
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '32px', color: '#1A1A1A', fontWeight: 600 }}>
              读通鉴
            </div>
            <div
              style={{
                fontSize: '14px',
                color: '#888',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
              }}
            >
              DU TONGJIAN · 用 AI 重读 1362 年
            </div>
          </div>
        </div>

        {/* 中间主标题 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            flex: 1,
            justifyContent: 'center',
            marginTop: '40px',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              fontSize: '76px',
              color: '#1A1A1A',
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
            }}
          >
            资治通鉴 × AI
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              fontSize: '32px',
              color: '#666',
              lineHeight: 1.4,
              maxWidth: '900px',
            }}
          >
            <div>把司马光写给皇帝的这部书,</div>
            <div>翻译成当代人能读懂、能用上的东西。</div>
          </div>
        </div>

        {/* 底部 — 数字 + URL */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            borderTop: '2px solid #B23A3A',
            paddingTop: '24px',
          }}
        >
          <div style={{ display: 'flex', gap: '40px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  fontSize: '36px',
                  color: '#B23A3A',
                  fontWeight: 700,
                }}
              >
                50
              </div>
              <div style={{ fontSize: '14px', color: '#888' }}>篇深度解读</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  fontSize: '36px',
                  color: '#B23A3A',
                  fontWeight: 700,
                }}
              >
                1362
              </div>
              <div style={{ fontSize: '14px', color: '#888' }}>年历史跨度</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  fontSize: '36px',
                  color: '#B23A3A',
                  fontWeight: 700,
                }}
              >
                14
              </div>
              <div style={{ fontSize: '14px', color: '#888' }}>个朝代</div>
            </div>
          </div>
          <div
            style={{
              fontSize: '20px',
              color: '#B23A3A',
              fontWeight: 600,
            }}
          >
            history-tool.vercel.app
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
