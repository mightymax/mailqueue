import { error, fail, redirect } from '@sveltejs/kit';
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

export const load: PageServerLoad = async ({ params }) => {
  const [token, smtpServices] = await Promise.all([getTokenForEdit(params.id), listSmtpServices()]);
  if (!token) {
    error(404, 'Client not found');
  }

  return { token, smtpServices };
};

export const actions: Actions = {
  update: async ({ request, params }) => {
    const parsed = await parseTokenForm(request);
    if (!parsed.ok) {
      return fail(parsed.status, { error: parsed.error, values: parsed.values });
    }

    if (!(await smtpServiceExists(parsed.value.smtpServiceId))) {
      return fail(400, { error: 'Selected SMTP service does not exist', values: parsed.values });
    }

    await updateToken(params.id, parsed.value);
    redirect(303, `/tokens/${params.id}?saved=1`);
  },
  rotate: async ({ request, params }) => {
    const parsed = await parseTokenForm(request);
    if (!parsed.ok) {
      return fail(parsed.status, { error: parsed.error, values: parsed.values });
    }

    const createdToken = await rotateTokenSecret(params.id);
    return {
      success: true,
      message: 'Nieuwe bearer token gegenereerd',
      createdToken,
      values: parsed.values
    };
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
