import { error, json, type RequestHandler } from '@sveltejs/kit';
import { enqueueMail, findTokenByBearer, touchTokenUsage } from '$lib/server/repositories';
import { queueMailSchema } from '$lib/server/validators';

async function authenticate(request: Request): Promise<{ id: string; fromEmail: string | null } | null> {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  if (!token) return null;
  return findTokenByBearer(token);
}

export const POST: RequestHandler = async ({ request }) => {
  const token = await authenticate(request);
  if (!token) {
    error(401, 'Invalid or missing bearer token');
  }

  const raw = await request.json().catch(() => null);
  if (!raw) {
    error(400, 'Invalid JSON payload');
  }

  const parsed = queueMailSchema.safeParse(raw);
  if (!parsed.success) {
    error(400, parsed.error.issues.map((issue) => issue.message).join(', '));
  }

  const queued = await enqueueMail(token, parsed.data);
  await touchTokenUsage(token.id);

  return json(queued, { status: 202 });
};
