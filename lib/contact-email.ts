export type EmailConfig = {
  CLOUDFLARE_EMAIL_ACCOUNT_ID?: string;
  CLOUDFLARE_EMAIL_API_TOKEN?: string;
  CONTACT_TO_EMAIL?: string;
  CONTACT_FROM_EMAIL?: string;
};
export type Inquiry = {
  id: string; name: string; company: string; email: string;
  phone: string; category: string; message: string;
};
export type NotificationStatus = 'not_configured' | 'accepted' | 'failed' | 'unknown';

export function emailConfigured(config: EmailConfig): boolean {
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return /^[a-f0-9]{32}$/i.test(config.CLOUDFLARE_EMAIL_ACCOUNT_ID || '')
    && Boolean(config.CLOUDFLARE_EMAIL_API_TOKEN?.trim())
    && email.test(config.CONTACT_TO_EMAIL || '')
    && email.test(config.CONTACT_FROM_EMAIL || '');
}

// Server only: never expose credentials or provider responses to clients or logs.
export async function sendInquiryNotification(
  config: EmailConfig, inquiry: Inquiry, fetcher: typeof fetch = fetch,
): Promise<NotificationStatus> {
  if (!emailConfigured(config)) {
    console.warn('Contact email notification is not configured');
    return 'not_configured';
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetcher(
      `https://api.cloudflare.com/client/v4/accounts/${config.CLOUDFLARE_EMAIL_ACCOUNT_ID}/email/sending/send`,
      {
        method: 'POST', redirect: 'error', signal: controller.signal,
        headers: {
          Authorization: `Bearer ${config.CLOUDFLARE_EMAIL_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: config.CONTACT_TO_EMAIL,
          from: config.CONTACT_FROM_EMAIL,
          reply_to: inquiry.email,
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
        }),
      },
    );
    if (!response.ok) {
      const errorPayload = await response.json().catch(() => null) as {
        errors?: Array<{code?: number}>;
      } | null;
      console.error('Contact email notification was rejected', {
        httpStatus: response.status,
        providerCode: errorPayload?.errors?.[0]?.code ?? null,
      });
      return 'failed';
    }
    const payload = await response.json() as {
      success?: boolean;
      result?: {delivered?: string[]; queued?: string[]; permanent_bounces?: string[]};
    };
    if (!payload.success) {
      console.error('Contact email notification returned an unsuccessful response');
      return 'failed';
    }
    const target = normalizeAddress(config.CONTACT_TO_EMAIL!);
    const matches = (items?: string[]) => Array.isArray(items)
      && items.some(item => typeof item === 'string' && normalizeAddress(item) === target);
    if (matches(payload.result?.permanent_bounces)) {
      console.error('Contact email notification permanently bounced');
      return 'failed';
    }
    if (matches(payload.result?.delivered) || matches(payload.result?.queued)) return 'accepted';
    const statuses = [
      ...(payload.result?.delivered || []),
      ...(payload.result?.queued || []),
      ...(payload.result?.permanent_bounces || []),
    ];
    return statuses.length === 0 ? 'accepted' : 'unknown';
  } catch (error) {
    // A timed-out request may already have been accepted; never retry automatically.
    console.error('Contact email notification request failed', {
      errorName: error instanceof Error ? error.name : 'unknown',
    });
    return 'unknown';
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeAddress(value: string): string {
  const trimmed = value.trim().toLowerCase();
  const match = trimmed.match(/<([^<>]+)>$/);
  return (match?.[1] || trimmed).trim();
}
