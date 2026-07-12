# 读通鉴 · Du Tongjian

> 把司马光写给皇帝的这部书，翻译成当代人能读懂、能用上的东西。
> 50 篇深度解读 · 1362 年 · 9 朝代 · 238 人物。

**线上**：https://history-tool.vercel.app

---

## 这是什么

「读通鉴」是一个 **AI 加持的资治通鉴解读站**。每一篇通鉴故事（战国卷到现代）用 8-12 分钟讲清楚 — 古文原文 + 白话翻译 + 现代映射（领导力/创业/团队/决策），不卖弄、不掉书袋。

**核心 4 个区别于其他解读站**：

1. **AI 封面**：每篇文章配一张朝代印章风的 AI 封面（青绿山水 / 敦煌壁画 / 古地图风格）
2. **人物图谱**：238 位历史人物的关系网络（d3-force 力学布局 + react-flow 渲染）
3. **TTS 朗读**：49/50 篇配 AI 朗读 + 段落自动高亮（通勤路上听）
4. **AI 问典**：基于 50 篇内容的 RAG 聊天，问"玄武门之变跟靖难之役有何相似" AI 给你基于原文的回答

---

## 快速开始

### 环境要求

- Node.js 18+（推荐 20 LTS）
- macOS / Linux（Vercel 部署无 OS 限制）
- 可选：`pnpm`（推荐）/ `npm` / `yarn`

### 安装 + 启动

```bash
git clone https://github.com/mishishi/history-tool.git
cd history-tool
npm install
cp .env.local.example .env.local   # 填入下面需要的 API Key
npm run dev                        # http://localhost:3000
```

**只读 / 不接 AI** — 不配任何 env 也能跑，只有 `/ask` AI 聊天 + 邮件订阅会显示"暂未配置"提示。

### 跑生产 build

```bash
npm run build   # 自动跑 prebuild: build-cover-manifest.mjs
npm run start
```

50 篇文章全 SSG 预渲染（< 60s），50 张 per-article og 图同时 build 期生成。

---

## 部署到 Vercel

### 安装 + 启动

```bash
git clone https://github.com/mishishi/history-tool.git
cd history-tool
npm install   # 自动装 .githooks/pre-commit (防止直接在 main 改 + tsc 检查)
npm run dev   # http://localhost:3000
```

**Pre-commit hook**（自动）:
- 禁止在 `main` 分支直接 commit（强制开 worktree）
- commit 前跑 `tsc --noEmit`，失败拒绝
- 跳过：`git commit --no-verify`

### 第一次

1. 把代码 push 到 GitHub
2. https://vercel.com → "New Project" → 选仓库
3. **Framework Preset**：Next.js（自动识别）
4. **Build Command**：`npm run build`（默认）
5. **环境变量**：在 Project Settings → Environment Variables 加（见下面"激活各功能"）
6. Deploy → 3 分钟拿到 https://history-tool-xxx.vercel.app

### 之后

`git push origin main` → Vercel 自动 hook → build + deploy（3-5 分钟）。
预览：每个 PR 自动得到一个 preview URL。

---

## 激活各功能

`.env.local.example` 列了所有 env。**只填你要的功能**，其他不填也能跑：

| 功能 | 需要的 env | 不配时行为 |
|---|---|---|
| **基础（必填）** | 无 | — |
| **邮件订阅** | `RESEND_API_KEY` + `UPSTASH_REDIS_REST_URL/TOKEN` | `/subscribed` 返回 503 |
| **Stripe 支付** | `STRIPE_SECRET_KEY` | `/unlock` 按钮显示"暂未配置" |
| **AI 问典** | `LLM_API_KEY` + `EMBEDDING_API_KEY` + `UPSTASH_VECTOR_REST_URL/TOKEN` | `/ask` 显示"暂未上线" |
| **自定义域名** | `NEXT_PUBLIC_SITE_URL` | 默认用 `https://history-tool.vercel.app` |

### AI 问典完整步骤（RAG 聊天）

这是最复杂的功能。一步步来：

