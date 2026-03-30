import { json, type RequestHandler } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';
import { getDb } from '$lib/server/db';

export const GET: RequestHandler = async () => {
  const db = getDb();
  await db.execute(sql`select 1`);
  return json({ ok: true });
};
