// Gmail AI Analyzer - Content Script
// 用于读取Gmail邮件内容

console.log('[Gmail AI Analyzer] Content script loaded');

/**
 * 从Gmail页面提取当前邮件内容
 * @returns {Object|null} 邮件数据对象或null
 */
function extractEmailContent() {
  try {
    // 检查是否在邮件查看页面
    const emailView = document.querySelector('[data-message-id]') ||
                      document.querySelector('.nH.if') ||
                      document.querySelector('.ii.gt');

    if (!emailView) {
      console.log('[Gmail AI Analyzer] Not in email view');
      return null;
    }

    // 提取主题
    const subject =
      document.querySelector('h2.hP')?.textContent?.trim() ||
      document.querySelector('[data-legacy-thread-id]')?.textContent?.trim() ||
      document.querySelector('.ha h2')?.textContent?.trim() ||
      'No subject';

    // 提取发件人
    const senderElement =
      document.querySelector('span.gD') ||
      document.querySelector('span[email]') ||
      document.querySelector('.go span');

    const senderEmail = senderElement?.getAttribute('email') ||
                       senderElement?.getAttribute('data-email') ||
                       senderElement?.textContent?.trim() ||
                       'Unknown sender';

    const senderName =
      document.querySelector('span.gD')?.getAttribute('name') ||
      document.querySelector('span[name]')?.getAttribute('name') ||
      senderElement?.textContent?.trim() ||
      '';

    // 提取收件人
    const recipientElement = document.querySelector('span.g2');
    const recipient = recipientElement?.textContent?.trim() || 'Unknown recipient';

    // 提取抄送
    const ccElements = document.querySelectorAll('span.g2 ~ span');
    const cc = Array.from(ccElements)
      .map(el => el.textContent?.trim())
      .filter(text => text && text.length > 0)
      .join(', ') || '';

    // 提取日期时间
    const dateElement =
      document.querySelector('span.g3') ||
      document.querySelector('[data-tooltip*="UTC"]') ||
      document.querySelector('.g3');

    const date = dateElement?.getAttribute('title') ||
                dateElement?.textContent?.trim() ||
                'Unknown date';

    // 提取邮件正文 - 尝试多个选择器
    let body = '';

    // 方法1: 标准邮件正文容器
    const bodyElement =
      document.querySelector('div.a3s.aiL') ||
      document.querySelector('div.ii.gt div[dir="ltr"]') ||
      document.querySelector('.ii.gt') ||
      document.querySelector('.gs .ii');

    if (bodyElement) {
      // 清理邮件正文，移除引用的邮件
      const bodyClone = bodyElement.cloneNode(true);

      // 移除Gmail的引用邮件部分
      bodyClone.querySelectorAll('.gmail_quote').forEach(el => el.remove());
      bodyClone.querySelectorAll('[class*="quoted"]').forEach(el => el.remove());

      body = bodyClone.innerText?.trim() || bodyClone.textContent?.trim() || '';
    }

    // 方法2: 备选方案
    if (!body) {
      const allTextDivs = document.querySelectorAll('.ii.gt div');
      for (const div of allTextDivs) {
        const text = div.innerText?.trim();
        if (text && text.length > 50) {
          body = text;
          break;
        }
      }
    }

    // 如果仍然没有正文，返回提示
    if (!body || body.length < 10) {
      body = 'Unable to extract email body content. Please try refreshing the page.';
    }

    // 提取附件信息（可选）
    const attachments = [];
    const attachmentElements = document.querySelectorAll('[download]');
    attachmentElements.forEach(att => {
      const name = att.getAttribute('download') || att.textContent?.trim();
      if (name) {
        attachments.push(name);
      }
    });

    const emailData = {
      subject,
      from: senderName ? `${senderName} <${senderEmail}>` : senderEmail,
      to: recipient,
      cc: cc || 'None',
      date,
      body,
      attachments: attachments.length > 0 ? attachments.join(', ') : 'None',
      extractedAt: new Date().toISOString(),
      url: window.location.href
    };

    console.log('[Gmail AI Analyzer] Email extracted:', {
      subject: emailData.subject,
      bodyLength: emailData.body.length,
      hasAttachments: attachments.length > 0
    });

    return emailData;

  } catch (error) {
    console.error('[Gmail AI Analyzer] Error extracting email:', error);
    return {
      error: true,
      message: `提取邮件内容时出错: ${error.message}`,
      details: error.stack
    };
  }
}

/**
 * 监听来自popup的消息请求
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Gmail AI Analyzer] Message received:', request);

  if (request.action === 'extractEmail') {
    const emailData = extractEmailContent();

    if (emailData) {
      sendResponse({ success: true, data: emailData });
    } else {
      sendResponse({
        success: false,
        error: '未能提取邮件内容。请确保您正在查看一封邮件。'
      });
    }

    return true; // 保持消息通道开放以支持异步响应
  }

  if (request.action === 'checkGmailPage') {
    const isGmail = window.location.hostname === 'mail.google.com';
    const hasEmail = !!document.querySelector('[data-message-id]');

    sendResponse({
      success: true,
      isGmail,
      hasEmail,
      url: window.location.href
    });

    return true;
  }
});

// 页面加载完成后的初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[Gmail AI Analyzer] DOM loaded, ready to extract emails');
  });
} else {
  console.log('[Gmail AI Analyzer] Ready to extract emails');
}