1. **LLM**（任选，推荐 DeepSeek 便宜）：
   - DeepSeek：`https://platform.deepseek.com` → API Keys → `LLM_API_KEY=sk-xxx`，`LLM_BASE_URL=https://api.deepseek.com`，`LLM_MODEL=deepseek-chat`
   - OpenAI：`LLM_BASE_URL=https://api.openai.com/v1`，`LLM_MODEL=gpt-4o-mini`
2. **Embedding**（DeepSeek 没 embedding，单独配 OpenAI）：
   - `EMBEDDING_API_KEY=sk-xxx`，`EMBEDDING_BASE_URL=https://api.openai.com/v1`，`EMBEDDING_MODEL=text-embedding-3-small`
3. **Upstash Vector**：`https://console.upstash.com` → **Create Database** → 选 **Vector** 类型（不是 Redis）→ 复制 REST URL + Token
4. **跑一次 embed**（把 50 篇灌到 Vector）：
   ```bash
   npm run build-embeddings
   # 看到 ✅ Done! 50 articles embedded. 即可
   ```
5. **部署到 Vercel**：在 Vercel Project → Settings → Environment Variables 加上面 6 个 env，Redeploy
6. **重要**：prod 的 Upstash Vector 也是空的，**需要在 Vercel 跑一次 build-embeddings**：
   - 简单办法：本地把 env 切到 prod token 跑
   ```bash
   # 把 prod 的 UPSTASH_VECTOR_REST_URL/TOKEN 复制到 .env.local
   npm run build-embeddings
   ```
7. 打开 `/ask` → 问"玄武门之变跟靖难之役有何相似" → 看到流式回答 + 引用来源

### 邮件订阅完整步骤

1. **Resend**：`https://resend.com` → API Keys → `re_xxx`
2. **Upstash Redis**：`https://upstash.com` → Create Database → 选 **Redis**（不是 Vector）+ Global Edge
3. Vercel env：`RESEND_API_KEY` + `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` + `SUBSCRIBE_SECRET`（`openssl rand -hex 32` 生成）
4. （可选）`SUBSCRIBE_FROM_EMAIL` 改为你自己的域名（需 Resend 域名校验）

### Stripe 支付步骤

1. `https://dashboard.stripe.com` → 注册 → **开 Test mode**
2. Developers → API keys → **Reveal test key** → 拷贝 `sk_test_xxx`
3. Vercel env：`STRIPE_SECRET_KEY=sk_test_xxx`
4. Redeploy → `/unlock` 按钮可用 → 用测试卡 `4242 4242 4242 4242` + 任意未来日期 → 跳 `/unlock/success`

---

## 项目结构

