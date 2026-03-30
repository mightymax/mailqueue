# nodemailer-mailqueue-transport

`nodemailer-mailqueue-transport` lets any Node.js app submit emails to the LDMax mailqueue API through Nodemailer.

It is especially useful for SvelteKit apps that already use Nodemailer patterns on the server, but want queueing, retries, token-based sender isolation, and centralized SMTP management.

## Features

- Works as a standard Nodemailer custom transport
- Sends to `POST /api/v1/messages`
- Supports `text`, `html`, `replyTo`, custom `headers`
- Supports queue-specific options through `mailqueue.scheduledAt` and `mailqueue.maxAttempts`
- Zero build step, pure ESM, TypeScript types included

## Installation

```bash
npm install nodemailer nodemailer-mailqueue-transport
```

## Quick Start

```ts
import nodemailer from 'nodemailer';
import { createMailqueueTransport } from 'nodemailer-mailqueue-transport';

const transporter = nodemailer.createTransport(
  createMailqueueTransport({
    apiUrl: 'https://mailqueue.example.com',
    token: process.env.MAILQUEUE_TOKEN!
  })
);

await transporter.sendMail({
  to: 'user@example.com',
  subject: 'Welcome',
  text: 'Your account is ready.'
});
```

The mailqueue API decides the final `from` address based on the bearer token. Do not set `from` in the Nodemailer message.

## Transport Options

| Option | Required | Description |
| --- | --- | --- |
| `apiUrl` | Yes | Base URL of the mailqueue app, for example `https://mailqueue.example.com` |
| `token` | Yes | Bearer token created in the mailqueue admin UI |
| `endpoint` | No | API path, defaults to `/api/v1/messages` |
| `timeoutMs` | No | HTTP timeout in milliseconds, defaults to `10000` |
| `fetch` | No | Custom `fetch` implementation, useful for tests |

## Supported `sendMail` Fields

The transport maps these Nodemailer fields to the mailqueue API:

- `to`
- `subject`
- `text`
- `html`
- `replyTo`
- `headers`
- `mailqueue.scheduledAt`
- `mailqueue.maxAttempts`

## Current Limitations

This package intentionally follows the current mailqueue API contract. It does **not** support:

- `from`
- `cc`
- `bcc`
- `attachments`
- `alternatives`
- raw MIME messages
- more than one recipient in `to`

If you need those features, extend the mailqueue API first and then expand the transport accordingly.

## Complete SvelteKit Example

This example shows a typical contact-form workflow where a SvelteKit server action sends mail through the queue instead of talking to SMTP directly.

### 1. Environment Variables

`.env`

```dotenv
MAILQUEUE_URL=https://mailqueue.example.com
MAILQUEUE_TOKEN=mq_xxxxx_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. Server-only Mailer

`src/lib/server/mailer.ts`

```ts
import nodemailer from 'nodemailer';
import { createMailqueueTransport } from 'nodemailer-mailqueue-transport';

const transporter = nodemailer.createTransport(
  createMailqueueTransport({
    apiUrl: process.env.MAILQUEUE_URL!,
    token: process.env.MAILQUEUE_TOKEN!,
    timeoutMs: 8000
  })
);

export async function sendContactNotification(input: {
  name: string;
  email: string;
  message: string;
}) {
  await transporter.sendMail({
    to: 'sales@example.com',
    subject: `New contact form message from ${input.name}`,
    text: [
      `Name: ${input.name}`,
      `Email: ${input.email}`,
      '',
      input.message
    ].join('\n'),
    replyTo: input.email,
    headers: {
      'x-app': 'website'
    },
    mailqueue: {
      maxAttempts: 3
    }
  });
}
```

### 3. SvelteKit Server Action

`src/routes/+page.server.ts`

```ts
import { fail } from '@sveltejs/kit';
import { sendContactNotification } from '$lib/server/mailer';

export const actions = {
  default: async ({ request }) => {
    const form = await request.formData();

    const name = String(form.get('name') ?? '').trim();
    const email = String(form.get('email') ?? '').trim();
    const message = String(form.get('message') ?? '').trim();

    if (!name || !email || !message) {
      return fail(400, {
        error: 'Please fill in every field.',
        values: { name, email, message }
      });
    }

    await sendContactNotification({ name, email, message });

    return {
      success: true
    };
  }
};
```

### 4. Svelte Page

`src/routes/+page.svelte`

```svelte
<script lang="ts">
  let { form } = $props();
</script>

<form method="POST">
  <label>
    Name
    <input name="name" value={form?.values?.name ?? ''} />
  </label>

  <label>
    Email
    <input name="email" type="email" value={form?.values?.email ?? ''} />
  </label>

  <label>
    Message
    <textarea name="message">{form?.values?.message ?? ''}</textarea>
  </label>

  <button type="submit">Send</button>

  {#if form?.error}
    <p>{form.error}</p>
  {/if}

  {#if form?.success}
    <p>Your message has been queued.</p>
  {/if}
</form>
```

## Advanced Usage

### Schedule a Message

```ts
await transporter.sendMail({
  to: 'user@example.com',
  subject: 'Invoice reminder',
  text: 'This will be queued for later delivery.',
  mailqueue: {
    scheduledAt: '2026-04-01T09:00:00+02:00',
    maxAttempts: 5
  }
});
```

### Reuse Your Own `fetch`

```ts
import { fetch as undiciFetch } from 'undici';

const transporter = nodemailer.createTransport(
  createMailqueueTransport({
    apiUrl: 'https://mailqueue.example.com',
    token: process.env.MAILQUEUE_TOKEN!,
    fetch: undiciFetch
  })
);
```

## Error Handling

The transport fails fast when the message contains unsupported fields. API validation errors are surfaced as normal `sendMail()` errors, so your app can handle them with regular `try/catch`.

## Publishing

From the package directory:

```bash
npm publish --access public
```

## License

MIT
