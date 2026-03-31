import nodemailer from 'nodemailer';
import { getConfig } from './env.js';

function maskUsername(username: string) {
  if (!username) return '<empty>';
  const [local = '', domain = ''] = username.split('@');
  const visibleLocal = local.slice(0, 2);
  const maskedLocal = `${visibleLocal}${'*'.repeat(Math.max(local.length - visibleLocal.length, 0))}`;
  return domain ? `${maskedLocal}@${domain}` : maskedLocal;
}

export async function verifySmtpConnection(input: {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
}) {
  const config = getConfig();
  const context = {
    host: input.host,
    port: input.port,
    secure: input.secure,
    username: maskUsername(input.username),
    connectionTimeoutMs: config.smtpConnectionTimeoutMs,
    greetingTimeoutMs: config.smtpGreetingTimeoutMs,
    socketTimeoutMs: config.smtpSocketTimeoutMs
  };

  console.log('[smtp] verify:start', context);

  const transporter = nodemailer.createTransport({
    host: input.host,
    port: input.port,
    secure: input.secure,
    connectionTimeout: config.smtpConnectionTimeoutMs,
    greetingTimeout: config.smtpGreetingTimeoutMs,
    socketTimeout: config.smtpSocketTimeoutMs,
    auth: {
      user: input.username,
      pass: input.password
    }
  });

  try {
    await transporter.verify();
    console.log('[smtp] verify:success', context);
  } catch (error) {
    console.error('[smtp] verify:error', {
      ...context,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}
