CREATE TABLE "smtp_services" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "host" text NOT NULL,
  "port" integer NOT NULL,
  "secure" integer DEFAULT 0 NOT NULL,
  "username_encrypted" text NOT NULL,
  "password_encrypted" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "api_tokens" ADD COLUMN "smtp_service_id" text;

ALTER TABLE "api_tokens"
  ADD CONSTRAINT "api_tokens_smtp_service_id_smtp_services_id_fk"
  FOREIGN KEY ("smtp_service_id") REFERENCES "public"."smtp_services"("id") ON DELETE restrict ON UPDATE no action;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS smtp_services_updated_at ON smtp_services;

CREATE TRIGGER smtp_services_updated_at
BEFORE UPDATE ON smtp_services
FOR EACH ROW
EXECUTE PROCEDURE set_updated_at();
