import { redirect } from '@sveltejs/kit';
import { consumeFlash, setFlash } from '$lib/server/flash';
import { createToken, listSmtpServices, listTokens, smtpServiceExists } from '$lib/server/repositories';
import type { Actions, PageServerLoad } from './$types';

type TokensFlash = {
  error?: string;
  values?: {
    name: string;
    websiteUrl: string;
    fromEmail: string;
    smtpServiceId: string;
  };
  createdToken?: {
    id: string;
    token: string;
    prefix: string;
  };
};

export const load: PageServerLoad = async ({ cookies }) => {
  return {
    tokens: await listTokens(),
    smtpServices: await listSmtpServices(),
    flash: consumeFlash<TokensFlash>(cookies, 'tokens')
  };
};

export const actions: Actions = {
  create: async ({ request, cookies }) => {
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
      setFlash(cookies, 'tokens', { error: 'Name, website URL, from email and SMTP service are required', values });
      redirect(303, '/tokens');
    }

    if (!(await smtpServiceExists(smtpServiceId))) {
      setFlash(cookies, 'tokens', { error: 'Selected SMTP service does not exist', values });
      redirect(303, '/tokens');
    }

    const created = await createToken(name.trim(), websiteUrl.trim(), smtpServiceId, fromEmail.trim());
    setFlash(cookies, 'tokens', {
      createdToken: created
    });
    redirect(303, '/tokens');
  }
};
