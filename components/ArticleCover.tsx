/**
 * ArticleCover — 文章封面
 *
 * 渐进式 webp 优先 + SVG fallback:
 * - public/covers/{slug}.webp 存在 → 用 AI 生成的青绿山水封面
 * - 不存在 → fallback 到 SVG 内联(朝代配色 + motif 装饰)
 *
 * 暗色模式:
 * - SVG:用 CSS 变量自动反色
 * - WebP:用 CSS filter 微微调亮度/对比度,统一暗色感
 *
 * 7 个朝代 7 种 SVG motif (fallback 用):
 * - seal(战国大篆)、flame(秦汉三国烽火)、wave(两晋玄学)
 * - mountain(南北朝佛光)、cloud(隋唐盛世)、plain(五代乱世)、ring(默认)
 */
import type { ArticleMeta } from '@/lib/types';
import type { Dynasty } from '@/lib/articles';
import { hasCover } from '@/lib/cover-slugs';

interface Props {
  article: ArticleMeta;
  dynasty: Dynasty;
  /** 紧凑模式:给 ArticleCard 用,只显示朝代印章大字 + 期刊编号 */
  compact?: boolean;
}

export default function ArticleCover({ article, dynasty, compact = false }: Props) {
  // 优先用 AI 生成的 webp 封面
  if (hasCover(article.slug)) {
    return (
      <div
        className={`relative ${compact ? 'aspect-[4/3]' : 'aspect-[16/9]'} w-full overflow-hidden rounded-sm bg-paper-deep`}
        data-cover-source="ai"
      >
        <img
          src={`/covers/${article.slug}.webp`}
          alt={`${article.title} · ${dynasty.name} 期封面`}
          className="article-cover-img w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>
    );
  }

  // Fallback: SVG 内联(朝代风格)
  return <SvgCover article={article} dynasty={dynasty} compact={compact} />;
}

/** SVG 封面(原实现,作为 fallback 保留) */
function SvgCover({ article, dynasty, compact }: Required<Pick<Props, 'article' | 'dynasty' | 'compact'>>) {
  const { primary, secondary, motif } = dynasty;
  // 显示字号:cover 用大篆古典字,紧凑模式用更大字
  const titleSize = compact ? 'text-[80px] md:text-[120px]' : 'text-[140px] md:text-[220px]';
  const padding = compact ? 'p-6' : 'p-8 md:p-12';

  return (
    <div
      className={`relative ${compact ? 'aspect-[4/3]' : 'aspect-[16/9]'} w-full overflow-hidden rounded-sm`}
      data-cover-source="svg"
      style={{
        // 朝代主色径向渐变 → paper 暖底色
        background: `radial-gradient(ellipse at 30% 30%, ${primary}18 0%, var(--color-paper-card) 60%, var(--color-paper) 100%)`,
      }}
      aria-hidden="true"
    >
      {/* Motif 装饰层 */}
      <MotifLayer motif={motif} primary={primary} secondary={secondary} />

      {/* 顶部细金线 */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(to right, transparent, ${primary} 30%, ${primary} 70%, transparent)`,
        }}
      />
      {/* 底部细金线 */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(to right, transparent, ${primary} 30%, ${primary} 70%, transparent)`,
        }}
      />

      {/* 主内容 */}
      <div className={`relative h-full flex flex-col justify-between ${padding}`}>
        {/* 顶部:期刊编号 */}
        <div className="flex items-center justify-between text-[10px] tracking-[0.3em] uppercase"
          style={{ color: primary }}
        >
          <span>DU TONGJIAN</span>
          <span>第 {article.episode} 期</span>
        </div>

        {/* 中部:朝代大篆 + 古文金句(可选) */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div
              className={`classical ${titleSize} font-bold leading-none tracking-tight`}
              style={{ color: primary }}
            >
              {dynasty.name}
            </div>
            {!compact && article.classicalQuote && (
              <div
                className="mt-4 classical italic text-sm md:text-base leading-relaxed max-w-md mx-auto"
                style={{ color: secondary }}
              >
                「{truncateQuote(article.classicalQuote)}」
              </div>
            )}
          </div>
        </div>

        {/* 底部:印章 + 期数 */}
        <div className="flex items-center justify-between">
          <span
            className="inline-flex items-center justify-center w-10 h-10 classical text-base font-bold rounded-sm"
            style={{
              color: primary,
              border: `1.5px solid ${primary}`,
              background: `${primary}10`,
            }}
          >
            鉴
          </span>
          <span
            className="text-[10px] tracking-widest uppercase"
            style={{ color: secondary }}
          >
            {article.volume}
          </span>
        </div>
      </div>
    </div>
  );
}

