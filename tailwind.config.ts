import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // 通过 <html class="dark"> 切换
  theme: {
    extend: {
      // 颜色用 CSS variables — dark mode 自动反转
      colors: {
        paper: 'var(--color-paper)',
        'paper-deep': 'var(--color-paper-deep)',
        'paper-card': 'var(--color-paper-card)',
        ink: 'var(--color-ink)',
        'ink-soft': 'var(--color-ink-soft)',
        'ink-mute': 'var(--color-ink-mute)',
        cinnabar: 'var(--color-cinnabar)',
        'cinnabar-dark': 'var(--color-cinnabar-dark)',
        'cinnabar-soft': 'var(--color-cinnabar-soft)',
        gold: 'var(--color-gold)',
        'gold-dark': 'var(--color-gold-dark)',
        'gold-soft': 'var(--color-gold-soft)',
        border: 'var(--color-border)',
        'border-soft': 'var(--color-border-soft)',
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', '"Source Han Serif SC"', 'PingFang SC', 'Hiragino Sans GB', '"Microsoft YaHei"', 'serif'],
        kai: ['"LXGW WenKai"', '"霞鹜文楷"', '"Noto Serif SC"', 'PingFang SC', 'Hiragino Sans GB', 'serif'],
        sans: ['"Inter"', '"Noto Serif SC"', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        'reading': '720px',
        'wide': '1200px',
        'narrow': '580px',
      },
      // 浮动按钮底部偏移 — 多按钮共存时避免堆叠
      // fab-1: 最底层(ScrollToTop / 收藏按钮等)
      // fab-2: 中间层(MobileQRButton / OnboardingBubble)
      // fab-3: 第三层(ReadingPrefs 调整字体)
      // fab-4: 最高层(ArticleToc mobile 按钮)
      // 64px stride > 56px 按钮 + 8px gap,确保按钮间有视觉间距
      // 用 className 而非 inline style,集中管理
      spacing: {
        'fab-1': 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)',
        'fab-2': 'calc(env(safe-area-inset-bottom, 0px) + 5.5rem)',
        'fab-3': 'calc(env(safe-area-inset-bottom, 0px) + 9.5rem)',
        'fab-4': 'calc(env(safe-area-inset-bottom, 0px) + 13.5rem)',
      },
    },
  },
  plugins: [],
};

export default config;
