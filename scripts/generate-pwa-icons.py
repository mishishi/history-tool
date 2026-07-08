#!/usr/bin/env python3
"""生成 PWA icons — 朱红方块 + "鉴"字印章
参考 OG 图的印章设计,保持品牌一致。
"""
from PIL import Image, ImageDraw, ImageFont
import os

OUT = 'public/icons'
os.makedirs(OUT, exist_ok=True)

CINNABAR = (178, 58, 58)  # 朱红
PAPER = (245, 240, 232)    # 米色

def find_font(size: int) -> ImageFont.FreeTypeFont:
    """找一个能渲染中文的字体。"""
    candidates = [
        # macOS 系统字体
        '/System/Library/Fonts/PingFang.ttc',
        '/System/Library/Fonts/STHeiti Medium.ttc',
        '/System/Library/Fonts/STHeiti Light.ttc',
        '/System/Library/Fonts/Hiragino Sans GB.ttc',
        '/Library/Fonts/Songti.ttc',
        # 项目里的霞鹜文楷(从 npm 拉过)
        'public/fonts/NotoSerifSC-subset.ttf',
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()

def make_icon(size: int, filename: str, maskable: bool = False):
    img = Image.new('RGB', (size, size), CINNABAR)
    draw = ImageDraw.Draw(img)

    if maskable:
        # maskable icon 需要 80% 安全区(iOS/Android 启动画面会切圆)
        safe_zone = int(size * 0.4)  # 中央 20% 的"主区"被裁剪时仍可见
        # 居中画米色方块
        margin = (size - safe_zone * 2) // 2
        inner = safe_zone * 2
        draw.rectangle(
            [margin, margin, margin + inner, margin + inner],
            fill=PAPER
        )
        # 文字
        font = find_font(int(safe_zone * 1.2))
        text = '鉴'
        bbox = draw.textbbox((0, 0), text, font=font)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        x = (size - tw) // 2 - bbox[0]
        y = (size - th) // 2 - bbox[1]
        draw.text((x, y), text, fill=CINNABAR, font=font)
    else:
        # 标准 icon — 朱红背景 + 米色"鉴"字
        # 文字大小约占 60% 高度
        font_size = int(size * 0.6)
        font = find_font(font_size)
        text = '鉴'
        bbox = draw.textbbox((0, 0), text, font=font)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        x = (size - tw) // 2 - bbox[0]
        y = (size - th) // 2 - bbox[1]
        draw.text((x, y), text, fill=PAPER, font=font)

    out_path = os.path.join(OUT, filename)
    img.save(out_path, 'PNG', optimize=True)
    print(f'  ✓ {filename} ({size}x{size})')
    return out_path

print('Generating PWA icons:')
make_icon(192, 'icon-192.png')
make_icon(512, 'icon-512.png')
make_icon(512, 'icon-maskable-512.png', maskable=True)
# iOS apple-touch-icon(180x180,带圆角透明背景)
make_icon(180, 'apple-touch-icon.png')
# favicon
make_icon(32, 'favicon-32.png')
make_icon(16, 'favicon-16.png')
print(f'\n✓ All icons in {OUT}/')
