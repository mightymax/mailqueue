import { type RequestHandler } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';
import { getDb } from '#lib/server/db.js';

export const GET: RequestHandler = async () => {
  const db = getDb();
  await db.execute(sql`select 1`);
  return Response.json({ ok: true });
};
