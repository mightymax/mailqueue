import { fail } from '@sveltejs/kit';
import { createToken, listSmtpServices, listTokens, smtpServiceExists } from '$lib/server/repositories';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  return {
    tokens: await listTokens(),
    smtpServices: await listSmtpServices()
  };
};

export const actions: Actions = {
  create: async ({ request }) => {
    const data = await request.formData();
    const name = data.get('name');
    const websiteUrl = data.get('websiteUrl');
    const fromEmail = data.get('fromEmail');
    const smtpServiceId = data.get('smtpServiceId');

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
      return fail(400, { error: 'Name, website URL, from email and SMTP service are required' });
    }

    if (!(await smtpServiceExists(smtpServiceId))) {
      return fail(400, { error: 'Selected SMTP service does not exist' });
    }

    const created = await createToken(name.trim(), websiteUrl.trim(), smtpServiceId, fromEmail.trim());
    return {
      success: true,
      createdToken: created
    };
  }
};
