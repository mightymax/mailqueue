import { fail, redirect } from '@sveltejs/kit';
import { createSmtpService, listSmtpServices } from '$lib/server/repositories';
import { verifySmtpConnection } from '$lib/server/smtp';
import type { Actions, PageServerLoad } from './$types';

type ParsedSmtpForm =
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
        host: string;
        port: number;
        secure: boolean;
        username: string;
        password: string;
      };
      values: Record<string, string>;
    };

export const load: PageServerLoad = async () => {
  return {
    services: await listSmtpServices()
  };
};

export const actions: Actions = {
  test: async ({ request }) => {
    const parsed = await parseSmtpForm(request);
    if (!parsed.ok) {
      return fail(parsed.status, { error: parsed.error, stage: 'test', values: parsed.values });
    }

    try {
      await verifySmtpConnection(parsed.value);
      return {
        success: true,
        stage: 'test',
        message: 'SMTP verbinding succesvol getest',
        values: parsed.values
      };
    } catch (error) {
      return fail(400, {
        error: error instanceof Error ? error.message : 'SMTP test failed',
        stage: 'test',
        values: parsed.values
      });
    }
  },
  create: async ({ request }) => {
    const parsed = await parseSmtpForm(request);
    if (!parsed.ok) {
      return fail(parsed.status, { error: parsed.error, stage: 'create', values: parsed.values });
    }

    try {
      await verifySmtpConnection(parsed.value);
    } catch (error) {
      return fail(400, {
        error: error instanceof Error ? error.message : 'SMTP test failed',
        stage: 'create',
        values: parsed.values
      });
    }

    const created = await createSmtpService({
      ...parsed.value
    });

    redirect(303, `/smtp-services/${created.id}?saved=1`);
  }
};

async function parseSmtpForm(request: Request): Promise<ParsedSmtpForm> {
  const data = await request.formData();
  const name = data.get('name');
  const host = data.get('host');
  const port = data.get('port');
  const secure = data.get('secure');
  const username = data.get('username');
  const password = data.get('password');
  const values = {
    name: typeof name === 'string' ? name : '',
    host: typeof host === 'string' ? host : '',
    port: typeof port === 'string' ? port : '587',
    secure: secure === 'on' ? 'on' : '',
    username: typeof username === 'string' ? username : '',
    password: typeof password === 'string' ? password : ''
  };

  if (
    typeof name !== 'string' ||
    typeof host !== 'string' ||
    typeof port !== 'string' ||
    typeof username !== 'string' ||
    typeof password !== 'string' ||
    !name ||
    !host ||
    !port ||
    !username ||
    !password
  ) {
    return { ok: false, status: 400, error: 'All SMTP fields are required', values };
  }

  const parsedPort = Number.parseInt(port, 10);
  if (Number.isNaN(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
    return { ok: false, status: 400, error: 'SMTP port must be between 1 and 65535', values };
  }

  return {
    ok: true,
    value: {
      name: name.trim(),
      host: host.trim(),
      port: parsedPort,
      secure: secure === 'on',
      username: username.trim(),
      password
    },
    values
  };
}
