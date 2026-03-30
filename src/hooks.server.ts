import type { Handle } from '@sveltejs/kit';
import { getConfig } from '$lib/server/env';
import { basicAuthMatches } from '$lib/server/security';

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

export function handleError({ error: err }) {
  console.error(err);
  return {
    message: 'Internal server error'
  };
}
