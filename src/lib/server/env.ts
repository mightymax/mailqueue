import { env } from '$env/dynamic/private';

function requireEnv(name: string): string {
  const value = env[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}

function readBool(name: string, fallback: boolean): boolean {
  const value = env[name];
  if (value === undefined) return fallback;
  return value === 'true';
}

function readInt(name: string, fallback: number): number {
  const value = env[name];
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
    publicBaseUrl: env.PUBLIC_BASE_URL ?? '',
    appReplicas: readInt('APP_REPLICAS', 2)
  };

  return cachedConfig;
}