/** 古文太长就截断,避免封面爆字 */
function truncateQuote(quote: string, max = 28): string {
  if (quote.length <= max) return quote;
  return quote.slice(0, max) + '…';
}

/**
 * Motif 装饰层 — 根据朝代渲染不同几何/印章背景
 * 全部用 SVG,无外部资源依赖
 */
function MotifLayer({ motif, primary, secondary }: { motif: Dynasty['motif']; primary: string; secondary: string }) {
  switch (motif) {
    case 'seal':
      return (
        <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 400 225" preserveAspectRatio="xMidYMid slice">
          <circle cx="40" cy="40" r="24" fill="none" stroke={primary} strokeWidth="2" />
          <circle cx="360" cy="40" r="24" fill="none" stroke={primary} strokeWidth="2" />
          <circle cx="40" cy="185" r="24" fill="none" stroke={primary} strokeWidth="2" />
          <circle cx="360" cy="185" r="24" fill="none" stroke={primary} strokeWidth="2" />
          <text x="40" y="48" textAnchor="middle" fill={primary} fontSize="20" fontFamily="serif" fontWeight="bold">战</text>
          <text x="360" y="48" textAnchor="middle" fill={primary} fontSize="20" fontFamily="serif" fontWeight="bold">国</text>
          <text x="40" y="193" textAnchor="middle" fill={primary} fontSize="20" fontFamily="serif" fontWeight="bold">争</text>
          <text x="360" y="193" textAnchor="middle" fill={primary} fontSize="20" fontFamily="serif" fontWeight="bold">雄</text>
        </svg>
      );
    case 'flame':
      return (
        <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 400 225" preserveAspectRatio="none">
          {Array.from({ length: 6 }).map((_, i) => (
            <path
              key={i}
              d={`M0 ${50 + i * 30} Q100 ${30 + i * 30} 200 ${50 + i * 30} T400 ${50 + i * 30}`}
              fill="none"
              stroke={primary}
              strokeWidth="1.5"
            />
          ))}
        </svg>
      );
    case 'wave':
      return (
        <svg className="absolute inset-0 w-full h-full opacity-15" viewBox="0 0 400 225" preserveAspectRatio="none">
          {Array.from({ length: 5 }).map((_, i) => (
            <path
              key={i}
              d={`M0 ${30 + i * 40} C100 ${20 + i * 40} 200 ${40 + i * 40} 400 ${30 + i * 40}`}
              fill="none"
              stroke={primary}
              strokeWidth="1.5"
            />
          ))}
        </svg>
      );
    case 'mountain':
      return (
        <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 400 225" preserveAspectRatio="none">
          <path d="M0 180 L80 120 L140 150 L220 90 L300 140 L400 100 L400 225 L0 225 Z" fill={primary} opacity="0.4" />
          <path d="M0 200 L60 160 L160 180 L240 140 L320 170 L400 150 L400 225 L0 225 Z" fill={secondary} opacity="0.3" />
        </svg>
      );
    case 'cloud':
      return (
        <svg className="absolute inset-0 w-full h-full opacity-15" viewBox="0 0 400 225" preserveAspectRatio="xMidYMid slice">
          {[60, 140, 220, 300].map((cx, i) => (
            <g key={i} fill="none" stroke={primary} strokeWidth="1.5">
              <path d={`M${cx - 30} 100 Q${cx - 30} 80 ${cx - 15} 80 Q${cx - 5} 70 ${cx} 80 Q${cx + 20} 80 ${cx + 20} 100`} />
              <path d={`M${cx - 20} 100 Q${cx - 20} 90 ${cx} 90 Q${cx + 15} 90 ${cx + 15} 100`} />
            </g>
          ))}
        </svg>
      );
    case 'plain':
      return (
        <svg className="absolute inset-0 w-full h-full opacity-15" viewBox="0 0 400 225" preserveAspectRatio="none">
          {[40, 90, 140, 200, 260].map((y, i) => (
            <line key={i} x1="0" y1={y} x2="400" y2={y} stroke={secondary} strokeWidth="1" strokeDasharray="20 10" />
          ))}
        </svg>
      );
    case 'ring':
    default:
      return (
        <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 400 225" preserveAspectRatio="xMidYMid slice">
          <circle cx="200" cy="112" r="80" fill="none" stroke={primary} strokeWidth="1.5" />
          <circle cx="200" cy="112" r="60" fill="none" stroke={primary} strokeWidth="1" />
        </svg>
      );
  }
}