```
history-tool/
├── app/                          # Next.js 14 App Router
│   ├── page.tsx                 # 首页(今日推荐 + trending + 朝代时间线)
│   ├── article/[slug]/          # 文章页(50 篇 SSG)
│   │   ├── page.tsx
│   │   └── opengraph-image.tsx  # per-article 1200×630 og 图(build 期预生成)
│   ├── archive/                 # IA 8 朝代目录
│   ├── figures/                 # 人物长卷(238 人物)
│   │   ├── page.tsx             # 列表
│   │   ├── [slug]/page.tsx      # 单人物详情(SSG 238 个)
│   │   └── graph/page.tsx       # 关系图谱(d3-force + react-flow)
│   ├── timeline/                # 朝代时间线(9 列横滚)
│   ├── ask/                     # AI 问典 RAG 聊天
│   ├── api/
│   │   ├── ask/route.ts         # SSE 流式
│   │   ├── card/[slug]/route.tsx# 分享卡片 PNG(Satori)
│   │   ├── checkout/            # Stripe 支付
│   │   ├── subscribe/           # 邮件订阅
│   │   └── ...
│   ├── sitemap.ts               # 主 sitemap(50 文章 + 238 人物)
│   ├── sitemap-articles.xml/    # Google News 风格子集
│   ├── robots.ts                # SEO robots
│   ├── opengraph-image.tsx      # 站点级 og 图
│   └── layout.tsx               # 全局布局
├── components/                   # 50+ React 组件
│   ├── ArticleCard.tsx          # 卡片(首页/列表)
│   ├── ArticleCover.tsx         # 朝代印章风封面(AI webp + SVG fallback)
│   ├── ArticleHero.tsx          # 文章页头(滚动视差)
│   ├── ArticleToc.tsx           # 右侧 ToC(IntersectionObserver scroll-spy)
│   ├── AudioPlayer.tsx          # TTS 播放器 + 段落同步
│   ├── AudioSyncController.tsx  # 跨组件段落高亮
│   ├── ArticleCompleteToast.tsx # 读完 90% 提示 + 分享按钮
│   ├── DiscoveryGrid.tsx        # 首页发现三栏
│   ├── TimelineView.tsx         # 时间线视图
│   ├── FigureGraph.tsx          # 人物图谱
│   ├── AskChat.tsx              # AI 聊天 UI
│   ├── ShareButtons.tsx         # 分享按钮组
│   ├── FavoriteButton.tsx       # 收藏(localStorage)
│   ├── ThemeToggle.tsx          # 暗色模式切换
│   └── ...
├── content/
│   ├── articles/                # 50 篇 markdown
│   └── classics/                # 资治通鉴原文 + keyFigures
├── lib/
│   ├── articles.ts              # 文章 IO + getRelatedArticles + getTrendingArticles
│   ├── dynasties.ts             # 9 朝代纯配置(client)
│   ├── dynasties.server.ts      # getDynastiesWithCount(server-only, 实时算 count)
│   ├── timeline.ts              # 时间线数据层
│   ├── figures.ts               # 238 人物聚合
│   ├── archive.ts               # IA 8 朝代组
│   ├── search.ts                # 搜索
│   ├── analytics.ts             # Vercel Analytics 埋点统一入口
│   ├── audio-timestamps.ts      # TTS 段落时间戳
│   ├── rag/                     # AI 问典
│   │   ├── config.ts            # OpenAI 兼容客户端
│   │   ├── embed.ts
│   │   ├── search.ts            # Upstash Vector 检索
│   │   └── chat.ts              # LLM 流式 + 强化 prompt
│   ├── store.ts                 # Upstash Redis 包装
│   ├── email.ts                 # Resend 邮件
│   └── ...
├── scripts/                      # 构建脚本
│   ├── build-article-data.mjs
│   ├── build-cover-manifest.mjs # prebuild:扫 public/covers 生成 lib/cover-slugs.ts
│   ├── build-embeddings.mjs     # 50 篇 → Upstash Vector
│   ├── generate-audios.mjs      # TTS 生成(三级重试: 原文/中性化/分段拼接)
│   ├── generate-timestamps.mjs  # TTS 段落时间戳
│   ├── regen-covers-v2.mjs      # AI 封面 v2 重生成
│   └── subset-font.mjs          # 中文字体子集化(给 Satori 用)
├── public/
│   ├── audios/                  # 49 篇 mp3 + timestamps
│   ├── covers/                  # 50 张 webp 封面
│   ├── icons/                   # PWA 图标
│   ├── fonts/                   # NotoSerifSC-subset.ttf
│   ├── manifest.json            # PWA manifest
│   └── sw.js                    # Service Worker
├── tailwind.config.ts
├── next.config.js
└── package.json
```

---

## 核心数据模型

### Article（content/articles/*.md frontmatter）

```yaml
---
slug: 09-anshi                 # URL slug(主键)
classicalSlug: 09-anshi         # 对应 classics/ 文件
title: 安史之乱:大唐盛世是怎么崩塌的
subtitle: 130 年盛世,8 个月崩塌
dynasty: 唐中期                 # 30 种 alias,见 lib/dynasties.ts
volume: 卷二百一十七
episode: 9                      # 序号 1-50(部分文章缺,fallback 用 slug 解析)
excerpt: 卡片副标题
classicalQuote: 古文引子
readingTime: 10                 # 分钟
views: 31000                    # 假种子数据,Vercel Analytics 1 周后覆盖
publishedAt: 2026-07-08         # ISO date
tags: [盛极而衰, 信任, 危机, ...]
coverScene: AI 封面 prompt
coverColor: cinnabar, gold, slate
coverMood: transformative, dawn-of-era
---
```

