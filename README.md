# 读通鉴 · Du Tongjian

> 把资治通鉴讲成你听得懂、用得上的故事。

## 项目结构

```
history-tool/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # 全局布局
│   ├── page.tsx                 # 首页
│   ├── article/[slug]/page.tsx  # 文章详情(动态路由)
│   ├── archive/page.tsx          # 通鉴目录(8 朝代 × 50 篇)
│   ├── figures/                  # 人物长卷(238 人物)
│   │   ├── page.tsx
│   │   └── [slug]/page.tsx       # 单人物详情(SSG 238 个)
│   ├── ask/page.tsx              # AI 问典(RAG 聊天 UI)
│   ├── api/
│   │   ├── card/[slug]/route.tsx # 分享卡片 PNG 生成
│   │   └── ask/route.ts          # AI 问典 SSE 端点
│   ├── unlock/page.tsx          # 付费解锁
│   └── globals.css              # 全局样式
├── components/                   # React 组件
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── ArticleCard.tsx
│   ├── ArticleCover.tsx          # 朝代印章风封面
│   ├── AskChat.tsx               # AI 问典聊天组件
│   ├── ShareButtons.tsx          # 文章分享组
│   └── Seal.tsx
├── content/articles/             # Markdown 文章(50 篇)
│   ├── 01-zhishi-wang.md
│   └── 02-shangyang.md
├── content/classics/             # 资治通鉴原文 + keyFigures(50 篇)
├── lib/                          # 工具函数
│   ├── articles.ts               # 文章 IO + extractToc
│   ├── articles-data.ts          # 边缘 runtime 数据
│   ├── archive.ts                 # IA 8 朝代组
│   ├── figures.ts                # 238 人物聚合
│   ├── rag/                       # AI 问典模块
│   │   ├── config.ts            # OpenAI 兼容客户端
│   │   ├── embed.ts             # Embedding
│   │   ├── search.ts            # Upstash Vector 检索
│   │   └── chat.ts              # LLM 流式回答
│   └── types.ts
├── scripts/                      # 构建脚本
│   ├── build-article-data.mjs    # 文章 metadata 导出
│   └── build-embeddings.mjs      # 把 50 篇 embed 到 Vector
├── content-pipeline/             # 内容生成流水线
├── public/                       # 静态资源
└── README.md
├── prototype/                    # 设计稿(静态 HTML,原型阶段)
│   ├── index.html
│   ├── article.html
│   └── unlock.html
└── package.json
```

## 快速开始

### 环境要求

- Node.js 18+
- npm / pnpm / yarn(任选)

### 安装依赖

```bash
cd /Users/zhurenbao/Jason/ai-workspaces/history-tool
npm install
```

### 启动开发服务器

```bash
npm run dev
```

打开 http://localhost:3000 查看。

### 构建生产版本

```bash
npm run build
npm run start
```

## 添加新文章

1. 在 `content/articles/` 下创建新的 markdown 文件,文件名格式:`XX-slug.md`
2. 顶部加 frontmatter(参考已有文件):

```yaml
---
title: 你的标题
subtitle: 副标题
dynasty: 战国 / 秦汉 / 三国 / ...
volume: 卷X
episode: N
excerpt: 卡片副标题
classicalQuote: 古文引子
readingTime: 8
views: 0
publishedAt: 2026-07-07
tags: [标签1, 标签2]
---
```

3. 写正文(markdown)
4. 在文章中可用特殊 class:
   - `<p class="lead">` - 开篇钩子
   - `<blockquote>` - 古文引用(自动应用楷体样式)
   - `<div class="modern-mapping">` - 现代映射区
   - `<p class="closing-quote">` - 金句收尾
5. 重启 dev server,新文章自动出现在首页

## 部署

### Vercel(推荐,MVP 阶段免费)

1. 把代码 push 到 GitHub
2. 打开 https://vercel.com,导入 GitHub 仓库
3. 默认配置即可,点击 Deploy
4. 之后每次 push 自动部署

### 命令行部署

```bash
npm i -g vercel
vercel        # 第一次部署,按提示走
vercel --prod # 生产环境部署
```

## 设计稿

`prototype/` 目录下是早期设计稿(静态 HTML)。MVP 阶段用 Next.js 实现后,prototype 不再需要,可以删除或保留作为参考。

## MVP 阶段不做的

- 用户系统(后期接 Supabase Auth)
- 真支付(微信支付 mock,留接入点)
- 评论系统
- 搜索
- 数据统计
- 小程序版

## 下一步

1. 内容扩到 80-100 篇(当前 ~50 篇)+ 人物长卷
2. 接用户系统 + 数据云同步(替代纯 localStorage)
3. 公众号引流 + 真实付费转化
4. 真实 Lighthouse 跑分 + Core Web Vitals 优化

## 已上线的能力(2026-07 起)

| 类别 | 能力 | 状态 |
|------|------|------|
| 内容 | ~50 篇深度解读 + 原文 + 关键人物(共 7 个朝代) | ✅ |
| 渠道 | SEO 基础(robots/sitemap)、OG 图、RSS、站内搜索 Cmd+K | ✅ |
| PWA | Service Worker 离线缓存、/offline fallback、Android/iOS 安装引导、收藏 + 阅读进度 | ✅ |
| 留存 | 邮件订阅(Resend + Upstash Redis,双确认) | 🟡 待激活 |
| 支付 | Stripe Checkout 单期 ¥9.90(test mode) | 🟡 待激活 |

