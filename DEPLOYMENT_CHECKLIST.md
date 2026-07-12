# Deployment Checklist — 2026-07-13 凌晨

22 个新 commit 在 30 小时内推完，**今晚起床第一件事**是这份 check list。

## 1. Vercel Dashboard (最重要)

访问：https://vercel.com/dashboard

**22 个 deployment 状态**：
- 大部分应该 success（22 个连续 deploy，至少 18-20 个 success）
- 1-3 个 fail 正常 — 失败原因可能是：
  - build 缓存累积问题
  - 短时间连续 deploy 资源竞争
  - env var 没配（unlock / ask / subscribe）

**失败的** click → 看 build log → 如果是 fs/import 错 → 找最近 5 个 commit 看哪个破坏了

## 2. 实际功能验证（开 https://history-tool.vercel.app/）

| 路径 | 验证项 | 期望 |
|---|---|---|
| `/` | Hero 标题 | 应该是 `44-台儿庄:国军第一次对日的真正胜利`（day 193） |
| `/` | 9 朝代时间线 | 战国 6 / 秦汉 3 / 三国 1 / 两晋 1 / 南北朝 0 / 隋唐 4 / 宋 7 / 元 2 / 明清 16 / 现代 10（**南北朝 0 是真没有文章**） |
| `/` | trending top 3 | 04-围魏救赵 / 02-商鞅变法 / 05-完璧归赵 |
| `/favorites` | 第一次访问 | "还没收藏文章" 空态 + 推荐 3 篇（跟首页 trending 一致） |
| `/article/44-taierzhuang` | Hero cover | 朱红底 + 朝代印章风（应是 44 朝的元朝/明清边） |
| `/article/04-weizhao` | 听 TTS | 滚 90% 弹"已读完" Toast + 分享按钮 |
| `/article/04-weizhao` | 滚到底 | 文末"相关解读" 3 张卡片（应该是同朝代 + tag 重叠推荐） |
| `/article/04-weizhao` | 点"ToC" | 右侧 scroll-spy 高亮（桌面） |
| `/ask` | 空态 | 3 张预设问题卡片（玄武门/改革/曹操） |
| `/ask` | 键盘 | 移动端键盘右下角显示"发送" |
| `/timeline` | 横向滚 | 9 列朝代节点 |
| `/figures/graph` | 图谱 | 238 节点 + 576 边，能缩放拖拽 |
| 浏览器 tab | favicon | 应该是朱红印章 + "鉴"字（**新品牌 icon**） |
| 任何文章 | og:image | 1200×630 朝代印章风（朋友圈/微博/小红书分享） |
| 任何文章 | /api/card/[slug] | 1200×1200 朋友圈金句卡 |
| 任何 404 | 404 页 | "未寻" + 猜你想读 3 篇 trending |

## 3. Vercel Analytics 看板

URL: https://vercel.com/<team>/history-tool/analytics

**等 1 周后才有真数据**。但**现在**应该已经有 0 事件触发记录。

**17 个埋点**会出现在 Events tab：
- tts_play / tts_pause / tts_complete
- favorite_add / favorite_remove
- share_copy / share_weibo / share_twitter / share_native
- search_open / search_query / search_result_click
- subscribe_submit (5 个 result)
- ask_submit / ask_response_done
- fab_click (3 个 name)

**部署后 24 小时内**这些应该开始有 trigger。

## 4. GitHub Actions

URL: https://github.com/mishishi/history-tool/actions

**2 个 workflow job**：
- TypeScript Check (30s)
- Build (3-5min)

应该都 ✅。如果失败 → click 看哪个文件 tsc 不过。

## 5. sitemap 检查

- https://history-tool.vercel.app/sitemap.xml — 应该列 50 文章 + 238 人物 + 静态页
- https://history-tool.vercel.app/sitemap-articles.xml — Google News 风格 50 文章
- https://history-tool.vercel.app/robots.txt — 应该列 2 个 sitemap

**Google Search Console**（1 周后）：
- 提交 `/sitemap-articles.xml` 给 Google News
- 提交 `/sitemap.xml` 给主搜索

## 6. 已知 trade-off（**不修，知道就行**）

- **47-reform TTS 没生成**（"阶级斗争"内容审核拦）→ 文末会显示"音频加载失败"提示
- **南北朝 count=0**（content 里没有任何 dynasty="南北朝" 文章）→ 时间线节点空
- **views 数据是假**（手填 1200-12000）→ trending 算法已不用，但 `/favorites` 旧代码可能残留

## 7. 1 周后复盘

明早 7-13（周一）起来看 Vercel Analytics，**这些是有价值的数据**：

- 哪个 TTS 完播率最高 → 决定要不要扩到 50 篇
- 哪个 search query 最常搜 → 决定要不要加新文章/SEO 关键词
- 哪个 fab 没人用 → 决定要不要砍
- 哪个 ask 响应慢 → 决定 LLM 选型

**22 个 commit 是框架，1 周后数据决定下一步**。

## 8. 修 bug 路径

如果某个 commit 出问题：

1. Vercel Dashboard → 找 failed deployment → 看 build log
2. 哪个文件 tsc 不过 → git log 找引入的 commit
3. 回滚：`git revert <commit-hash>` （**不要** `git reset --hard`！）
4. 推新 commit 修复
5. Vercel 自动重 deploy

**Pre-commit hook 已经在 main checkout 装好**：
- 禁止 main 分支直接改
- tsc 不过拒绝 commit
- 但 worktree 用 `core.hooksPath` 是相对路径**可能不生效** —— 看 `git config core.hooksPath` 必须设绝对路径

## 9. 我下次重启的 session 起点

```bash
cd /Users/zhurenbao/Jason/ai-workspaces/history-tool
git status -sb
git log --oneline | head -5
ls .worktrees/polish
# 看 Vercel Dashboard
# 决定下一步
```

