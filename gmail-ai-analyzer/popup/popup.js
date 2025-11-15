// Gmail AI Analyzer - Popup Script
console.log('[Gmail AI Analyzer] Popup loaded');

// DOM元素
const elements = {
  apiKeyInput: document.getElementById('api-key'),
  toggleApiKeyBtn: document.getElementById('toggle-api-key'),
  modelSelect: document.getElementById('model-select'),
  saveConfigBtn: document.getElementById('save-config'),
  configStatus: document.getElementById('config-status'),

  promptInput: document.getElementById('prompt-input'),
  analyzeBtn: document.getElementById('analyze-btn'),
  analysisStatus: document.getElementById('analysis-status'),

  resultSection: document.getElementById('result-section'),
  resultContent: document.getElementById('result-content'),
  copyResultBtn: document.getElementById('copy-result'),
  newAnalysisBtn: document.getElementById('new-analysis')
};

// 默认提示词
const DEFAULT_PROMPT = `请分析这封邮件并提供以下信息：

1. **邮件摘要**：用2-3句话概括邮件的主要内容
2. **关键人物**：列出邮件中提到的重要人物及其角色
3. **重要时间点**：提取邮件中提到的日期、时间或截止日期
4. **行动项**：如果有需要采取的行动或任务，请列出
5. **优先级评估**：评估这封邮件的紧急程度（高/中/低）

请以清晰、结构化的格式输出结果。`;

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  await loadConfig();
  setupEventListeners();
});

/**
 * 加载保存的配置
 */
async function loadConfig() {
  try {
    const result = await chrome.storage.local.get(['apiKey', 'selectedModel', 'customPrompt']);

    if (result.apiKey) {
      elements.apiKeyInput.value = result.apiKey;
    }

    if (result.selectedModel) {
      elements.modelSelect.value = result.selectedModel;
    }

    if (result.customPrompt) {
      elements.promptInput.value = result.customPrompt;
    }

    console.log('[Config] Loaded:', { hasApiKey: !!result.apiKey, model: result.selectedModel });
  } catch (error) {
    console.error('[Config] Error loading:', error);
  }
}

/**
 * 保存配置
 */
async function saveConfig() {
  const apiKey = elements.apiKeyInput.value.trim();
  const selectedModel = elements.modelSelect.value;
  const customPrompt = elements.promptInput.value.trim();

  if (!apiKey) {
    showStatus(elements.configStatus, 'error', '请输入API Key');
    return;
  }

  try {
    await chrome.storage.local.set({
      apiKey,
      selectedModel,
      customPrompt
    });

    showStatus(elements.configStatus, 'success', '✓ 配置已保存');
    console.log('[Config] Saved successfully');
  } catch (error) {
    console.error('[Config] Error saving:', error);
    showStatus(elements.configStatus, 'error', '保存失败：' + error.message);
  }
}

/**
 * 设置事件监听器
 */
function setupEventListeners() {
  // 显示/隐藏API Key
  elements.toggleApiKeyBtn.addEventListener('click', () => {
    const input = elements.apiKeyInput;
    input.type = input.type === 'password' ? 'text' : 'password';
  });

  // 保存配置
  elements.saveConfigBtn.addEventListener('click', saveConfig);

  // 分析邮件
  elements.analyzeBtn.addEventListener('click', analyzeEmail);

  // 复制结果
  elements.copyResultBtn.addEventListener('click', copyResult);

  // 重新分析
  elements.newAnalysisBtn.addEventListener('click', () => {
    elements.resultSection.style.display = 'none';
    elements.analysisStatus.classList.remove('show');
  });

  // Enter键保存配置
  elements.apiKeyInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') saveConfig();
  });
}

/**
 * 分析邮件主函数
 */
async function analyzeEmail() {
  // 1. 验证配置
  const config = await chrome.storage.local.get(['apiKey', 'selectedModel']);

  if (!config.apiKey) {
    showStatus(elements.analysisStatus, 'error', '❌ 请先配置API Key');
    return;
  }

  // 2. 设置加载状态
  setAnalyzing(true);
  showStatus(elements.analysisStatus, 'info', '正在读取邮件内容...');

  try {
    // 3. 获取当前活动的标签页
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.url?.includes('mail.google.com')) {
      throw new Error('请在Gmail页面使用此插件');
    }

    // 4. 从content script提取邮件内容
    showStatus(elements.analysisStatus, 'info', '正在提取邮件内容...');

    const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractEmail' });

    if (!response || !response.success) {
      throw new Error(response?.error || '无法提取邮件内容，请确保已打开一封邮件');
    }

    const emailData = response.data;
    console.log('[Analysis] Email extracted:', emailData);

    // 5. 准备AI分析
    showStatus(elements.analysisStatus, 'info', '正在使用AI分析邮件...');

    const prompt = elements.promptInput.value.trim() || DEFAULT_PROMPT;
    const emailContent = formatEmailForAnalysis(emailData);

    // 6. 调用Gemini API
    const analysisResult = await callGeminiAPI(
      config.apiKey,
      config.selectedModel || 'gemini-2.5-flash',
      prompt,
      emailContent
    );

    // 7. 显示结果
    displayResult(analysisResult, emailData);
    showStatus(elements.analysisStatus, 'success', '✓ 分析完成！');

  } catch (error) {
    console.error('[Analysis] Error:', error);
    showStatus(elements.analysisStatus, 'error', '❌ ' + error.message);
  } finally {
    setAnalyzing(false);
  }
}

