import type { Handle, HandleServerError } from '@sveltejs/kit/hooks';
import { getConfig } from '#lib/server/env.js';
import { basicAuthMatches } from '#lib/server/security.js';

const PUBLIC_PATHS = new Set(['/healthz']);

export const handle: Handle = async ({ event, resolve }) => {
  if (PUBLIC_PATHS.has(event.url.pathname)) {
    return resolve(event);
  }

  const isApi = event.url.pathname.startsWith('/api/v1/');
  if (!isApi) {
    const config = getConfig();
    const authorized = basicAuthMatches(
      event.request.headers.get('authorization'),
      config.adminUsername,
      config.adminPassword
    );

    if (!authorized) {
      return new Response('Authentication required', {
        status: 401,
        headers: {
          'www-authenticate': 'Basic realm="mailqueue-admin"'
        }
      });
    }

    event.locals.isAdmin = true;
  }

  return resolve(event);
};

export const handleError: HandleServerError = ({ error: err, kind }) => {
  // SvelteKit 3 also passes expected HTTP errors through this hook.
  if (kind !== 'unknown') return;
  console.error(err);
  return { message: 'Internal server error' };
};
