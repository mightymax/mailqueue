const DEFAULT_ENDPOINT = '/api/v1/messages';
const DEFAULT_TIMEOUT_MS = 10000;

export function createMailqueueTransport(options) {
  const config = normalizeOptions(options);

  return {
    name: 'mailqueue-api',
    version: '1.0.0',
    async send(mail, done) {
      try {
        const payload = createPayload(mail);
        const response = await postMessage(config, payload);

        done(null, {
          envelope: mail.message.getEnvelope(),
          messageId: mail.message.messageId(),
          response
        });
      } catch (error) {
        done(asError(error));
      }
    }
  };
}

function normalizeOptions(options) {
  if (!options || typeof options !== 'object') {
    throw new TypeError('Mailqueue transport options are required');
  }

  const apiUrl = typeof options.apiUrl === 'string' ? options.apiUrl.trim() : '';
  const token = typeof options.token === 'string' ? options.token.trim() : '';
  const endpoint = typeof options.endpoint === 'string' && options.endpoint.trim() ? options.endpoint.trim() : DEFAULT_ENDPOINT;
  const timeoutMs = Number.isFinite(options.timeoutMs) && options.timeoutMs > 0 ? Number(options.timeoutMs) : DEFAULT_TIMEOUT_MS;
  const fetchImpl = typeof options.fetch === 'function' ? options.fetch : globalThis.fetch;

  if (!apiUrl) {
    throw new TypeError('Mailqueue transport requires an apiUrl');
  }

  if (!token) {
    throw new TypeError('Mailqueue transport requires a token');
  }

  if (typeof fetchImpl !== 'function') {
    throw new TypeError('Mailqueue transport requires fetch support');
  }

  return {
    apiUrl: apiUrl.replace(/\/+$/, ''),
    token,
    endpoint: endpoint.startsWith('/') ? endpoint : `/${endpoint}`,
    timeoutMs,
    fetch: fetchImpl
  };
}

function createPayload(mail) {
  const data = mail?.data ?? {};
  const custom = readMailqueueOptions(data.mailqueue);
  const payload = {
    to: readSingleAddress(data.to, 'to'),
    subject: readSubject(data.subject),
    text: readString(data.text),
    html: readString(data.html),
    replyTo: readOptionalAddress(data.replyTo, 'replyTo'),
    scheduledAt: custom.scheduledAt,
    maxAttempts: custom.maxAttempts,
    headers: readHeaders(data.headers)
  };

  if (!payload.text && !payload.html) {
    throw new Error('Mailqueue transport requires either text or html content');
  }

  rejectUnsupported(data);

  return stripUndefined(payload);
}

function readMailqueueOptions(value) {
  if (value == null) return {};
  if (typeof value !== 'object') {
    throw new TypeError('mail.data.mailqueue must be an object');
  }

  const options = {};

  if (value.scheduledAt != null) {
    const scheduledAt = typeof value.scheduledAt === 'string' ? value.scheduledAt.trim() : '';
    if (!scheduledAt) {
      throw new TypeError('mail.data.mailqueue.scheduledAt must be a non-empty ISO datetime string');
    }
    options.scheduledAt = scheduledAt;
  }

  if (value.maxAttempts != null) {
    if (!Number.isInteger(value.maxAttempts) || value.maxAttempts < 1 || value.maxAttempts > 10) {
      throw new TypeError('mail.data.mailqueue.maxAttempts must be an integer between 1 and 10');
    }
    options.maxAttempts = value.maxAttempts;
  }

  return options;
}

function readSubject(value) {
  const subject = readString(value);
  if (!subject) {
    throw new Error('Mailqueue transport requires a subject');
  }
  return subject;
}

function readString(value) {
  if (value == null) return undefined;
  if (typeof value !== 'string') {
    throw new TypeError('Expected a string value');
  }

  const trimmed = value.trim();
  return trimmed || undefined;
}

function readOptionalAddress(value, fieldName) {
  if (value == null) return undefined;
  return readSingleAddress(value, fieldName);
}

function readSingleAddress(value, fieldName) {
  if (Array.isArray(value)) {
    if (value.length !== 1) {
      throw new Error(`Mailqueue transport only supports a single ${fieldName} recipient`);
    }
    return readSingleAddress(value[0], fieldName);
  }

  if (typeof value === 'string') {
    const parsed = extractEmail(value);
    if (!parsed) {
      throw new Error(`Invalid ${fieldName} email address`);
    }
    return parsed;
  }

  if (value && typeof value === 'object' && typeof value.address === 'string') {
    const parsed = extractEmail(value.address);
    if (!parsed) {
      throw new Error(`Invalid ${fieldName} email address`);
    }
    return parsed;
  }

  throw new TypeError(`Mailqueue transport requires ${fieldName} to be a string, address object, or single-item array`);
}

function extractEmail(value) {
  const input = value.trim();
  if (!input) return null;
  if (input.includes(',')) {
    throw new Error('Mailqueue transport does not support multiple addresses in a single field');
  }

  const bracketMatch = input.match(/<([^<>]+)>$/);
  const email = bracketMatch ? bracketMatch[1].trim() : input;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

function readHeaders(value) {
  if (value == null) return undefined;
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('Mailqueue transport expects headers to be an object');
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

function rejectUnsupported(data) {
  const unsupportedFields = ['cc', 'bcc', 'attachments', 'alternatives', 'amp', 'icalEvent'];

  for (const field of unsupportedFields) {
    const value = data[field];
    if (Array.isArray(value) && value.length > 0) {
      throw new Error(`Mailqueue transport does not support "${field}" yet`);
    }
    if (!Array.isArray(value) && value != null) {
      throw new Error(`Mailqueue transport does not support "${field}" yet`);
    }
  }
}

async function postMessage(config, payload) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await config.fetch(`${config.apiUrl}${config.endpoint}`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${config.token}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      const suffix = body ? `: ${body}` : '';
      throw new Error(`Mailqueue API request failed with ${response.status}${suffix}`);
    }

    const result = await response.json().catch(() => null);
    return result ?? { accepted: [payload.to] };
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(`Mailqueue API request timed out after ${config.timeoutMs}ms`);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function stripUndefined(value) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));
}

function asError(value) {
  if (value instanceof Error) return value;
  return new Error(typeof value === 'string' ? value : 'Unknown mailqueue transport error');
}
