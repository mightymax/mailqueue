import fs from 'node:fs';
import path from 'node:path';

function parseEnvFile(filePath: string): Record<string, string> {
  const parsed: Record<string, string> = {};
  if (!fs.existsSync(filePath)) return parsed;

  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    parsed[key] = value;
  }

  return parsed;
}

let cachedEnv: Record<string, string | undefined> | null = null;

function getEnv() {
  if (cachedEnv) return cachedEnv;

  const cwd = process.cwd();
  const baseEnv = parseEnvFile(path.join(cwd, '.env'));
  const envProfile = String(process.env.ENV || process.env.NODE_ENV || '').trim();
  const productionEnv =
    envProfile === 'production' ? parseEnvFile(path.join(cwd, '.env.production')) : {};

  cachedEnv = {
    ...baseEnv,
    ...productionEnv,
    ...process.env
  };

  return cachedEnv;
}

function requireEnv(name: string): string {
  const value = getEnv()[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}

function readBool(name: string, fallback: boolean): boolean {
  const value = getEnv()[name];
  if (value === undefined) return fallback;
  return value === 'true';
}

function readInt(name: string, fallback: number): number {
  const value = getEnv()[name];
  if (value === undefined) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid integer for ${name}`);
  }
  return parsed;
}

export type AppConfig = {
  adminUsername: string;
  adminPassword: string;
  databaseUrl: string;
  databaseSsl: boolean;
  encryptionKey: string;
  defaultFromEmail: string;
  smtpConnectionTimeoutMs: number;
  smtpGreetingTimeoutMs: number;
  smtpSocketTimeoutMs: number;
  workerBatchSize: number;
  workerPollIntervalMs: number;
  publicBaseUrl: string;
  appReplicas: number;
};

let cachedConfig: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  cachedConfig = {
    adminUsername: requireEnv('ADMIN_USERNAME'),
    adminPassword: requireEnv('ADMIN_PASSWORD'),
    databaseUrl: requireEnv('DATABASE_URL'),
    databaseSsl: readBool('DATABASE_SSL', false),
    encryptionKey: requireEnv('ENCRYPTION_KEY'),
    defaultFromEmail: requireEnv('DEFAULT_FROM_EMAIL'),
    smtpConnectionTimeoutMs: readInt('SMTP_CONNECTION_TIMEOUT_MS', 4000),
    smtpGreetingTimeoutMs: readInt('SMTP_GREETING_TIMEOUT_MS', 4000),
    smtpSocketTimeoutMs: readInt('SMTP_SOCKET_TIMEOUT_MS', 8000),
    workerBatchSize: readInt('WORKER_BATCH_SIZE', 20),
    workerPollIntervalMs: readInt('WORKER_POLL_INTERVAL_MS', 5000),
    publicBaseUrl: getEnv().PUBLIC_BASE_URL ?? '',
    appReplicas: readInt('APP_REPLICAS', 2)
  };

  return cachedConfig;
}
