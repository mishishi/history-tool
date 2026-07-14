# generate-article.mjs · 端到端新文章生产 pipeline

> **目标**:一条命令从 `source.md` → `content/articles/{slug}.md` + cover prompt + TTS text
> 剩下 3 步(image_synthesize + synthesize_speech + publish + upload TCB)由 **agent 在 conversation 里**跑

## 1. 准备 source.md

参考 `content-pipeline/sources/01_zhishi_wang.md`:

```markdown
# 资治通鉴 · 卷X · 主题

> 一句话简介

## 原文
> 古文原文(资治通鉴原文 + 中华书局版)

## 历史背景
年代 + 背景 + 司马光为什么把它放这里

## 关键人物
- **人物名**:身份 + 关键动作
```

source 可以是:
- `content-pipeline/sources/XX-name.md`(已有 8 篇)
- 新建一个 `tmp/source-{slug}.md` 临时用

## 2. 跑 pipeline

```bash
# 必填 5 个参数
node scripts/generate-article.mjs \
  --slug 101-ming-rongmu \
  --episode 101 \
  --dynasty 明清 \
  --volume 卷二百五十三 \
  --title "1847年容闳赴美:中国第一个留学生"

# 选 1:从 source.md
  --source tmp/source-101-rongmu.md

# 选 2:用 --topic 让 LLM 自己编
  --topic "1847年容闳赴美留学,中国第一批 120 名幼童留美的故事"
```

`.env.local` 必须有:
```
LLM_API_KEY=sk-xxxxx
LLM_BASE_URL=https://api.deepseek.com
LLM_MODEL=deepseek-chat
```

## 3. 脚本会做

1. 调 LLM 生成 2000-3500 字解读稿
2. 自动生成 frontmatter(slug/episode/dynasty/volume/tags/coverScene/coverColor/coverMood/...)
3. 写到 `content/articles/{slug}.md`
4. 跑 `publish-cover.mjs build` 拿 cover prompt
5. 跑 `publish-audio.mjs build` 拿 TTS text
6. 把 prompt + TTS 写到 `tmp/{slug}-{cover-prompt,audio-text}.txt`
7. **打印下一步指令**(给 agent 跑)

## 4. Agent 跑剩余 3 步(在 conversation 里)

按脚本最后打印的步骤走,核心是 3 个 native tool + 1 个 commit:

```js
// 1. 生成 cover
image_synthesize({
  prompt: '...从 tmp/101-ming-rongmu-cover-prompt.txt 读...',
  output_file_path: 'tmp/cover-101-ming-rongmu-raw.jpg',
  aspect_ratio: '16:9',
  resolution: '1K',
})

// 2. publish cover(注意 worktree cwd 问题)
shell: cp /Users/zhurenbao/Jason/ai-workspaces/history-tool/tmp/cover-101-ming-rongmu-raw.jpg \
        /Users/zhurenbao/Jason/ai-workspaces/history-tool/.worktrees/polish/tmp/
shell: cd .worktrees/polish && node scripts/publish-cover.mjs publish 101-ming-rongmu

// 3. 生成 TTS
synthesize_speech({
  text: '...从 tmp/101-ming-rongmu-audio-text.txt 读...',
  output_file_path: 'tmp/audio-101-ming-rongmu-raw.mp3',
  voice_id: 'male-qn-qingse',
  speed: 0.95,
})

// 4. publish audio
shell: cp /main-checkout/tmp/audio-101-ming-rongmu-raw.mp3 /worktree/tmp/
shell: cd .worktrees/polish && node scripts/publish-audio.mjs publish 101-ming-rongmu

// 5. 上 TCB
shell: node scripts/upload-audio-tcb.mjs  # 100/100 已上,会全 skip
shell: node scripts/upload-cover-tcb.cjs   # 100/100 已上,会全 skip

// 6. commit + push
shell: cd .worktrees/polish
git add content/articles/101-ming-rongmu.md \
        public/covers/101-ming-rongmu.webp \
        public/audios/101-ming-rongmu.mp3 \
        lib/audio-timestamps/101-ming-rongmu.json
git commit -m "feat(content): #101 容闳赴美 + 封面 + TTS"
git push origin HEAD:main
```

## 5. 故障模式

| 现象 | 原因 | 修复 |
|---|---|---|
| `LLM_API_KEY 没设` | .env.local 缺 | 复制 .env.local.example 填 LLM_API_KEY |
| cover 提示 "找不到 tmp/cover-X-raw.jpg" | matrix image_synthesize 走 main checkout cwd | 跑完后 `cp` 到 worktree tmp |
| TTS 500 timeout | 文本 > 1500 字 | 改 article,buildTtsText 自动硬截 |
| 内容审核拦(敏感历史) | 矩阵 TTS 拦 | sanitize 措辞(`lib/tts-text.mjs` 的 `sanitizeForTts`) |
| TCB 上传 timeout | 一次性并发太高 | `upload-audio-tcb.mjs` 改 `CONCURRENCY=5` |
| YAML build 失败(76 历史踩过) | subtitle 末尾 `:` 触发 js-yaml 错 | 改用 `>-` 折行标量或末尾改成 `。` |

## 6. 完整时间(单篇)

| 步骤 | 时间 |
|---|---|
| LLM 生成(DeepSeek) | 30-60s |
| image_synthesize(cover) | 20-30s |
| publish-cover.mjs publish | 5s |
| synthesize_speech(TTS) | 10-20s |
| publish-audio.mjs publish | 5s |
| TCB upload(只新文件) | 0-30s |
| commit + push | 5s |
| **总计** | **~2 分钟/篇** |

vs 手动全手工 30 分钟/篇 = **效率提升 15×**。
