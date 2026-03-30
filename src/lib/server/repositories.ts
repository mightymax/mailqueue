import crypto from 'node:crypto';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import type { QueueMailInput } from '$lib/server/validators';
import { getDb } from '$lib/server/db';
import { getConfig } from '$lib/server/env';
import { apiTokens, mailQueue, smtpServices } from '$lib/server/db/schema';
import { decryptSecret, encryptSecret, generateApiToken, hashToken } from '$lib/server/security';

export type DashboardStats = {
  queued: number;
  processing: number;
  failed: number;
  sentToday: number;
  tokenCount: number;
  smtpServiceCount: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const db = getDb();
  const [row] = await db
    .select({
      queued: sql<number>`count(*) filter (where ${mailQueue.status} = 'queued')::int`,
      processing: sql<number>`count(*) filter (where ${mailQueue.status} = 'sending')::int`,
      failed: sql<number>`count(*) filter (where ${mailQueue.status} = 'failed')::int`,
      sentToday: sql<number>`count(*) filter (where ${mailQueue.status} = 'sent' and ${mailQueue.sentAt} >= date_trunc('day', now()))::int`,
      tokenCount: sql<number>`(select count(*)::int from ${apiTokens})`,
      smtpServiceCount: sql<number>`(select count(*)::int from ${smtpServices})`
    })
    .from(mailQueue);

  return row ?? { queued: 0, processing: 0, failed: 0, sentToday: 0, tokenCount: 0, smtpServiceCount: 0 };
}

export async function listQueue(limit = 100) {
  const db = getDb();
  return db
    .select({
      id: mailQueue.id,
      status: mailQueue.status,
      recipient: mailQueue.recipient,
      subject: mailQueue.subject,
      fromEmail: mailQueue.fromEmail,
      replyTo: mailQueue.replyTo,
      attempts: mailQueue.attempts,
      maxAttempts: mailQueue.maxAttempts,
      scheduledAt: mailQueue.scheduledAt,
      sentAt: mailQueue.sentAt,
      failedAt: mailQueue.failedAt,
      lastError: mailQueue.lastError,
      createdAt: mailQueue.createdAt,
      tokenName: apiTokens.name,
      tokenWebsite: apiTokens.websiteUrl,
      smtpServiceName: smtpServices.name
    })
    .from(mailQueue)
    .leftJoin(apiTokens, eq(apiTokens.id, mailQueue.apiTokenId))
    .leftJoin(smtpServices, eq(smtpServices.id, apiTokens.smtpServiceId))
    .orderBy(desc(mailQueue.createdAt))
    .limit(limit);
}

export async function listTokens() {
  const db = getDb();
  return db
    .select({
      id: apiTokens.id,
      name: apiTokens.name,
      websiteUrl: apiTokens.websiteUrl,
      fromEmail: apiTokens.fromEmail,
      smtpServiceId: apiTokens.smtpServiceId,
      tokenPrefix: apiTokens.tokenPrefix,
      mailCount: apiTokens.mailCount,
      lastUsedAt: apiTokens.lastUsedAt,
      createdAt: apiTokens.createdAt,
      smtpServiceName: smtpServices.name
    })
    .from(apiTokens)
    .leftJoin(smtpServices, eq(smtpServices.id, apiTokens.smtpServiceId))
    .orderBy(desc(apiTokens.createdAt));
}

export async function listSmtpServices() {
  const db = getDb();
  return db
    .select({
      id: smtpServices.id,
      name: smtpServices.name,
      host: smtpServices.host,
      port: smtpServices.port,
      secure: smtpServices.secure,
      createdAt: smtpServices.createdAt
    })
    .from(smtpServices)
    .orderBy(desc(smtpServices.createdAt));
}

export async function createSmtpService(input: {
  name: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
}) {
  const db = getDb();
  const config = getConfig();
  const id = crypto.randomUUID();

  await db.insert(smtpServices).values({
    id,
    name: input.name,
    host: input.host,
    port: input.port,
    secure: input.secure ? 1 : 0,
    usernameEncrypted: encryptSecret(input.username, config.encryptionKey),
    passwordEncrypted: encryptSecret(input.password, config.encryptionKey)
  });

  return { id };
}

export async function getSmtpServiceForEdit(id: string) {
  const db = getDb();
  const config = getConfig();
  const [row] = await db
    .select()
    .from(smtpServices)
    .where(eq(smtpServices.id, id))
    .limit(1);

  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    host: row.host,
    port: row.port,
    secure: row.secure === 1,
    username: decryptSecret(row.usernameEncrypted, config.encryptionKey),
    password: decryptSecret(row.passwordEncrypted, config.encryptionKey)
  };
}

