# 图标说明

由于这是MVP版本，暂时使用临时图标。你可以：

## 选项1：使用在线工具生成图标

访问以下网站生成简单的图标：
- https://www.favicon-generator.org/
- https://www.canva.com/

建议使用：
- 📧 邮件图标
- 🤖 AI/机器人图标
- ✨ 魔法棒图标

尺寸要求：
- icon16.png: 16x16 像素
- icon48.png: 48x48 像素
- icon128.png: 128x128 像素

## 选项2：使用Python脚本生成临时图标

运行以下命令（需要安装Pillow）：

```bash
cd gmail-ai-analyzer
python3 generate_icons.py
```

## 选项3：临时禁用图标

如果暂时不需要图标，可以：
1. 创建空白PNG文件
2. 或者注释掉manifest.json中的icons配置

注意：图标不影响功能，只影响显示效果。
