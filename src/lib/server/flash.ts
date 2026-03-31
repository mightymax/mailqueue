import type { Cookies } from '@sveltejs/kit';

const FLASH_PREFIX = 'mq_flash_';
const FLASH_COOKIE_OPTIONS = {
  path: '/',
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: false,
  maxAge: 60
};

export function setFlash<T>(cookies: Cookies, key: string, value: T) {
  cookies.set(`${FLASH_PREFIX}${key}`, JSON.stringify(value), FLASH_COOKIE_OPTIONS);
}

export function consumeFlash<T>(cookies: Cookies, key: string): T | null {
  const cookieName = `${FLASH_PREFIX}${key}`;
  const raw = cookies.get(cookieName);
  if (!raw) return null;

  cookies.delete(cookieName, { path: '/' });

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
