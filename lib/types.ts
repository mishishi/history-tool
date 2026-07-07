// 关键人物
export interface KeyFigure {
  name: string;
  role: string;
}

// 经典原文(资治通鉴原文片段 + 背景)
// 不变层 — 公共领域,所有人共享同一份
export interface Classic {
  slug: string;
  dynasty: string;
  volume: string;
  period: string;
  classicalText: string;   // 资治通鉴原文
  background: string;       // 历史背景(白话)
  keyFigures: KeyFigure[];
}

// 文章元数据类型(对应 markdown frontmatter)
export interface ArticleMeta {
  slug: string;
  classicalSlug: string;    // 关联到 classics/
  title: string;
  subtitle: string;
  dynasty: string;
  volume: string;
  episode: number;
  excerpt: string;
  classicalQuote: string;
  readingTime: number;
  views: number;
  publishedAt: string;
  tags: string[];
}

// 完整文章(含正文)
export interface Article extends ArticleMeta {
  content: string;       // markdown 正文(只含解读)
}

// 文章详情页的合并视图(原文 + 解读)
export interface ArticleView {
  article: Article;
  classic: Classic | null;
}