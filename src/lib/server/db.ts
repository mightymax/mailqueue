import postgres from 'postgres';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { getConfig } from './env.js';
import * as schema from './db/schema.js';

let client: ReturnType<typeof postgres> | null = null;
let db: PostgresJsDatabase<typeof schema> | null = null;

function getClient() {
  if (!client) {
    const config = getConfig();
    client = postgres(config.databaseUrl, {
      ssl: config.databaseSsl ? 'require' : undefined,
      max: 10,
      idle_timeout: 20
    });
  }

  return client;
}

export function getDb() {
  if (!db) {
    db = drizzle(getClient(), { schema });
  }

  return db;
}

export function getSql() {
  return getClient();
}

export async function closeDb() {
  if (client) {
    await client.end({ timeout: 5 });
    client = null;
    db = null;
  }
}