### 邮件订阅激活步骤

1. 注册 [Resend](https://resend.com) 拿到 `re_xxx` API Key
2. 注册 [Upstash](https://upstash.com) 创建一个 Redis,选 "Global",把 REST URL + Token 复制过来
3. Vercel 项目 → Settings → Environment Variables,加 3 个:
   ```
   RESEND_API_KEY=re_xxx
   UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
   UPSTASH_REDIS_REST_TOKEN=Axxx
   ```
4. (可选)`SUBSCRIBE_FROM_EMAIL` 改为你自己的域名地址,Resend 域名校验通过才行
5. 重新部署即可。激活后流程:用户填邮箱 → 收到确认邮件 → 点链接 → 入列表

### Stripe 支付激活步骤(单期 ¥9.90 那档)

1. 注册 [Stripe](https://stripe.com),开 **Test mode**(免税、不真扣款)
2. Developers → API keys → **Reveal test key** → 拷贝 `sk_test_xxx`
3. Vercel 项目 → Settings → Environment Variables:
   ```
   STRIPE_SECRET_KEY=sk_test_xxx
   ```
4. (生产再上 `STRIPE_PUBLISHABLE_KEY=pk_live_xxx`,目前没用到)
5. Redeploy

测试一下:点 /unlock 单期按钮 → Stripe Test Card 输 `4242 4242 4242 4242` + 任意未来日期 + 任意 CVC + 任意邮编 → 直接跳回 /unlock/success → 显示 ✓

**年付/三年方案** 暂时 disabled — 它们要 Supabase Auth + email → plan 持久化,等用户系统接入再做。

### AI 问典激活步骤(RAG 聊天 / /ask)

`/ask` 页面已上线,但需要 LLM API + 向量数据库才能用。**不配也安全** — UI 显示「AI 问典暂未上线」友好提示。

#### 1. 注册 LLM(任选一个,推荐 DeepSeek 性价比)
- **[DeepSeek](https://platform.deepseek.com)**(推荐):中文强,¥1/百万 tokens,baseURL `https://api.deepseek.com`,model `deepseek-chat`
- **[OpenAI](https://platform.openai.com)**:baseURL `https://api.openai.com/v1`,model `gpt-4o-mini`
- 智谱 / 通义 / 月之暗面:都 OpenAI 兼容,改 `LLM_BASE_URL` + `LLM_MODEL` 即可

#### 2. 注册 Upstash Vector
1. 打开 [Upstash Console](https://console.upstash.com)
2. **Create Database** → 选 **Vector** 类型(不是 Redis!)
3. 选 region(推荐离你 Vercel region 近的)
4. 复制 **REST URL** 和 **REST Token**

#### 3. Embedding 模型
当前默认 `text-embedding-3-small`(OpenAI,1536 维,¥0.02/百万 tokens)。DeepSeek **目前没 embedding API**,所以单独用 OpenAI 的 key。
- 预算紧:用 `text-embedding-3-small`
- 精度高:用 `text-embedding-3-large`(3072 维,贵 10x)

#### 4. 填 env
`.env.local` 加 6 行:
```bash
# LLM chat
LLM_API_KEY=sk-xxx
LLM_BASE_URL=https://api.deepseek.com
LLM_MODEL=deepseek-chat

# Embedding(通常跟 LLM 同源,DeepSeek 没有就配 OpenAI)
EMBEDDING_API_KEY=sk-xxx
EMBEDDING_BASE_URL=https://api.openai.com/v1
EMBEDDING_MODEL=text-embedding-3-small

# Upstash Vector
UPSTASH_VECTOR_REST_URL=https://xxx-xxx.upstash-vector.io
UPSTASH_VECTOR_REST_TOKEN=xxxx
```

#### 5. 跑一次把 50 篇文章 embed 到 Vector
```bash
npm run build-embeddings
```
看到 `✅ Done! 50 articles embedded.` 即可。

#### 6. 部署到 Vercel
1. Vercel Project → Settings → Environment Variables,加上面 6 个
2. (重要)**在 Vercel 后台也跑一次 build-embeddings**,让 prod 的 Vector DB 也有数据
   - Vercel → Project → Settings → Functions → 进到 build 容器,或本地用 Vercel CLI 跑
   - 简化版:本地跑 `VERCEL_TOKEN=xxx vercel env pull .env.production && npm run build-embeddings`,把 env 切到 prod 再跑
3. Redeploy → `/ask` 可用

#### 工作原理
```
用户问:「战国怎么当诸侯?」
   ↓
embed(question) → 向量
   ↓
Upstash Vector top-3 检索
   ↓
找到:三家分晋 / 商鞅变法 / 围魏救赵
   ↓
拼 prompt:系统提示 + 3 篇解读摘要 + 用户问题
   ↓
LLM 流式回答(SSE)
   ↓
前端打字机效果显示
```

每条 AI 回答会显示「基于这些解读」徽章,点击跳转到原文 — 透明可追溯,不黑盒。

参考 `.env.local.example`,本地开发也用同一份环境变量。