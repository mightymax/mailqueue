/// <reference types="node" />

import type { Transport, SendMailOptions, SentMessageInfo } from 'nodemailer';

export type MailqueueFetch = typeof fetch;

export type MailqueueTransportOptions = {
  apiUrl: string;
  token: string;
  endpoint?: string;
  timeoutMs?: number;
  fetch?: MailqueueFetch;
};

export type MailqueueMessageOptions = {
  scheduledAt?: string;
  maxAttempts?: number;
};

export type MailqueueSendMailOptions = SendMailOptions & {
  mailqueue?: MailqueueMessageOptions;
};

export type MailqueueSentMessageInfo = SentMessageInfo & {
  response?: unknown;
};

export function createMailqueueTransport(options: MailqueueTransportOptions): Transport<MailqueueSentMessageInfo, MailqueueSendMailOptions>;
