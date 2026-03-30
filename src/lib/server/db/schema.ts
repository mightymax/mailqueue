import { index, integer, jsonb, pgTable, text, timestamp, bigint } from 'drizzle-orm/pg-core';

export const smtpServices = pgTable('smtp_services', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  host: text('host').notNull(),
  port: integer('port').notNull(),
  secure: integer('secure').notNull().default(0),
  usernameEncrypted: text('username_encrypted').notNull(),
  passwordEncrypted: text('password_encrypted').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const apiTokens = pgTable('api_tokens', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  websiteUrl: text('website_url').notNull(),
  fromEmail: text('from_email'),
  smtpServiceId: text('smtp_service_id').references(() => smtpServices.id, { onDelete: 'restrict' }),
  tokenHash: text('token_hash').notNull().unique(),
  tokenPrefix: text('token_prefix').notNull(),
  mailCount: bigint('mail_count', { mode: 'number' }).notNull().default(0),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const mailQueue = pgTable(
  'mail_queue',
  {
    id: text('id').primaryKey(),
    apiTokenId: text('api_token_id').references(() => apiTokens.id, { onDelete: 'set null' }),
    status: text('status').notNull(),
    recipient: text('recipient').notNull(),
    subject: text('subject').notNull(),
    textBody: text('text_body'),
    htmlBody: text('html_body'),
    fromEmail: text('from_email').notNull(),
    replyTo: text('reply_to'),
    headersJson: jsonb('headers_json').$type<Record<string, string>>().notNull().default({}),
    attempts: integer('attempts').notNull().default(0),
    maxAttempts: integer('max_attempts').notNull().default(5),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull().defaultNow(),
    lockedAt: timestamp('locked_at', { withTimezone: true }),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    failedAt: timestamp('failed_at', { withTimezone: true }),
    lastError: text('last_error'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('mail_queue_status_idx').on(table.status, table.scheduledAt, table.createdAt),
    index('mail_queue_token_idx').on(table.apiTokenId, table.createdAt)
  ]
);