export async function updateSmtpService(
  id: string,
  input: {
    name: string;
    host: string;
    port: number;
    secure: boolean;
    username: string;
    password: string;
  }
) {
  const db = getDb();
  const config = getConfig();

  await db
    .update(smtpServices)
    .set({
      name: input.name,
      host: input.host,
      port: input.port,
      secure: input.secure ? 1 : 0,
      usernameEncrypted: encryptSecret(input.username, config.encryptionKey),
      passwordEncrypted: encryptSecret(input.password, config.encryptionKey),
      updatedAt: new Date()
    })
    .where(eq(smtpServices.id, id));
}

export async function createToken(name: string, websiteUrl: string, smtpServiceId: string, fromEmail: string) {
  const db = getDb();
  const tokenId = crypto.randomUUID();
  const generated = generateApiToken();

  await db.insert(apiTokens).values({
    id: tokenId,
    name,
    websiteUrl,
    fromEmail,
    smtpServiceId,
    tokenHash: generated.hash,
    tokenPrefix: generated.prefix
  });

  return {
    id: tokenId,
    token: generated.token,
    prefix: generated.prefix
  };
}

export async function getTokenForEdit(id: string) {
  const db = getDb();
  const [row] = await db
    .select({
      id: apiTokens.id,
      name: apiTokens.name,
      websiteUrl: apiTokens.websiteUrl,
      fromEmail: apiTokens.fromEmail,
      smtpServiceId: apiTokens.smtpServiceId
    })
    .from(apiTokens)
    .where(eq(apiTokens.id, id))
    .limit(1);

  return row ?? null;
}

export async function getTokenById(id: string) {
  const db = getDb();
  const [row] = await db
    .select({
      id: apiTokens.id,
      name: apiTokens.name,
      fromEmail: apiTokens.fromEmail
    })
    .from(apiTokens)
    .where(eq(apiTokens.id, id))
    .limit(1);

  return row ?? null;
}

export async function updateToken(
  id: string,
  input: {
    name: string;
    websiteUrl: string;
    fromEmail: string;
    smtpServiceId: string;
  }
) {
  const db = getDb();
  await db
    .update(apiTokens)
    .set({
      name: input.name,
      websiteUrl: input.websiteUrl,
      fromEmail: input.fromEmail,
      smtpServiceId: input.smtpServiceId
    })
    .where(eq(apiTokens.id, id));
}

export async function rotateTokenSecret(id: string) {
  const db = getDb();
  const generated = generateApiToken();

  await db
    .update(apiTokens)
    .set({
      tokenHash: hashToken(generated.token),
      tokenPrefix: generated.prefix
    })
    .where(eq(apiTokens.id, id));

  return {
    token: generated.token,
    prefix: generated.prefix
  };
}

export async function findTokenByBearer(token: string) {
  const db = getDb();
  const [row] = await db
    .select({ id: apiTokens.id, name: apiTokens.name, fromEmail: apiTokens.fromEmail })
    .from(apiTokens)
    .where(eq(apiTokens.tokenHash, crypto.createHash('sha256').update(token).digest('hex')))
    .limit(1);
  return row ?? null;
}

export async function touchTokenUsage(tokenId: string) {
  const db = getDb();
  await db.update(apiTokens).set({ lastUsedAt: new Date() }).where(eq(apiTokens.id, tokenId));
}

export async function smtpServiceExists(id: string) {
  const db = getDb();
  const [row] = await db.select({ id: smtpServices.id }).from(smtpServices).where(eq(smtpServices.id, id)).limit(1);
  return Boolean(row);
}

export async function enqueueMail(token: { id: string; fromEmail: string | null }, input: QueueMailInput) {
  const db = getDb();
  const config = getConfig();
  const mailId = crypto.randomUUID();
  const scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : new Date();

  await db.insert(mailQueue).values({
    id: mailId,
    apiTokenId: token.id,
    status: 'queued',
    recipient: input.to,
    subject: input.subject,
    textBody: input.text ?? null,
    htmlBody: input.html ?? null,
    fromEmail: token.fromEmail ?? config.defaultFromEmail,
    replyTo: input.replyTo ?? null,
    headersJson: input.headers ?? {},
    maxAttempts: input.maxAttempts ?? 5,
    scheduledAt
  });

  return { id: mailId, status: 'queued' as const };
}

export async function retryQueueItem(id: string) {
  const db = getDb();
  await db
    .update(mailQueue)
    .set({
      status: 'queued',
      lockedAt: null,
      failedAt: null,
      lastError: null,
      scheduledAt: new Date()
    })
    .where(and(eq(mailQueue.id, id), inArray(mailQueue.status, ['failed', 'cancelled'])));
}

export async function cancelQueueItem(id: string) {
  const db = getDb();
  await db
    .update(mailQueue)
    .set({
      status: 'cancelled',
      lockedAt: null,
      failedAt: new Date()
    })
    .where(and(eq(mailQueue.id, id), inArray(mailQueue.status, ['queued', 'failed'])));
}
