# Gmail AI Analyzer - 安装手册

## 📋 目录

1. [系统要求](#系统要求)
2. [获取Gemini API Key](#获取gemini-api-key)
3. [安装Chrome扩展](#安装chrome扩展)
4. [配置扩展](#配置扩展)
5. [验证安装](#验证安装)
6. [常见问题](#常见问题)

---

## 系统要求

### 必需条件

- ✅ Google Chrome 浏览器（版本 88 或更高）
- ✅ Gmail账号
- ✅ Gemini API Key（免费申请）

### 可选条件

- Chrome浏览器的开发者模式（用于加载未打包的扩展）
- 稳定的互联网连接

---

## 获取Gemini API Key

### 步骤1：访问Google AI Studio

1. 打开浏览器，访问 [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. 使用你的Google账号登录

### 步骤2：创建API Key

1. 点击页面上的 **"Create API Key"** 按钮
2. 选择一个Google Cloud项目（如果没有，会自动创建一个新项目）
3. 点击 **"Create API Key in new project"** 或选择现有项目
4. 等待几秒钟，API Key将会生成

### 步骤3：复制并保存API Key

1. 复制生成的API Key（格式类似：`AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`）
2. **重要**：妥善保存此API Key，不要分享给他人
3. 建议保存到密码管理器中

### API Key 使用限制

Gemini API有免费额度：
- **免费版**：每分钟15次请求，每天1500次请求
- 足够个人日常使用
- 如需更高额度，可升级到付费计划

---

## 安装Chrome扩展

### 方法1：从源码安装（推荐）

#### 步骤1：下载项目代码

**选项A：使用Git**
```bash
git clone https://github.com/chongyang1999/email_event.git
cd email_event/gmail-ai-analyzer
```

**选项B：下载ZIP**
1. 访问 [项目GitHub页面](https://github.com/chongyang1999/email_event)
2. 点击绿色的 **"Code"** 按钮
3. 选择 **"Download ZIP"**
4. 解压ZIP文件到任意目录
5. 进入 `email_event/gmail-ai-analyzer` 文件夹

#### 步骤2：打开Chrome扩展管理页面

1. 打开Chrome浏览器
2. 在地址栏输入：`chrome://extensions/`
3. 按回车进入扩展管理页面

#### 步骤3：启用开发者模式

1. 在扩展管理页面的右上角
2. 找到 **"开发者模式"** 开关
3. 点击开关，确保它是**启用**状态（蓝色）

#### 步骤4：加载扩展

1. 点击页面左上角的 **"加载已解压的扩展程序"** 按钮
2. 在弹出的文件选择对话框中，导航到 `gmail-ai-analyzer` 文件夹
3. 选择整个 `gmail-ai-analyzer` 文件夹（不是子文件夹）
4. 点击 **"选择文件夹"**

#### 步骤5：确认安装成功

安装成功后，你会看到：
- ✅ Gmail AI Analyzer 出现在扩展列表中
- ✅ 扩展图标（紫蓝色渐变信封图标）
- ✅ 状态显示为"已启用"

### 方法2：从Chrome Web Store安装（未来）

> 注意：当前版本为开发版，尚未发布到Chrome Web Store。
> 待项目完善后，将提供Web Store链接，届时只需一键安装。

---

## 配置扩展

### 首次配置

#### 步骤1：打开扩展设置

1. 点击Chrome工具栏上的扩展图标（拼图图标）
2. 找到 **Gmail AI Analyzer**
3. 点击它，弹出设置窗口

#### 步骤2：输入API Key

1. 在 **"Gemini API Key"** 输入框中粘贴你的API Key
2. 可以点击眼睛图标👁️来显示/隐藏API Key
3. API Key会安全地保存在浏览器本地存储中

#### 步骤3：选择AI模型（可选）

默认模型：**Gemini 2.5 Flash**（推荐）

其他可选模型：
- **Gemini 2.5 Flash Preview** - 最新预览版
- **Gemini 1.5 Flash** - 快速响应
- **Gemini 1.5 Pro** - 更强性能
- **Gemini 1.0 Pro** - 稳定版本

建议：
- 日常使用：选择 **Gemini 2.5 Flash**
- 需要更详细分析：选择 **Gemini 1.5 Pro**

#### 步骤4：保存配置

1. 点击 **"💾 保存配置"** 按钮
2. 看到 **"✓ 配置已保存"** 提示即成功

#### 步骤5：自定义提示词（可选）

在 **"分析提示词"** 文本框中：
- 留空：使用默认提示词（推荐新手）
- 自定义：输入你想要的分析维度

示例自定义提示：
```
请帮我分析这封邮件：
1. 用一句话总结
2. 提取所有人名和公司名
3. 找出需要我回复的问题
4. 判断是否紧急
```

---

## 验证安装

### 快速测试

#### 步骤1：打开Gmail

1. 访问 [https://mail.google.com](https://mail.google.com)
2. 登录你的Gmail账号
3. 打开任意一封邮件

#### 步骤2：启动分析

1. 点击Chrome工具栏上的 **Gmail AI Analyzer** 图标
2. 在弹出窗口中，点击 **"✨ 分析当前邮件"** 按钮
3. 等待几秒钟

#### 步骤3：查看结果

如果一切正常，你会看到：
- ✅ 状态显示"正在提取邮件内容..."
- ✅ 然后显示"正在使用AI分析邮件..."
- ✅ 最后显示"✓ 分析完成！"
- ✅ 结果区域显示分析结果

### 检查清单

| 检查项 | 状态 |
|--------|------|
| 扩展已安装并启用 | ☑️ |
| API Key已配置并保存 | ☑️ |
| 在Gmail页面可以看到扩展图标 | ☑️ |
| 点击图标可以打开popup | ☑️ |
| 能够成功分析一封邮件 | ☑️ |

---

## 常见问题

### Q1: 扩展安装后找不到图标

**解决方法**：
1. 点击Chrome工具栏右侧的拼图图标（扩展菜单）
2. 找到 Gmail AI Analyzer
3. 点击图钉图标📌将其固定到工具栏

### Q2: 显示"请先配置API Key"

**解决方法**：
1. 确认已经获取Gemini API Key
2. 点击扩展图标，输入API Key
3. 点击"保存配置"按钮
4. 刷新Gmail页面后重试

### Q3: 显示"请在Gmail页面使用此插件"

**解决方法**：
1. 确保你在 `https://mail.google.com` 域名下
2. 确保已经打开了一封邮件（不是收件箱列表页）
3. 刷新页面后重试

### Q4: 显示"无法提取邮件内容"

**可能原因**：
- Gmail页面还在加载中
- 邮件内容为空或格式特殊
- Gmail DOM结构更新导致选择器失效

**解决方法**：
1. 等待页面完全加载后重试
2. 尝试分析其他邮件
3. 刷新Gmail页面
4. 如果问题持续，请[提交Issue](https://github.com/chongyang1999/email_event/issues)

### Q5: API调用失败

**可能原因**：
- API Key无效或过期
- 超出免费额度限制
- 网络连接问题

**解决方法**：
1. 检查API Key是否正确
2. 访问[Google AI Studio](https://aistudio.google.com)检查额度
3. 检查网络连接
4. 查看Chrome控制台错误信息（F12 > Console）

### Q6: 分析结果不理想

**解决方法**：
1. 尝试更换AI模型（如使用Gemini 1.5 Pro）
2. 自定义提示词，明确你想要的分析角度
3. 对于长邮件，AI可能会截断，可以考虑分段分析

### Q7: 如何卸载扩展

**步骤**：
1. 访问 `chrome://extensions/`
2. 找到 Gmail AI Analyzer
3. 点击"移除"按钮
4. 确认删除

注意：卸载会清除所有保存的配置，包括API Key

---

## 🔒 隐私与安全

### 数据处理说明

- ✅ API Key仅存储在浏览器本地，不会上传到任何服务器
- ✅ 邮件内容仅发送至Google Gemini API进行分析
- ✅ 不会收集或存储你的邮件内容
- ✅ 所有通信使用HTTPS加密

### 权限说明

扩展请求的权限：
- `activeTab` - 读取当前Gmail标签页内容
- `storage` - 本地存储API Key和配置
- `scripting` - 在Gmail页面注入内容脚本
- `mail.google.com` - 仅在Gmail域名下工作

### 安全建议

1. **不要分享你的API Key**
2. **定期检查API使用情况**：访问[Google Cloud Console](https://console.cloud.google.com)
3. **如果API Key泄露**：立即在AI Studio中撤销并重新生成

---

## 📞 获取帮助

### 遇到问题？

1. **查看文档**：[使用教程](USER_GUIDE.md)
2. **提交Issue**：[GitHub Issues](https://github.com/chongyang1999/email_event/issues)
3. **查看示例**：项目包含详细的代码注释

### 反馈建议

欢迎通过以下方式反馈：
- GitHub Issues
- Pull Requests
- 项目讨论区

---

## ✅ 下一步

安装完成后，请查看：
- 📖 [使用教程](USER_GUIDE.md) - 详细的使用说明和技巧
- 🚀 [项目README](../README.md) - 项目概述和路线图

---

**祝使用愉快！ 🎉**

如有问题，请随时联系。
