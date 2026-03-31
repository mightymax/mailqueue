import { error, redirect } from '@sveltejs/kit';
import { consumeFlash, setFlash } from '$lib/server/flash';
import {
  getTokenForEdit,
  listSmtpServices,
  rotateTokenSecret,
  smtpServiceExists,
  updateToken
} from '$lib/server/repositories';
import type { Actions, PageServerLoad } from './$types';

type ParsedTokenForm =
  | {
      ok: false;
      status: number;
      error: string;
      values: Record<string, string>;
    }
  | {
      ok: true;
      value: {
        name: string;
        websiteUrl: string;
        fromEmail: string;
        smtpServiceId: string;
      };
      values: Record<string, string>;
    };

type TokenFlash = {
  success?: boolean;
  message?: string;
  error?: string;
  values?: Record<string, string>;
  createdToken?: {
    token: string;
  };
};

export const load: PageServerLoad = async ({ params, cookies }) => {
  const [token, smtpServices] = await Promise.all([getTokenForEdit(params.id), listSmtpServices()]);
  if (!token) {
    error(404, 'Client not found');
  }

  return {
    token,
    smtpServices,
    flash: consumeFlash<TokenFlash>(cookies, `token-${params.id}`)
  };
};

export const actions: Actions = {
  update: async ({ request, params, cookies }) => {
    const parsed = await parseTokenForm(request);
    if (!parsed.ok) {
      setFlash(cookies, `token-${params.id}`, { error: parsed.error, values: parsed.values });
      redirect(303, `/tokens/${params.id}`);
    }

    if (!(await smtpServiceExists(parsed.value.smtpServiceId))) {
      setFlash(cookies, `token-${params.id}`, {
        error: 'Selected SMTP service does not exist',
        values: parsed.values
      });
      redirect(303, `/tokens/${params.id}`);
    }

    await updateToken(params.id, parsed.value);
    redirect(303, `/tokens/${params.id}?saved=1`);
  },
  rotate: async ({ request, params, cookies }) => {
    const parsed = await parseTokenForm(request);
    if (!parsed.ok) {
      setFlash(cookies, `token-${params.id}`, { error: parsed.error, values: parsed.values });
      redirect(303, `/tokens/${params.id}`);
    }

    const createdToken = await rotateTokenSecret(params.id);
    setFlash(cookies, `token-${params.id}`, {
      success: true,
      message: 'Nieuwe bearer token gegenereerd',
      createdToken,
      values: parsed.values
    });
    redirect(303, `/tokens/${params.id}`);
  }
};

async function parseTokenForm(request: Request): Promise<ParsedTokenForm> {
  const data = await request.formData();
  const name = data.get('name');
  const websiteUrl = data.get('websiteUrl');
  const fromEmail = data.get('fromEmail');
  const smtpServiceId = data.get('smtpServiceId');
  const values = {
    name: typeof name === 'string' ? name : '',
    websiteUrl: typeof websiteUrl === 'string' ? websiteUrl : '',
    fromEmail: typeof fromEmail === 'string' ? fromEmail : '',
    smtpServiceId: typeof smtpServiceId === 'string' ? smtpServiceId : ''
  };

  if (
    typeof name !== 'string' ||
    typeof websiteUrl !== 'string' ||
    typeof fromEmail !== 'string' ||
    typeof smtpServiceId !== 'string' ||
    !name ||
    !websiteUrl ||
    !fromEmail ||
    !smtpServiceId
  ) {
    return { ok: false, status: 400, error: 'Name, website URL, from email and SMTP service are required', values };
  }

  return {
    ok: true,
    value: {
      name: name.trim(),
      websiteUrl: websiteUrl.trim(),
      fromEmail: fromEmail.trim(),
      smtpServiceId: smtpServiceId.trim()
    },
    values
  };
}
