# 资治通鉴 AI 解读 · 内容流水线

> 把资治通鉴原文 → AI 解读稿 → 可发布内容

## 目录结构

```
content-pipeline/
├── sources/                  # 原始素材(古文 + 背景)
│   └── 01_zhishi_wang.md     # 第 1 篇:智氏之亡
├── output/                   # AI 生成结果
│   └── 01_zhishi_wang_解读.md
├── generate.py               # 生成脚本(核心工具)
└── README.md                 # 本文件
```

## 3 步跑出第一篇解读

### Step 1:申请 DeepSeek API Key(5 分钟)

1. 打开 https://platform.deepseek.com
2. 注册账号(手机号即可)
3. 进入"API Keys" → 创建新 key
4. **新用户默认送 ¥50 额度**,1k 预算完全够用
5. 复制 key(sk-xxx 开头)

### Step 2:安装依赖(1 分钟)

```bash
pip install openai
```

如果没装 pip:
```bash
python3 -m pip install openai
```

### Step 3:跑生成脚本(30 秒)

```bash
# 在 content-pipeline 目录下
export DEEPSEEK_API_KEY="sk-你刚才复制的key"
python3 generate.py --input sources/01_zhishi_wang.md
```

**输出**:`output/01_zhishi_wang_解读.md`

## 跑其他模型(可选)

### 通义千问 Max

```bash
export QWEN_API_KEY="sk-xxx"
python3 generate.py \
  --input sources/01_zhishi_wang.md \
  --model qwen-max \
  --base-url https://dashscope.aliyuncs.com/compatible-mode/v1 \
  --api-key-env QWEN_API_KEY
```

### OpenAI GPT-4o

```bash
export OPENAI_API_KEY="sk-xxx"
python3 generate.py \
  --input sources/01_zhishi_wang.md \
  --model gpt-4o \
  --base-url https://api.openai.com/v1 \
  --api-key-env OPENAI_API_KEY
```

## 调整 Prompt

Prompt 是核心资产,在 `generate.py` 顶部的两个常量:

- `SYSTEM_PROMPT`:角色设定 + 写作要求
- `USER_PROMPT_TEMPLATE`:结构 + 输入模板

每次跑出来的内容不满意,就改这两个。**改之前先备份**,改完跑 2-3 篇对比。

## 扩到 8 篇首批内容

我建议的 8 段首批解读(都按 `sources/XX_名字.md` 格式准备):

1. `01_zhishi_wang.md` 三家分晋 · 智氏之亡 ✓ 已有
2. `02_shangyang.md` 商鞅变法
3. `03_jingke.md` 荆轲刺秦
4. `04_hongmen.md` 鸿门宴
5. `05_xuanwu.md` 玄武门之变
6. `06_anshi.md` 安史之乱起点
7. `07_huangpao.md` 黄袍加身
8. `08_chairong.md` 后周世宗柴荣

每篇原文 200-500 字 + 背景说明,参考 `sources/01_zhishi_wang.md` 的格式。

## 成本控制

| 模型 | 价格(每 1M tokens) | 一篇成本 | 1k 预算能跑 |
|------|-------------------|----------|------------|
| DeepSeek-V3 | 1-2 元 | ~0.01 元 | ~50,000 篇 |
| 通义千问 Max | 20-40 元 | ~0.1 元 | ~5,000 篇 |
| GPT-4o | ~70 元 | ~0.4 元 | ~2,500 篇 |
| Claude 3.5 | ~70 元 | ~0.4 元 | ~2,500 篇 |

**推荐:DeepSeek-V3,中文质量够用,成本忽略不计**

## 调试技巧

1. **生成不满意?** 先改 `temperature`(0.7-0.85 区间试)
2. **古文引用不对?** 检查原文是不是有 OCR 错误,优先用中华书局/岳麓书社版本
3. **现代映射太生硬?** 在 SYSTEM_PROMPT 里加"避免直接套用公司/职场案例"
4. **内容太长/太短?** 改 `--max-tokens`,通常 3500-4500 是 2000 字的中文合理范围
5. **每次跑都不一样?** 固定 `temperature=0.7`,想要稳定输出就用 `0.5`

## 下一步

跑出第一篇后,我会帮你:
1. 校对内容质量(史实 + 风格)
2. 调整 prompt(基于跑出来的结果)
3. 把好的解读稿发到公众号,验证付费意愿
4. 如果数据好,启动产品开发(把 HTML 转 Next.js)

跑出来一篇后贴给我,我接着帮你调。