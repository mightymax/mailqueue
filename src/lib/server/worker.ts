import nodemailer from 'nodemailer';
import { eq, sql } from 'drizzle-orm';
import { getDb, getSql } from './db.js';
import { getConfig } from './env.js';
import { apiTokens, mailQueue, smtpServices } from './db/schema.js';
import { decryptSecret } from './security.js';

type ClaimedMail = {
  id: string;
  apiTokenId: string | null;
  smtpServiceId: string | null;
  smtpHost: string | null;
  smtpPort: number | null;
  smtpSecure: number | null;
  smtpUsernameEncrypted: string | null;
  smtpPasswordEncrypted: string | null;
  recipient: string;
  subject: string;
  textBody: string | null;
  htmlBody: string | null;
  fromEmail: string;
  replyTo: string | null;
  headersJson: Record<string, string>;
  attempts: number;
  maxAttempts: number;
};

type SendMailInfo = {
  accepted?: string[];
  rejected?: string[];
  pending?: string[];
  response?: string;
  messageId?: string;
};

type InspectableMail = {
  id: string;
  status: string;
  recipient: string;
  subject: string;
  attempts: number;
  maxAttempts: number;
  scheduledAt: string;
  lockedAt: string | null;
  lastError: string | null;
};

function logQueueEvent(event: string, mail: Pick<ClaimedMail, 'id' | 'recipient' | 'subject' | 'attempts' | 'maxAttempts'>, extra?: string) {
  const parts = [
    `[queue] ${event}`,
    `id=${mail.id}`,
    `to=${mail.recipient}`,
    `attempt=${mail.attempts}/${mail.maxAttempts}`,
    `subject=${JSON.stringify(mail.subject)}`
  ];

  if (extra) {
    parts.push(extra);
  }

  console.log(parts.join(' '));
}

function formatRecipientList(values: string[] | undefined) {
  if (!values || values.length === 0) return '-';
  return values.join(',');
}

function getBlockedReason(mail: InspectableMail, now: Date) {
  const scheduledAt = new Date(mail.scheduledAt);
  if (scheduledAt > now) {
    return `scheduled until=${scheduledAt.toISOString()}`;
  }

  if (mail.attempts >= mail.maxAttempts) {
    return 'max-attempts';
  }

  if (mail.lockedAt) {
    const lockedAt = new Date(mail.lockedAt);
    if (lockedAt.getTime() > now.getTime() - 15 * 60 * 1000) {
      return `locked since=${lockedAt.toISOString()}`;
    }
  }

  if (mail.status === 'sending') {
    return 'already-sending';
  }

  return 'not-claimable';
}

async function logBlockedQueueItems(limit: number) {
  const rows = await getSql().unsafe<InspectableMail[]>(
    `
    select
      id,
      status,
      recipient,
      subject,
      attempts,
      max_attempts as "maxAttempts",
      scheduled_at as "scheduledAt",
      locked_at as "lockedAt",
      last_error as "lastError"
    from mail_queue
    where status in ('queued', 'failed', 'sending')
    order by scheduled_at asc, created_at asc
    limit $1
    `,
    [limit]
  );

  const now = new Date();
  for (const mail of rows) {
    const reason = getBlockedReason(mail, now);
    console.log(
      [
        '[queue] blocked',
        `id=${mail.id}`,
        `status=${mail.status}`,
        `to=${mail.recipient}`,
        `attempt=${mail.attempts}/${mail.maxAttempts}`,
        `reason=${reason}`,
        `subject=${JSON.stringify(mail.subject)}`,
        mail.lastError ? `lastError=${JSON.stringify(mail.lastError)}` : null
      ]
        .filter(Boolean)
        .join(' ')
    );
  }
}

function getTransporter(mail: ClaimedMail) {
  const config = getConfig();
  if (
    !mail.smtpServiceId ||
    !mail.smtpHost ||
    !mail.smtpPort ||
    mail.smtpSecure === null ||
    !mail.smtpUsernameEncrypted ||
    !mail.smtpPasswordEncrypted
  ) {
    throw new Error('No SMTP service configured for this token');
  }

  return nodemailer.createTransport({
    host: mail.smtpHost,
    port: mail.smtpPort,
    secure: mail.smtpSecure === 1,
    connectionTimeout: config.smtpConnectionTimeoutMs,
    greetingTimeout: config.smtpGreetingTimeoutMs,
    socketTimeout: config.smtpSocketTimeoutMs,
    auth: {
      user: decryptSecret(mail.smtpUsernameEncrypted, config.encryptionKey),
      pass: decryptSecret(mail.smtpPasswordEncrypted, config.encryptionKey)
    }
  });
}

