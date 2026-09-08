export type EmailSender = {
  send(message: {
    to: string;
    from: string;
    replyTo?: string;
    subject: string;
    text: string;
  }): Promise<{messageId: string}>;
};

export type EmailConfig = {
  EMAIL?: EmailSender;
  CONTACT_TO_EMAIL?: string;
  CONTACT_FROM_EMAIL?: string;
};

export type Inquiry = {
  id: string; name: string; company: string; email: string;
  phone: string; category: string; message: string;
};
export type NotificationStatus = 'not_configured' | 'accepted' | 'failed';

export function emailConfigured(config: EmailConfig): boolean {
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return Boolean(config.EMAIL)
    && email.test(config.CONTACT_TO_EMAIL || '')
    && email.test(config.CONTACT_FROM_EMAIL || '');
}

// Sends through Cloudflare's native Worker binding. The configured binding limits
// the sender and recipient, so form input can never control delivery addresses.
export async function sendInquiryNotification(
  config: EmailConfig, inquiry: Inquiry,
): Promise<NotificationStatus> {
  if (!emailConfigured(config)) {
    console.warn('Contact email notification is not configured');
    return 'not_configured';
  }

  try {
    const result = await config.EMAIL!.send({
      to: config.CONTACT_TO_EMAIL!,
      from: config.CONTACT_FROM_EMAIL!,
      replyTo: inquiry.email,
      subject: `【グリーンホームコンサル】新しいご相談：${inquiry.category}`,
      text: [
        'ホームページからお問い合わせがありました。',
        `受付番号：${inquiry.id}`, '',
        `ご相談の分野：${inquiry.category}`,
        `お名前：${inquiry.name}`, `会社名：${inquiry.company || '記載なし'}`,
        `メールアドレス：${inquiry.email}`, `電話番号：${inquiry.phone || '記載なし'}`,
        '', 'ご相談内容：', inquiry.message, '',
        'このメールに返信すると、ご相談者のメールアドレスが宛先になります。',
      ].join('\n'),
    });
    console.info('Contact email notification accepted', {messageId: result.messageId});
    return 'accepted';
  } catch (error) {
    const details = error as {code?: unknown; message?: unknown};
    console.error('Contact email notification was rejected', {
      providerCode: typeof details.code === 'string' ? details.code : null,
      message: typeof details.message === 'string' ? details.message : null,
    });
    return 'failed';
  }
}
