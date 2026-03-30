import crypto from 'node:crypto';

const TOKEN_PREFIX_BYTES = 6;
const TOKEN_SECRET_BYTES = 24;
const IV_BYTES = 12;

function getEncryptionKey(key: string): Buffer {
  const decoded = Buffer.from(key, 'base64');
  if (decoded.length !== 32) {
    throw new Error('ENCRYPTION_KEY must decode to exactly 32 bytes');
  }
  return decoded;
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateApiToken() {
  const prefix = crypto.randomBytes(TOKEN_PREFIX_BYTES).toString('hex');
  const secret = crypto.randomBytes(TOKEN_SECRET_BYTES).toString('hex');
  const token = `mq_${prefix}_${secret}`;
  return {
    token,
    prefix: `mq_${prefix}`,
    hash: hashToken(token)
  };
}

export function basicAuthMatches(header: string | null, username: string, password: string): boolean {
  if (!header?.startsWith('Basic ')) return false;
  const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
  const separator = decoded.indexOf(':');
  if (separator === -1) return false;
  const providedUsername = decoded.slice(0, separator);
  const providedPassword = decoded.slice(separator + 1);
  return providedUsername === username && providedPassword === password;
}

export function encryptSecret(value: string, key: string): string {
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(key), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decryptSecret(value: string, key: string): string {
  const payload = Buffer.from(value, 'base64');
  const iv = payload.subarray(0, IV_BYTES);
  const tag = payload.subarray(IV_BYTES, IV_BYTES + 16);
  const encrypted = payload.subarray(IV_BYTES + 16);
  const decipher = crypto.createDecipheriv('aes-256-gcm', getEncryptionKey(key), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}
