import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getAllArticles } from '@/lib/articles';
import { DYNASTIES } from '@/lib/dynasties';
import { SITE_URL } from '@/lib/site-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const alt = '读通鉴 — 用 AI 重读 1362 年';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

let _fontCache: ArrayBuffer | null = null;
async function getFontData(): Promise<ArrayBuffer> {
  if (_fontCache) return _fontCache;
  // 读 public/fonts 下的本地字体,无网络往返,跨环境一致
  const fontPath = join(process.cwd(), 'public', 'fonts', 'NotoSerifSC-subset.ttf');
  const buffer = await readFile(fontPath);
  _fontCache = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  return _fontCache;
}

const fontConfig = { name: 'Noto Serif SC', weight: '400' as const, style: 'normal' as const };

export default async function Image() {
  const fontData = await getFontData();
  // 数字从 source 实时算,新增文章/朝代自动同步
  const articles = getAllArticles();
  const articleCount = articles.length;
  const dynastyCount = DYNASTIES.length;
  // 从 SITE_URL 取 host(去掉 protocol),social 分享预览永远指向当前域名
  const displayHost = SITE_URL.replace(/^https?:\/\//, '').replace(/\/$/, '');

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
        {/* 顶部 */}
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
            <div
              style={{ fontSize: '32px', color: '#1A1A1A', fontWeight: 600 }}
            >
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

        {/* 中间 */}
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

        {/* 底部 */}
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
                {articleCount}
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
                {dynastyCount}
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
            {displayHost}
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
          weight: '400',
          style: 'normal',
        } as any,
      ],
    }
  );
}
