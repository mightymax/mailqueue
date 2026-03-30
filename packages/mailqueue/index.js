const DEFAULT_API_URL = 'http://localhost:5173';
const DEFAULT_ENDPOINT = '/api/v1/messages';
const DEFAULT_TIMEOUT_MS = 10000;

export async function sendMail(options) {
  const config = normalizeOptions(options);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await config.fetch(`${config.apiUrl}${config.endpoint}`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${config.token}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify(config.payload),
      signal: controller.signal
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      const suffix = body ? `: ${body}` : '';
      throw new Error(`Mailqueue API request failed with ${response.status}${suffix}`);
    }

    return (await response.json().catch(() => null)) ?? { accepted: [config.payload.to] };
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(`Mailqueue API request timed out after ${config.timeoutMs}ms`);
    }

    throw asError(error);
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeOptions(options) {
  if (!options || typeof options !== 'object') {
    throw new TypeError('sendMail options are required');
  }

  const apiUrl = readApiUrl(options.apiUrl);
  const token = readRequiredString(options.token, 'token');
  const endpoint = typeof options.endpoint === 'string' && options.endpoint.trim() ? options.endpoint.trim() : DEFAULT_ENDPOINT;
  const timeoutMs = Number.isFinite(options.timeoutMs) && options.timeoutMs > 0 ? Number(options.timeoutMs) : DEFAULT_TIMEOUT_MS;
  const fetchImpl = typeof options.fetch === 'function' ? options.fetch : globalThis.fetch;

  if (typeof fetchImpl !== 'function') {
    throw new TypeError('sendMail requires fetch support');
  }

  const payload = {
    to: readEmail(options.to, 'to'),
    subject: readRequiredString(options.subject, 'subject'),
    text: readOptionalString(options.text, 'text'),
    html: readOptionalString(options.html, 'html'),
    replyTo: readOptionalEmail(options.replyTo, 'replyTo'),
    scheduledAt: readOptionalString(options.scheduledAt, 'scheduledAt'),
    maxAttempts: readOptionalInt(options.maxAttempts, 'maxAttempts', 1, 10),
    headers: readHeaders(options.headers)
  };

  if (!payload.text && !payload.html) {
    throw new Error('sendMail requires either text or html');
  }

  return {
    apiUrl,
    token,
    endpoint: endpoint.startsWith('/') ? endpoint : `/${endpoint}`,
    timeoutMs,
    fetch: fetchImpl,
    payload: stripUndefined(payload)
  };
}

function readApiUrl(value) {
  const envApiUrl = typeof process !== 'undefined' && typeof process.env?.MAILQUEUE_URL === 'string' ? process.env.MAILQUEUE_URL : '';
  const apiUrl = typeof value === 'string' && value.trim() ? value.trim() : envApiUrl.trim() || DEFAULT_API_URL;
  return apiUrl.replace(/\/+$/, '');
}

function readRequiredString(value, fieldName) {
  if (typeof value !== 'string') {
    throw new TypeError(`sendMail requires "${fieldName}" to be a string`);
  }

  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`sendMail requires "${fieldName}"`);
  }

  return trimmed;
}

function readOptionalString(value, fieldName) {
  if (value == null) return undefined;
  if (typeof value !== 'string') {
    throw new TypeError(`sendMail expects "${fieldName}" to be a string`);
  }

  const trimmed = value.trim();
  return trimmed || undefined;
}

function readOptionalInt(value, fieldName, min, max) {
  if (value == null) return undefined;
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new TypeError(`sendMail expects "${fieldName}" to be an integer between ${min} and ${max}`);
  }
  return value;
}

function readOptionalEmail(value, fieldName) {
  if (value == null) return undefined;
  return readEmail(value, fieldName);
}

function readEmail(value, fieldName) {
  if (typeof value !== 'string') {
    throw new TypeError(`sendMail requires "${fieldName}" to be a string email address`);
  }

  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`sendMail requires "${fieldName}"`);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    throw new Error(`Invalid "${fieldName}" email address`);
  }

  return trimmed;
}

function readHeaders(value) {
  if (value == null) return undefined;
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('sendMail expects "headers" to be an object');
  }

  const headers = {};

  for (const [key, headerValue] of Object.entries(value)) {
    if (typeof headerValue !== 'string') {
      throw new TypeError(`Header "${key}" must be a string`);
    }
    headers[key] = headerValue;
  }

  return Object.keys(headers).length > 0 ? headers : undefined;
}

function stripUndefined(value) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));
}

function asError(value) {
  if (value instanceof Error) return value;
  return new Error(typeof value === 'string' ? value : 'Unknown mailqueue error');
}