/**
 * 格式化邮件内容用于AI分析
 */
function formatEmailForAnalysis(emailData) {
  return `
【邮件信息】
主题：${emailData.subject}
发件人：${emailData.from}
收件人：${emailData.to}
抄送：${emailData.cc}
日期：${emailData.date}
附件：${emailData.attachments}

【邮件正文】
${emailData.body}
`.trim();
}

/**
 * 调用Gemini API
 */
async function callGeminiAPI(apiKey, model, prompt, emailContent) {
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [{
      parts: [{
        text: `${prompt}\n\n${emailContent}`
      }]
    }],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 2048,
      topP: 0.95,
      topK: 40
    },
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_NONE"
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_NONE"
      },
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold: "BLOCK_NONE"
      },
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_NONE"
      }
    ]
  };

  console.log('[API] Calling Gemini:', { model, promptLength: prompt.length });

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

    try {
      const errorData = await response.json();
      if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      }
    } catch (e) {
      // 忽略JSON解析错误
    }

    throw new Error(errorMessage);
  }

  const data = await response.json();
  console.log('[API] Response received:', data);

  // 提取AI生成的文本
  if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
    return data.candidates[0].content.parts[0].text;
  } else {
    throw new Error('API返回格式异常，无法提取分析结果');
  }
}

/**
 * 显示分析结果
 */
function displayResult(analysisResult, emailData) {
  elements.resultContent.innerHTML = '';

  // 创建结果显示
  const resultHTML = `
<div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e0e0e0;">
  <strong>📧 邮件主题：</strong>${escapeHtml(emailData.subject)}<br>
  <strong>📅 时间：</strong>${escapeHtml(emailData.date)}<br>
  <strong>👤 发件人：</strong>${escapeHtml(emailData.from)}
</div>
<div style="white-space: pre-wrap; line-height: 1.8;">
${escapeHtml(analysisResult)}
</div>
  `.trim();

  elements.resultContent.innerHTML = resultHTML;
  elements.resultSection.style.display = 'block';

  // 保存最后的分析结果
  lastAnalysisResult = {
    email: emailData,
    analysis: analysisResult,
    timestamp: new Date().toISOString()
  };
}

/**
 * 复制结果到剪贴板
 */
async function copyResult() {
  try {
    const text = elements.resultContent.innerText;
    await navigator.clipboard.writeText(text);

    const originalText = elements.copyResultBtn.textContent;
    elements.copyResultBtn.textContent = '✓ 已复制';

    setTimeout(() => {
      elements.copyResultBtn.textContent = originalText;
    }, 2000);

  } catch (error) {
    console.error('[Copy] Error:', error);
    alert('复制失败：' + error.message);
  }
}

/**
 * 设置分析按钮状态
 */
function setAnalyzing(isAnalyzing) {
  elements.analyzeBtn.disabled = isAnalyzing;

  const btnText = elements.analyzeBtn.querySelector('.btn-text');
  const spinner = elements.analyzeBtn.querySelector('.spinner');

  if (isAnalyzing) {
    btnText.style.display = 'none';
    spinner.style.display = 'inline-block';
  } else {
    btnText.style.display = 'inline';
    spinner.style.display = 'none';
  }
}

/**
 * 显示状态消息
 */
function showStatus(element, type, message) {
  element.className = `status-message ${type} show`;
  element.textContent = message;

  // 成功消息3秒后自动隐藏
  if (type === 'success') {
    setTimeout(() => {
      element.classList.remove('show');
    }, 3000);
  }
}

/**
 * HTML转义防止XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 保存最后一次分析结果（用于后续功能扩展）
let lastAnalysisResult = null;

// 导出供调试使用
window.gmailAnalyzer = {
  analyzeEmail,
  loadConfig,
  saveConfig,
  lastResult: () => lastAnalysisResult
};
