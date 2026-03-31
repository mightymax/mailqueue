import { error, redirect } from '@sveltejs/kit';
import { consumeFlash, setFlash } from '$lib/server/flash';
import { getSmtpServiceForEdit, updateSmtpService } from '$lib/server/repositories';
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

type SmtpFlash = {
  success?: boolean;
  stage?: 'test' | 'update';
  message?: string;
  error?: string;
  values?: Record<string, string>;
};

export const load: PageServerLoad = async ({ params, cookies }) => {
  const service = await getSmtpServiceForEdit(params.id);
  if (!service) {
    error(404, 'SMTP service not found');
  }

  return {
    service,
    flash: consumeFlash<SmtpFlash>(cookies, `smtp-service-${params.id}`)
  };
};

export const actions: Actions = {
  test: async ({ request, cookies, params }) => {
    const parsed = await parseSmtpForm(request);
    if (!parsed.ok) {
      setFlash(cookies, `smtp-service-${params.id}`, { error: parsed.error, stage: 'test', values: parsed.values });
      redirect(303, `/smtp-services/${params.id}`);
    }

    try {
      await verifySmtpConnection(parsed.value);
      setFlash(cookies, `smtp-service-${params.id}`, {
        success: true,
        stage: 'test',
        message: 'SMTP verbinding succesvol getest',
        values: parsed.values
      });
      redirect(303, `/smtp-services/${params.id}`);
    } catch (err) {
      setFlash(cookies, `smtp-service-${params.id}`, {
        error: err instanceof Error ? err.message : 'SMTP test failed',
        stage: 'test',
        values: parsed.values
      });
      redirect(303, `/smtp-services/${params.id}`);
    }
  },
  update: async ({ request, params, cookies }) => {
    const parsed = await parseSmtpForm(request);
    if (!parsed.ok) {
      setFlash(cookies, `smtp-service-${params.id}`, { error: parsed.error, stage: 'update', values: parsed.values });
      redirect(303, `/smtp-services/${params.id}`);
    }

    try {
      await verifySmtpConnection(parsed.value);
    } catch (err) {
      setFlash(cookies, `smtp-service-${params.id}`, {
        error: err instanceof Error ? err.message : 'SMTP test failed',
        stage: 'update',
        values: parsed.values
      });
      redirect(303, `/smtp-services/${params.id}`);
    }

    await updateSmtpService(params.id, parsed.value);
    redirect(303, `/smtp-services/${params.id}?saved=1`);
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
