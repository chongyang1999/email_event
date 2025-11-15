#!/usr/bin/env python3
"""
简单图标生成脚本
生成Gmail AI Analyzer所需的三个尺寸的PNG图标
"""

try:
    from PIL import Image, ImageDraw, ImageFont
    import os
except ImportError:
    print("❌ 需要安装Pillow库")
    print("请运行: pip install Pillow")
    exit(1)

def create_icon(size, output_path):
    """创建一个简单的图标"""
    # 创建带渐变背景的图像
    img = Image.new('RGB', (size, size), color='white')
    draw = ImageDraw.Draw(img)

    # 绘制渐变背景 (紫色到蓝色)
    for y in range(size):
        ratio = y / size
        r = int(102 + (118 - 102) * ratio)
        g = int(126 + (75 - 126) * ratio)
        b = int(234 + (162 - 234) * ratio)
        draw.line([(0, y), (size, y)], fill=(r, g, b))

    # 绘制邮件图标（简化版）
    # 信封外框
    envelope_margin = size // 5
    envelope_coords = [
        envelope_margin,
        envelope_margin,
        size - envelope_margin,
        size - envelope_margin
    ]
    draw.rectangle(envelope_coords, outline='white', width=max(1, size // 20))

    # 信封折线（三角形）
    mid_x = size // 2
    mid_y = size // 2
    triangle_coords = [
        (envelope_margin, envelope_margin),
        (mid_x, mid_y),
        (size - envelope_margin, envelope_margin)
    ]
    draw.line(triangle_coords, fill='white', width=max(1, size // 20))

    # AI标识（星星）
    star_size = size // 8
    star_x = size - envelope_margin - star_size
    star_y = envelope_margin + star_size
    draw.ellipse(
        [star_x - star_size, star_y - star_size, star_x + star_size, star_y + star_size],
        fill='#FFD700'
    )

    # 保存图标
    img.save(output_path, 'PNG')
    print(f"✓ 已生成: {output_path} ({size}x{size})")

def main():
    icons_dir = os.path.join(os.path.dirname(__file__), 'icons')

    # 确保icons目录存在
    os.makedirs(icons_dir, exist_ok=True)

    # 生成三个尺寸的图标
    sizes = [16, 48, 128]

    print("🎨 开始生成图标...")
    print()

    for size in sizes:
        output_path = os.path.join(icons_dir, f'icon{size}.png')
        create_icon(size, output_path)

    print()
    print("✅ 所有图标已生成完成！")
    print(f"📁 图标位置: {icons_dir}")

if __name__ == '__main__':
    main()
