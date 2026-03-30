import { fail, redirect } from '@sveltejs/kit';
import { enqueueMail, getTokenById, listTokens } from '$lib/server/repositories';
import type { Actions, PageServerLoad } from './$types';

type ParsedForm =
  | {
      ok: false;
      status: number;
      error: string;
      values: Record<string, string>;
    }
  | {
      ok: true;
      values: Record<string, string>;
      value: {
        tokenId: string;
        to: string;
        subject: string;
        text?: string;
        html?: string;
        replyTo?: string;
        scheduledAt?: string;
        maxAttempts?: number;
      };
    };

export const load: PageServerLoad = async ({ url }) => {
  return {
    tokens: await listTokens(),
    saved: url.searchParams.get('queued') === '1'
  };
};

export const actions: Actions = {
  create: async ({ request }) => {
    const parsed = await parseForm(request);
    if (!parsed.ok) {
      return fail(parsed.status, { error: parsed.error, values: parsed.values });
    }

    const token = await getTokenById(parsed.value.tokenId);
    if (!token) {
      return fail(400, { error: 'Selected client does not exist', values: parsed.values });
    }

    await enqueueMail(token, {
      to: parsed.value.to,
      subject: parsed.value.subject,
      text: parsed.value.text,
      html: parsed.value.html,
      replyTo: parsed.value.replyTo,
      scheduledAt: parsed.value.scheduledAt,
      maxAttempts: parsed.value.maxAttempts
    });

    redirect(303, '/test-email?queued=1');
  }
};

async function parseForm(request: Request): Promise<ParsedForm> {
  const data = await request.formData();
  const tokenId = data.get('tokenId');
  const to = data.get('to');
  const subject = data.get('subject');
  const text = data.get('text');
  const html = data.get('html');
  const replyTo = data.get('replyTo');
  const scheduledAt = data.get('scheduledAt');
  const maxAttempts = data.get('maxAttempts');

  const values = {
    tokenId: typeof tokenId === 'string' ? tokenId : '',
    to: typeof to === 'string' ? to : '',
    subject: typeof subject === 'string' ? subject : '',
    text: typeof text === 'string' ? text : '',
    html: typeof html === 'string' ? html : '',
    replyTo: typeof replyTo === 'string' ? replyTo : '',
    scheduledAt: typeof scheduledAt === 'string' ? scheduledAt : '',
    maxAttempts: typeof maxAttempts === 'string' ? maxAttempts : '5'
  };

  if (
    typeof tokenId !== 'string' ||
    typeof to !== 'string' ||
    typeof subject !== 'string' ||
    !tokenId ||
    !to ||
    !subject
  ) {
    return { ok: false, status: 400, error: 'Client, ontvanger en onderwerp zijn verplicht', values };
  }

  const trimmedText = typeof text === 'string' ? text.trim() : '';
  const trimmedHtml = typeof html === 'string' ? html.trim() : '';
  if (!trimmedText && !trimmedHtml) {
    return { ok: false, status: 400, error: 'Vul minimaal tekst of html in', values };
  }

  const parsedMaxAttempts =
    typeof maxAttempts === 'string' && maxAttempts
      ? Number.parseInt(maxAttempts, 10)
      : undefined;

  if (parsedMaxAttempts !== undefined && (Number.isNaN(parsedMaxAttempts) || parsedMaxAttempts < 1 || parsedMaxAttempts > 10)) {
    return { ok: false, status: 400, error: 'Max attempts moet tussen 1 en 10 liggen', values };
  }

  return {
    ok: true,
    values,
    value: {
      tokenId: tokenId.trim(),
      to: to.trim(),
      subject: subject.trim(),
      text: trimmedText || undefined,
      html: trimmedHtml || undefined,
      replyTo: typeof replyTo === 'string' && replyTo.trim() ? replyTo.trim() : undefined,
      scheduledAt: typeof scheduledAt === 'string' && scheduledAt.trim() ? scheduledAt.trim() : undefined,
      maxAttempts: parsedMaxAttempts
    }
  };
}
