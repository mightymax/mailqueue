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

for (const [key, value] of Object.entries(parseEnvFile(path.join(process.cwd(), '.env')))) {
  if (process.env[key] === undefined) process.env[key] = value;
}

const envProfile = String(process.env.ENV || process.env.NODE_ENV || '').trim();
if (envProfile === 'production') {
  for (const [key, value] of Object.entries(parseEnvFile(path.join(process.cwd(), '.env.production')))) {
    process.env[key] = value;
  }
}

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

function withSslMode(databaseUrl: string): string {
  if (process.env.DATABASE_SSL !== 'true') return databaseUrl;

  const url = new URL(databaseUrl);
  if (!url.searchParams.has('sslmode')) {
    url.searchParams.set('sslmode', 'require');
  }
  return url.toString();
}

export default {
  schema: './src/lib/server/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: withSslMode(process.env.DATABASE_URL)
  },
  verbose: true,
  strict: true
};
