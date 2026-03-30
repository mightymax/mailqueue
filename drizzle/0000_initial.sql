CREATE TABLE "api_tokens" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "website_url" text NOT NULL,
  "token_hash" text NOT NULL,
  "token_prefix" text NOT NULL,
  "mail_count" bigint DEFAULT 0 NOT NULL,
  "last_used_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "api_tokens_token_hash_unique" UNIQUE("token_hash")
);

CREATE TABLE "mail_queue" (
  "id" text PRIMARY KEY NOT NULL,
  "api_token_id" text,
  "status" text NOT NULL,
  "recipient" text NOT NULL,
  "subject" text NOT NULL,
  "text_body" text,
  "html_body" text,
  "from_email" text NOT NULL,
  "reply_to" text,
  "headers_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "max_attempts" integer DEFAULT 5 NOT NULL,
  "scheduled_at" timestamp with time zone DEFAULT now() NOT NULL,
  "locked_at" timestamp with time zone,
  "sent_at" timestamp with time zone,
  "failed_at" timestamp with time zone,
  "last_error" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "mail_queue"
  ADD CONSTRAINT "mail_queue_api_token_id_api_tokens_id_fk"
  FOREIGN KEY ("api_token_id") REFERENCES "public"."api_tokens"("id") ON DELETE set null ON UPDATE no action;

CREATE INDEX "mail_queue_status_idx" ON "mail_queue" USING btree ("status","scheduled_at","created_at");
CREATE INDEX "mail_queue_token_idx" ON "mail_queue" USING btree ("api_token_id","created_at");

ALTER TABLE "mail_queue"
  ADD CONSTRAINT "mail_queue_status_check"
  CHECK ("status" in ('queued', 'sending', 'sent', 'failed', 'cancelled'));

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS mail_queue_updated_at ON mail_queue;

CREATE TRIGGER mail_queue_updated_at
BEFORE UPDATE ON mail_queue
FOR EACH ROW
EXECUTE PROCEDURE set_updated_at();
