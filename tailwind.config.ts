import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: '#F5F0E8',
        'paper-deep': '#EFE8DA',
        'paper-card': '#FBF8F2',
        ink: '#1A1A1A',
        'ink-soft': '#4A4A4A',
        'ink-mute': '#8A8A8A',
        cinnabar: '#B23A3A',
        'cinnabar-dark': '#8E2828',
        'cinnabar-soft': '#F5E6E6',
        gold: '#A8895C',
        'gold-dark': '#8C6E45',
        'gold-soft': '#F2EBDD',
        border: '#E8E4DC',
        'border-soft': '#F0EBE0',
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', '"Source Han Serif SC"', 'serif'],
        kai: ['"LXGW WenKai"', '"霞鹜文楷"', '"Noto Serif SC"', 'serif'],
        sans: ['"Inter"', '"Noto Serif SC"', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        'reading': '720px',
        'wide': '1200px',
      },
    },
  },
  plugins: [],
};

export default config;