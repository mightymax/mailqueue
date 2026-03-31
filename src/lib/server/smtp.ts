import nodemailer from 'nodemailer';
import { getConfig } from './env.js';

export async function verifySmtpConnection(input: {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
}) {
  const config = getConfig();
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

  await transporter.verify();
}