export async function claimQueuedMail(limit: number): Promise<ClaimedMail[]> {
  const sqlClient = getSql();
  return sqlClient.begin(async (tx) => {
    return tx.unsafe<ClaimedMail[]>(
      `
      with candidates as (
        select id, api_token_id
        from mail_queue
        where
          status in ('queued', 'failed')
          and scheduled_at <= now()
          and attempts < max_attempts
          and (locked_at is null or locked_at < now() - interval '15 minutes')
        order by scheduled_at asc, created_at asc
        limit $1
        for update skip locked
      )
      update mail_queue mq
      set
        status = 'sending',
        locked_at = now(),
        attempts = attempts + 1
      from candidates
      left join api_tokens ats on ats.id = candidates.api_token_id
      left join smtp_services ss on ss.id = ats.smtp_service_id
      where mq.id = candidates.id
      returning
        mq.id,
        mq.api_token_id as "apiTokenId",
        ats.smtp_service_id as "smtpServiceId",
        ss.host as "smtpHost",
        ss.port as "smtpPort",
        ss.secure as "smtpSecure",
        ss.username_encrypted as "smtpUsernameEncrypted",
        ss.password_encrypted as "smtpPasswordEncrypted",
        mq.recipient,
        mq.subject,
        mq.text_body as "textBody",
        mq.html_body as "htmlBody",
        mq.from_email as "fromEmail",
        mq.reply_to as "replyTo",
        mq.headers_json as "headersJson",
        mq.attempts,
        mq.max_attempts as "maxAttempts"
      `,
      [limit]
    );
  });
}

export async function markMailSent(id: string, apiTokenId: string | null) {
  const db = getDb();
  await db.transaction(async (tx) => {
    await tx
      .update(mailQueue)
      .set({
        status: 'sent',
        lockedAt: null,
        sentAt: new Date(),
        failedAt: null,
        lastError: null
      })
      .where(eq(mailQueue.id, id));

    if (apiTokenId) {
      await tx
        .update(apiTokens)
        .set({ mailCount: sql`${apiTokens.mailCount} + 1` as never })
        .where(eq(apiTokens.id, apiTokenId));
    }
  });
}

export async function markMailFailed(id: string, errorMessage: string) {
  const db = getDb();
  await db
    .update(mailQueue)
    .set({
      status: 'failed',
      lockedAt: null,
      failedAt: new Date(),
      lastError: errorMessage.slice(0, 4000)
    })
    .where(eq(mailQueue.id, id));
}

export async function deliverMailBatch(limit: number) {
  const claimed = await claimQueuedMail(limit);
  console.log(`[queue] claimed count=${claimed.length} limit=${limit}`);

  if (claimed.length === 0) {
    await logBlockedQueueItems(5);
  }

  for (const mail of claimed) {
    try {
      logQueueEvent('sending', mail);
      const transporter = getTransporter(mail);
      const info = (await transporter.sendMail({
        to: mail.recipient,
        from: mail.fromEmail,
        replyTo: mail.replyTo ?? undefined,
        subject: mail.subject,
        text: mail.textBody ?? undefined,
        html: mail.htmlBody ?? undefined,
        headers: mail.headersJson
      })) as SendMailInfo;

      const accepted = info.accepted ?? [];
      const rejected = info.rejected ?? [];
      const pending = info.pending ?? [];

      if (accepted.length === 0) {
        const details = [
          `response=${JSON.stringify(info.response ?? 'No SMTP response')}`,
          `rejected=${JSON.stringify(rejected)}`,
          `pending=${JSON.stringify(pending)}`
        ].join(' ');
        throw new Error(`SMTP accepted no recipients ${details}`);
      }

      await markMailSent(mail.id, mail.apiTokenId);
      logQueueEvent(
        'sent',
        mail,
        [
          `messageId=${JSON.stringify(info.messageId ?? '-')}`,
          `accepted=${formatRecipientList(accepted)}`,
          `rejected=${formatRecipientList(rejected)}`,
          `pending=${formatRecipientList(pending)}`,
          `response=${JSON.stringify(info.response ?? '-')}`
        ].join(' ')
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown SMTP error';
      await markMailFailed(mail.id, message);
      logQueueEvent('failed', mail, `error=${JSON.stringify(message)}`);
    }
  }

  return claimed.length;
}
