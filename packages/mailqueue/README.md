# mailqueue

`mailqueue` is a tiny JavaScript client for the LDMax mailqueue API.

It is built for server-side apps that want a very small API surface:

```ts
import { sendMail } from 'mailqueue';

await sendMail({
  apiUrl: 'https://mailqueue.example.com',
  token: process.env.MAILQUEUE_TOKEN!,
  to: 'user@example.com',
  subject: 'Welcome',
  text: 'Your account is ready.'
});
```

This works especially well in SvelteKit server actions, endpoints, background jobs, and any other Node.js process that wants to queue email without speaking SMTP directly.

## Installation

```bash
npm install mailqueue
```

## Quick Start

```ts
import { sendMail } from 'mailqueue';

await sendMail({
  apiUrl: 'https://mailqueue.example.com',
  token: process.env.MAILQUEUE_TOKEN!,
  to: 'user@example.com',
  subject: 'Welcome',
  text: 'Your account is ready.'
});
```

The mailqueue API chooses the final `from` address based on the bearer token configured in the mailqueue admin UI.

## Options

| Option | Required | Description |
| --- | --- | --- |
| `token` | Yes | Bearer token created in the mailqueue admin UI |
| `to` | Yes | Recipient email address |
| `subject` | Yes | Message subject |
| `text` | No | Plain-text body |
| `html` | No | HTML body |
| `replyTo` | No | Reply-to email address |
| `scheduledAt` | No | ISO datetime with offset, for delayed delivery |
| `maxAttempts` | No | Retry count between `1` and `10` |
| `headers` | No | Extra string headers |
| `apiUrl` | No | Base URL of the mailqueue app. Defaults to `process.env.MAILQUEUE_URL` or `http://localhost:5173` |
| `endpoint` | No | API path, defaults to `/api/v1/messages` |
| `timeoutMs` | No | HTTP timeout in milliseconds, defaults to `10000` |
| `fetch` | No | Custom `fetch` implementation, useful for tests |

At least one of `text` or `html` is required.

## Complete SvelteKit Example

This example shows a simple contact form that queues mail from a SvelteKit server action.

### 1. Environment Variables

`.env`

```dotenv
MAILQUEUE_URL=https://mailqueue.example.com
MAILQUEUE_TOKEN=mq_xxxxx_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. Server-side Helper

`src/lib/server/mailer.ts`

```ts
import { sendMail } from 'mailqueue';

export async function sendContactNotification(input: {
  name: string;
  email: string;
  message: string;
}) {
  await sendMail({
    token: process.env.MAILQUEUE_TOKEN!,
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
    maxAttempts: 3
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

    try {
      await sendContactNotification({ name, email, message });
    } catch (error) {
      return fail(502, {
        error: error instanceof Error ? error.message : 'Unable to queue your message right now.',
        values: { name, email, message }
      });
    }

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

## Scheduled Delivery Example

```ts
import { sendMail } from 'mailqueue';

await sendMail({
  token: process.env.MAILQUEUE_TOKEN!,
  to: 'user@example.com',
  subject: 'Invoice reminder',
  text: 'This will be queued for later delivery.',
  scheduledAt: '2026-04-01T09:00:00+02:00',
  maxAttempts: 5
});
```

## Error Handling

`sendMail()` throws normal JavaScript errors for:

- missing or invalid input
- API validation failures
- timeouts
- non-2xx HTTP responses

That makes it easy to handle with regular `try/catch`.

## Publishing

From the package directory:

```bash
npm publish --access public
```

## License

[uropean Union Public Licence v.1.2](https://eupl.eu/1.2/en/)
