// Gmail AI Analyzer - Outlook Web Content Script
// 用于读取Outlook Web邮件内容

console.log('[Gmail AI Analyzer] Outlook content script loaded');

/**
 * 从Outlook Web页面提取当前邮件内容
 * 支持 outlook.office.com 和 outlook.live.com
 * @returns {Object|null} 邮件数据对象或null
 */
function extractEmailContent() {
  try {
    // 检查是否在邮件阅读窗格
    const readingPane = document.querySelector('[role="region"][aria-label*="Reading pane"]') ||
                        document.querySelector('[role="main"]') ||
                        document.querySelector('.ReadingPaneContents');

    if (!readingPane) {
      console.log('[Gmail AI Analyzer] Not in email reading view');
      return null;
    }

    // 提取主题 - 尝试多个选择器
    const subject =
      document.querySelector('[role="heading"][aria-level="2"]')?.textContent?.trim() ||
      document.querySelector('.ReadingPaneContents [role="heading"]')?.textContent?.trim() ||
      document.querySelector('[data-testid="subject-header"]')?.textContent?.trim() ||
      document.querySelector('.ConversationTopic')?.textContent?.trim() ||
      document.querySelector('[aria-label*="Subject"]')?.textContent?.trim() ||
      'No subject';

    // 提取发件人信息
    const fromElement =
      document.querySelector('[aria-label*="From:"]') ||
      document.querySelector('[data-testid="from-recipient"]') ||
      document.querySelector('.FromRecipient') ||
      document.querySelector('[class*="PersonaCard"]');

    let senderEmail = 'Unknown sender';
    let senderName = '';

    if (fromElement) {
      // 尝试获取邮箱地址
      const emailMatch = fromElement.textContent?.match(/[\w\.-]+@[\w\.-]+\.\w+/);
      if (emailMatch) {
        senderEmail = emailMatch[0];
      }

      // 尝试获取发件人名称
      senderName = fromElement.querySelector('[title]')?.getAttribute('title') ||
                   fromElement.querySelector('[aria-label]')?.getAttribute('aria-label') ||
                   fromElement.textContent?.replace(/[<>]/g, '').trim() ||
                   '';

      // 清理名称（移除邮箱地址）
      if (senderName) {
        senderName = senderName.replace(/[\w\.-]+@[\w\.-]+\.\w+/, '').trim();
      }
    }

    // 提取收件人
    const toElement =
      document.querySelector('[aria-label*="To:"]') ||
      document.querySelector('[data-testid="to-recipients"]') ||
      document.querySelector('.ToRecipients');

    const recipient = toElement?.textContent?.trim() || 'Unknown recipient';

    // 提取抄送
    const ccElement =
      document.querySelector('[aria-label*="Cc:"]') ||
      document.querySelector('[data-testid="cc-recipients"]') ||
      document.querySelector('.CcRecipients');

    const cc = ccElement?.textContent?.trim() || '';

    // 提取日期时间
    const dateElement =
      document.querySelector('[aria-label*="Sent:"]') ||
      document.querySelector('[data-testid="message-date"]') ||
      document.querySelector('.MessageDate') ||
      document.querySelector('[class*="SentTime"]') ||
      document.querySelector('time');

    const date = dateElement?.getAttribute('datetime') ||
                dateElement?.getAttribute('title') ||
                dateElement?.textContent?.trim() ||
                'Unknown date';

    // 提取邮件正文 - 尝试多个选择器
    let body = '';

    // 方法1: 标准正文容器
    const bodyElement =
      document.querySelector('[role="document"]') ||
      document.querySelector('[data-testid="message-body"]') ||
      document.querySelector('.MessageBody') ||
      document.querySelector('[class*="ItemBody"]') ||
      document.querySelector('[class*="ReadMessageItem"]');

    if (bodyElement) {
      // 清理正文，移除引用的邮件和签名
      const bodyClone = bodyElement.cloneNode(true);

      // 移除Outlook的引用邮件部分
      bodyClone.querySelectorAll('[class*="QuotedText"]').forEach(el => el.remove());
      bodyClone.querySelectorAll('[class*="gmail_quote"]').forEach(el => el.remove());
      bodyClone.querySelectorAll('[data-quotedtext]').forEach(el => el.remove());
      bodyClone.querySelectorAll('blockquote').forEach(el => el.remove());

      // 移除常见的邮件签名
      bodyClone.querySelectorAll('[class*="Signature"]').forEach(el => el.remove());
      bodyClone.querySelectorAll('[id*="Signature"]').forEach(el => el.remove());

      body = bodyClone.innerText?.trim() || bodyClone.textContent?.trim() || '';
    }

    // 方法2: 如果上面的方法失败，尝试查找所有文本内容较多的div
    if (!body || body.length < 20) {
      const contentDivs = readingPane.querySelectorAll('div[dir]');
      for (const div of contentDivs) {
        const text = div.innerText?.trim();
        if (text && text.length > 50 && !text.includes('From:') && !text.includes('To:')) {
          body = text;
          break;
        }
      }
    }

    // 如果仍然没有正文，返回提示
    if (!body || body.length < 10) {
      body = 'Unable to extract email body content. The email might be in a format that is not yet supported, or the page is still loading.';
    }

    // 提取附件信息（可选）
    const attachments = [];
    const attachmentElements = document.querySelectorAll('[aria-label*="Attachment"]') ||
                               document.querySelectorAll('[data-testid="attachment"]') ||
                               document.querySelectorAll('.AttachmentName');

    attachmentElements.forEach(att => {
      const name = att.getAttribute('aria-label') ||
                   att.getAttribute('title') ||
                   att.textContent?.trim();
      if (name && !attachments.includes(name)) {
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
      url: window.location.href,
      source: 'Outlook Web'
    };

    console.log('[Gmail AI Analyzer] Outlook email extracted:', {
      subject: emailData.subject,
      bodyLength: emailData.body.length,
      hasAttachments: attachments.length > 0
    });

    return emailData;

  } catch (error) {
    console.error('[Gmail AI Analyzer] Error extracting Outlook email:', error);
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
  console.log('[Gmail AI Analyzer] Outlook message received:', request);

  if (request.action === 'extractEmail') {
    const emailData = extractEmailContent();

    if (emailData && !emailData.error) {
      sendResponse({ success: true, data: emailData });
    } else if (emailData && emailData.error) {
      sendResponse({
        success: false,
        error: emailData.message || '提取邮件时发生错误'
      });
    } else {
      sendResponse({
        success: false,
        error: '未能提取邮件内容。请确保您正在查看一封邮件。'
      });
    }

    return true; // 保持消息通道开放以支持异步响应
  }

  if (request.action === 'checkGmailPage') {
    // 对于Outlook，检查是否在正确的页面
    const isOutlook = window.location.hostname.includes('outlook.office.com') ||
                     window.location.hostname.includes('outlook.live.com');
    const hasEmail = !!document.querySelector('[role="region"][aria-label*="Reading pane"]') ||
                    !!document.querySelector('.ReadingPaneContents');

    sendResponse({
      success: true,
      isGmail: false,
      isOutlook: isOutlook,
      hasEmail,
      url: window.location.href
    });

    return true;
  }
});

// 页面加载完成后的初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[Gmail AI Analyzer] Outlook DOM loaded, ready to extract emails');
  });
} else {
  console.log('[Gmail AI Analyzer] Outlook ready to extract emails');
}
