# 📧 Gmail & Outlook AI Analyzer

> 一个轻量级的Chrome扩展，使用Google Gemini AI智能分析Gmail和Outlook邮件内容，提取关键信息，提升邮件处理效率。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome](https://img.shields.io/badge/Chrome-Extension-blue.svg)](https://www.google.com/chrome/)
[![Gemini](https://img.shields.io/badge/Powered%20by-Gemini%202.5%20Flash-purple.svg)](https://ai.google.dev/)

[English](#english-version) | 中文

---

## ✨ 特性

- 🚀 **一键分析**：点击即可分析当前Gmail或Outlook邮件
- 📮 **双平台支持**：同时支持Gmail和Outlook Web App
- 🤖 **AI驱动**：基于Google Gemini 2.5 Flash，分析准确快速
- 🎯 **智能提取**：自动提取邮件摘要、关键人物、时间点、行动项
- 🔒 **隐私安全**：数据仅在本地和Google API之间传输，不经过第三方服务器
- ⚡ **轻量高效**：MVP设计，20%时间解决80%问题
- 🎨 **用户友好**：简洁美观的界面，符合直觉的操作
- 🔧 **高度可定制**：支持自定义分析提示词和模型选择

---

## 🎬 快速开始

### 1. 获取Gemini API Key

访问 [Google AI Studio](https://aistudio.google.com/app/apikey) 免费获取API Key

### 2. 安装扩展

```bash
# 克隆项目
git clone https://github.com/chongyang1999/email_event.git
cd email_event/gmail-ai-analyzer

# 在Chrome中加载扩展
# 1. 打开 chrome://extensions/
# 2. 启用"开发者模式"
# 3. 点击"加载已解压的扩展程序"
# 4. 选择 gmail-ai-analyzer 文件夹
```

### 3. 配置并使用

1. 点击扩展图标
2. 输入你的API Key
3. 在Gmail或Outlook中打开任意邮件
4. 点击"分析邮件"按钮
5. 查看AI分析结果

详细步骤请查看 [安装手册](INSTALLATION.md)

---

## 📖 文档

- 📦 [安装手册](INSTALLATION.md) - 详细的安装步骤和配置说明
- 📚 [使用教程](USER_GUIDE.md) - 完整的使用指南和最佳实践
- 🐛 [Issue Tracker](https://github.com/chongyang1999/email_event/issues) - 报告问题和请求功能

---

## 🎯 核心功能

### 邮件智能分析

AI将自动提取以下信息：

| 分析维度 | 说明 | 示例 |
|---------|------|------|
| **邮件摘要** | 2-3句话概括邮件主要内容 | "通知下周一开会，需准备Q1业绩报告" |
| **关键人物** | 列出重要人物及其角色 | "张三（项目经理）、李四（财务总监）" |
| **重要时间** | 提取日期、截止时间等 | "会议：11月18日 10:00 AM" |
| **行动项** | 需要采取的行动和任务 | "1. 准备PPT 2. 提交数据..." |
| **优先级** | 评估邮件紧急程度 | "高 - 涉及高层会议且有明确截止时间" |

### 支持的AI模型

- **Gemini 2.5 Flash** ⭐ 推荐 - 最新模型，速度快质量高
- **Gemini 2.5 Flash Preview** - 体验最新功能
- **Gemini 1.5 Flash** - 快速响应
- **Gemini 1.5 Pro** - 深度分析复杂邮件
- **Gemini 1.0 Pro** - 稳定版本

### 自定义提示词

根据不同需求定制分析角度：

**极简模式**：
```
用3个要点总结这封邮件，每个要点不超过15个字。
```

**任务提取模式**：
```
只列出我需要做的事情、截止时间和优先级。
```

**商务分析模式**：
```
分析客户的核心诉求、潜在商机、需要跟进的事项。
```

---

## 🏗️ 技术架构

### 项目结构

```
gmail-ai-analyzer/
├── manifest.json          # Chrome扩展配置
├── popup/                 # 弹窗界面
│   ├── popup.html        # 界面结构
│   ├── popup.css         # 样式设计
│   └── popup.js          # 业务逻辑
├── content/              # 内容脚本
│   ├── gmail-reader.js   # Gmail页面内容提取
│   └── outlook-reader.js # Outlook页面内容提取
├── icons/                # 扩展图标
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── docs/                 # 文档
    ├── INSTALLATION.md
    └── USER_GUIDE.md
```

### 技术栈

- **前端**：原生JavaScript + CSS（无依赖）
- **API**：Google Gemini API
- **存储**：Chrome Storage API
- **权限**：最小化权限原则

### 数据流

```
Gmail页面
    ↓ (DOM提取)
Content Script
    ↓ (消息传递)
Popup Script
    ↓ (HTTP请求)
Gemini API
    ↓ (AI分析)
显示结果
```

---

## 🚀 路线图

### v1.0 - MVP ✅

- [x] 基础Gmail邮件内容提取
- [x] Gemini API集成
- [x] 单封邮件分析
- [x] 自定义提示词
- [x] 多模型支持
- [x] 结果复制功能

### v1.1 - 双平台支持 ✅ (当前版本)

- [x] **Outlook Web App支持** 🎉
- [x] 自动检测邮箱平台
- [x] 统一的分析体验
- [ ] 批量邮件分析
- [ ] 历史分析记录

### v1.2 - 增强版 (计划中)

- [ ] 分析结果导出（JSON/CSV）
- [ ] 侧边栏模式
- [ ] 快捷键支持
- [ ] 邮件智能分类
- [ ] 自动标签建议

### v1.3 - 智能版 (未来)

- [ ] 回复建议生成
- [ ] 邮件情感分析
- [ ] 统计仪表板
- [ ] 邮件优先级自动排序

### v2.0 - 生态版 (愿景)

- [ ] 移动端版本
- [ ] 团队协作功能
- [ ] Chrome Web Store发布
- [ ] 企业版功能
- [ ] 更多邮箱系统支持

---

## 🤝 贡献

欢迎贡献！无论是报告Bug、提出建议还是提交PR。

### 如何贡献

1. Fork项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

### 开发指南

```bash
# 克隆项目
git clone https://github.com/chongyang1999/email_event.git

# 进入扩展目录
cd email_event/gmail-ai-analyzer

# 生成图标（可选）
python3 generate_icons.py

# 在Chrome中加载扩展进行测试
# chrome://extensions/ -> 开发者模式 -> 加载已解压的扩展程序
```

---

## 📊 性能与成本

### API成本

使用Gemini API免费额度：
- **免费额度**：15次/分钟，1500次/天
- **单次分析成本**：约0.001美元（付费用户）
- **月度估算**：免费额度足够个人使用

### 性能指标

- **分析速度**：2-5秒/封邮件
- **准确率**：基于Gemini 2.5 Flash
- **资源占用**：<10MB内存

---

## 🔒 隐私与安全

### 数据处理

- ✅ API Key存储在浏览器本地（Chrome Storage）
- ✅ 邮件内容仅发送至Google Gemini API
- ✅ 不收集、存储或上传用户数据到第三方服务器
- ✅ 所有通信使用HTTPS加密

### 权限说明

| 权限 | 用途 | 是否必需 |
|------|------|---------|
| `activeTab` | 读取当前Gmail标签页 | ✅ 是 |
| `storage` | 保存API Key和配置 | ✅ 是 |
| `scripting` | 注入内容脚本 | ✅ 是 |
| `mail.google.com` | 访问Gmail页面 | ✅ 是 |

---

## ❓ FAQ

### Q: 为什么选择做成Chrome扩展而不是Web应用？

A: Chrome扩展可以直接集成到Gmail页面，无需上传邮件文件，用户体验更好，隐私性更强。

### Q: 支持其他邮箱吗（Outlook、QQ邮箱等）？

A: 当前版本仅支持Gmail。未来计划支持Outlook网页版。其他邮箱需求请提Issue。

### Q: API Key会被窃取吗？

A: API Key存储在浏览器本地，只有你的浏览器能访问。建议定期检查API使用情况。

### Q: 免费额度够用吗？

A: 对于个人用户，每天1500次请求通常足够。如果需要更多，可考虑付费计划。

### Q: 邮件内容会被保存吗？

A: 不会。邮件内容仅在分析时发送给Gemini API，不会保存在任何地方。

---

## 📜 许可证

本项目采用 [MIT License](../LICENSE) 许可证。

---

## 🙏 致谢

- [Google Gemini API](https://ai.google.dev/) - 提供强大的AI能力
- Chrome Extension 社区 - 提供丰富的开发资源
- 所有贡献者和用户

---

## 📞 联系方式

- **项目主页**：https://github.com/chongyang1999/email_event
- **Issue反馈**：https://github.com/chongyang1999/email_event/issues
- **讨论区**：GitHub Discussions

---

## 🌟 Star History

如果这个项目对你有帮助，请给一个⭐️！

---

<div align="center">

**Made with ❤️ for productivity**

[⬆ 回到顶部](#-gmail-ai-analyzer)

</div>

---

## English Version

### Gmail AI Analyzer

> A lightweight Chrome extension that uses Google Gemini AI to intelligently analyze Gmail content, extract key information, and boost email processing efficiency.

**Features:**
- One-click email analysis
- AI-powered by Gemini 2.5 Flash
- Privacy-focused (local storage only)
- Customizable prompts
- Multiple AI models support

**Quick Start:**
1. Get Gemini API Key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Load extension in Chrome
3. Configure API Key
4. Analyze emails in Gmail

**Documentation:**
- [Installation Guide](INSTALLATION.md)
- [User Guide](USER_GUIDE.md)

For detailed information, please refer to the Chinese documentation above.

---

**License:** MIT | **Author:** chongyang1999 | **Version:** 1.0.0
