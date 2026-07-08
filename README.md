# 读通鉴 · Du Tongjian

> 把资治通鉴讲成你听得懂、用得上的故事。

## 项目结构

```
history-tool/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # 全局布局
│   ├── page.tsx                 # 首页
│   ├── article/[slug]/page.tsx  # 文章详情(动态路由)
│   ├── unlock/page.tsx          # 付费解锁
│   └── globals.css              # 全局样式
├── components/                   # React 组件
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── ArticleCard.tsx
│   └── Seal.tsx
├── content/articles/             # Markdown 文章
│   ├── 01-zhishi-wang.md        # 三家分晋·智氏之亡
│   └── 02-shangyang.md          # 商鞅变法·徙木立信
├── lib/                          # 工具函数
│   ├── articles.ts
│   └── types.ts
├── content-pipeline/             # 内容生成流水线
│   ├── sources/                 # 原文素材
│   ├── output/                  # 生成结果
│   ├── generate.py              # 生成脚本(LLM API 跑)
│   └── README.md
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

1. 完善到 8 篇内容(已写 2 篇)
2. 接 Supabase Auth + 真实付费
3. 内容运营(公众号引流 + 微信支付转化)
4. SEO 优化 + 数据埋点

## 已上线的能力(2026-07 起)

| 类别 | 能力 | 状态 |
|------|------|------|
| 内容 | 50 篇深度解读 + 原文 + 关键人物 | ✅ |
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

参考 `.env.local.example`,本地开发也用同一份环境变量。