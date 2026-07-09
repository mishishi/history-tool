#!/usr/bin/env python3
"""
资治通鉴 AI 解读生成器
========================

支持任何 OpenAI 兼容协议的 LLM API:
- DeepSeek-V3(推荐,中文好,便宜)
- 通义千问 Max
- OpenAI / Anthropic(改 base_url 即可)

用法:
  export DEEPSEEK_API_KEY="sk-xxx"
  python3 generate.py --input sources/01_zhishi_wang.md --output output/01_zhishi_wang.md

环境变量(必须):
  DEEPSEEK_API_KEY / QWEN_API_KEY / OPENAI_API_KEY

成本估算:
- 一篇 2000 字解读 ≈ 5000 tokens
- DeepSeek-V3 价格: 1-2 元 / 1M tokens
- 一篇解读成本 ≈ 0.01 元
- 1k 预算可以跑 5000+ 篇
"""
import argparse
import os
import sys
from datetime import datetime
from pathlib import Path

# ---------------------------------------------------------------------------
# Prompt 模板(可调,这是核心资产)
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """你是一位资深的资治通鉴解读人,擅长把古文讲成现代人爱看的故事。

你的读者是 30-45 岁的商业人士/历史爱好者,希望从历史中读出"人性"和"管理智慧"。

写作要求:
- 语气:理性但不冷,有立场但不偏激
- 不用"我们可以看到""这告诉我们"这种说教句式
- 不堆砌四字成语
- 现代映射不要生硬(不要"这就像公司里的 XX 部门")
- 重要人物出场时,第一次提及时简短交代身份
- 直接输出正文,不要加任何"以下是解读稿"之类的开场白
- 用 Markdown 格式,标题用 ## 或 ###,古文原文用引用块(>)
"""

USER_PROMPT_TEMPLATE = """请基于下面这段【原文】和【历史背景】,写一篇 2000 字左右的现代解读稿。

# 解读稿结构

1. **开篇钩子**(150 字):用一句反常识的话/一个悬念/一个现代类比,把读者拉进来
2. **背景速览**(200 字):这段历史发生在什么年代、什么背景,用白话说清
3. **故事深读**(1000 字):这是核心,要像写小说一样还原场景
   - 人物内心活动(基于史料合理推断)
   - 关键决策点的拆解
   - 至少 1 处反转/悬念/精彩细节
   - 关键古文原文嵌入文中,白话翻译紧跟其后
4. **现代映射**(300 字):从这段历史能读出什么对今天有用的东西
   - 优先选:管理决策/人性洞察/利益博弈/职场政治
   - 不要说教,要像老朋友聊天
5. **一句话收尾**(50 字):金句感,适合发朋友圈

---

【原文】:
{classical_text}

---

【历史背景】:
{background}
"""


def parse_source_file(path: Path) -> tuple[str, str]:
    """从 markdown 文件中提取原文和背景。"""
    content = path.read_text(encoding="utf-8")

    # 提取原文(## 原文 到 ## 历史背景 之间)
    classical = ""
    if "## 原文" in content and "## 历史背景" in content:
        classical = content.split("## 原文")[1].split("## 历史背景")[0].strip()
        # 去掉引用标记
        classical = classical.replace(">", "").strip()

    # 提取背景(## 历史背景 到 ## 关键人物 之间)
    background = ""
    if "## 历史背景" in content:
        bg_section = content.split("## 历史背景")[1]
        if "## 关键人物" in bg_section:
            bg_section = bg_section.split("## 关键人物")[0]
        background = bg_section.strip()
        # 去掉引用标记
        background = background.replace(">", "").strip()

    return classical, background


def main():
    parser = argparse.ArgumentParser(
        description="资治通鉴 AI 解读生成器",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--input", "-i",
        required=True,
        help="原始素材 markdown 文件路径(例如 sources/01_zhishi_wang.md)"
    )
    parser.add_argument(
        "--output", "-o",
        default=None,
        help="输出文件路径(默认输出到 output/ 目录)"
    )
    parser.add_argument(
        "--model",
        default="deepseek-chat",
        help="模型名(默认 deepseek-chat,通义用 qwen-max)"
    )
    parser.add_argument(
        "--base-url",
        default="https://api.deepseek.com",
        help="API base URL(DeepSeek/通义都兼容 OpenAI 协议)"
    )
    parser.add_argument(
        "--api-key-env",
        default="DEEPSEEK_API_KEY",
        help="API key 环境变量名"
    )
    parser.add_argument(
        "--max-tokens",
        type=int,
        default=4000,
        help="最大输出 tokens"
    )
    parser.add_argument(
        "--temperature",
        type=float,
        default=0.8,
        help="温度(0-1,越高越发散)"
    )

    args = parser.parse_args()

    # 检查 API key
    api_key = os.environ.get(args.api_key_env)
    if not api_key:
        print(f"❌ 错误:请先设置环境变量 {args.api_key_env}")
        print(f"   export {args.api_key_env}='sk-xxx'")
        sys.exit(1)

    # 读素材
    input_path = Path(args.input)
    if not input_path.exists():
        print(f"❌ 错误:输入文件不存在: {input_path}")
        sys.exit(1)

    classical_text, background = parse_source_file(input_path)
    if not classical_text:
        print("⚠️  警告:未能从文件中提取原文,请检查格式(需要 ## 原文 段落)")
        classical_text = input_path.read_text(encoding="utf-8")

    # 默认输出路径
    if args.output is None:
        output_dir = Path("output")
        output_dir.mkdir(exist_ok=True)
        stem = input_path.stem
        args.output = output_dir / f"{stem}_解读.md"

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # 拼 prompt
    user_prompt = USER_PROMPT_TEMPLATE.format(
        classical_text=classical_text,
        background=background or "(无)",
    )

    print(f"📖 素材:{input_path}")
    print(f"🤖 模型:{args.model}")
    print(f"📝 原文长度:{len(classical_text)} 字")
    print(f"⏳ 正在生成...\n")

    # 调用 API
    try:
        from openai import OpenAI
    except ImportError:
        print("❌ 错误:需要先安装 openai SDK")
        print("   pip install openai")
        sys.exit(1)

    client = OpenAI(api_key=api_key, base_url=args.base_url)

    response = client.chat.completions.create(
        model=args.model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        max_tokens=args.max_tokens,
        temperature=args.temperature,
    )

    content = response.choices[0].message.content
    usage = response.usage

    # 加个 meta header 到输出
    header = f"""<!-- 
AI 解读稿 · 由 generate.py 生成
生成时间:{datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
模型:{args.model}
输入 tokens:{usage.prompt_tokens}
输出 tokens:{usage.completion_tokens}
总 tokens:{usage.total_tokens}
成本估算:DeepSeek-V3 ≈ ¥{usage.total_tokens * 0.001 / 1000:.4f}
-->

"""

    output_path.write_text(header + content, encoding="utf-8")

    print(f"✅ 完成!输出到: {output_path}")
    print(f"   输入 tokens: {usage.prompt_tokens}")
    print(f"   输出 tokens: {usage.completion_tokens}")
    print(f"   总 tokens: {usage.total_tokens}")


if __name__ == "__main__":
    main()