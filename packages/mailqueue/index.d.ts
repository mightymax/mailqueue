export type MailqueueFetch = typeof fetch;

export type SendMailOptions = {
  apiUrl?: string;
  token: string;
  endpoint?: string;
  timeoutMs?: number;
  fetch?: MailqueueFetch;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
  scheduledAt?: string;
  maxAttempts?: number;
  headers?: Record<string, string>;
};

export type SendMailResponse = unknown;

export function sendMail(options: SendMailOptions): Promise<SendMailResponse>;