### Dynasty

- **9 个主朝代**：战国 / 秦汉 / 三国 / 两晋 / 南北朝 / 隋唐 / 宋 / 元 / 明清 / 现代
- **31 个 alias 映射**：`findDynasty(article.dynasty)` → Dynasty
- **count 实时算**：`getDynastiesWithCount()` 调 `getAllArticles()` 算

---

## 关键算法

### 1. Trending 推荐（首页"最热 3 篇"）

取代假 `views` 排序，纯 frontmatter metadata 算：

```ts
trending = 0.30 * recency + 0.40 * classic + 0.15 * density + 0.15 * brevity
// recency:  近 30 天线性衰减
// classic:  ep 越小分越高(通鉴开篇经典前置)
// density:  tag 数量 / 6 cap
// brevity:  8 min 短文 = 1, 12 min 长文 = 0
```

Vercel Analytics 1 周后回真 view 数据，可叠加 `log(1 + realViews)` 维度。

### 2. 相关推荐（文章页底部"相关解读"）

```ts
score = (同朝代 ? 3 : 0) + (共同 tag 数量 × 1)
归一化朝代(用 findDynasty().slug),避免 '战国' vs '战国中后期' 误判
```

### 3. 今日推荐（首页 Hero）

按 `dayOfYear % 50` 取模，slug 排序后选。同一日 SSR 稳定，CDN cache 友好。

---

## 13 个新功能（2026-07-12 截至）

| commit | 功能 |
|---|---|
| `34c76df` | TTS 脚本 `--slug` 单篇重跑 |
| `ff07f30` | 宋/元独立朝代 + 18 死 alias 清理 |
| `dfbeaec` | per-article 1200×630 og 图 + sitemap /timeline |
| `849f9fc` | LCP eager — 首屏图立即加载 |
| `2083b22` | 相关推荐 — 同朝代 + tag 重叠 |
| `90bcf1b` | 今日推荐按 day-of-year 轮换 |
| `2df879f` | trending 算法取代假 views |
| `0f6c11f` | Google News sitemap-articles.xml |
| `fae7899` | 读完 Toast 分享按钮 + hover 暂停 |
| `5c5eb05` | 404 推荐用 trending 算法 |
| `bd14915` | Ask prompt 强化 — 不知道就明说 |
| `49e1851` | Vercel Analytics 9 个事件埋点 |
| `9b4f823` | count 实时算 — 拆 client/server 边界 |

---

## 性能基线

- **首页 LCP**：~1.2s（hero 不含图，主要靠 earger cover）
- **文章页 LCP**：~1.5s（ArticleHero cover eager + fetchPriority=high）
- **build 时间**：~3 min（50 篇文章 + 50 张 og 图同时预生成）
- **公开 sitemap**：288 条 URL（50 文章 + 238 人物） + 50 条 Google News 子集
- **JS bundle（首页）**：~103 KB（gzip 前）
- **音频大小**：49 × ~5.5 MB = 270 MB（mp3 不进 git，Vercel 上传时打）

---

## 未来路线图

**M1（基础完整）— 已完成**：
- 50 篇内容 + AI 封面 + 人物图谱 + TTS + RAG + 移动端适配 + SEO + PWA + 暗色模式

**M2（数据驱动）— 1-2 周后**：
- Vercel Analytics 真 view 数据 → 替换 trending 算法的 views 维度
- 5 篇 TTS 完播率 → 扩到 50 篇
- 收藏数 + 分享来源 → 优化推送

**M3（产品化）— 1-2 月**：
- 用户系统（Supabase Auth）替代纯 localStorage
- 跨设备收藏同步
- 评论 / 点赞
- 真实 Lighthouse 跑分优化

**M4（分发）— 3-6 月**：
- 公众号引流
- 小程序版
- 多语言（英/日/韩）

---

## License

MIT
