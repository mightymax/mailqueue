# @mightymax/mailqueue

`@mightymax/mailqueue` is a small JavaScript client for the LDMax mailqueue API.

It is built for server-side apps that want to queue email over HTTP instead of talking to SMTP directly.

## Installation

```bash
npm install @mightymax/mailqueue
```

## Quick Start

```ts
import { sendMail } from '@mightymax/mailqueue';

await sendMail({
  apiUrl: 'https://mailqueue.example.com',
  token: process.env.MAILQUEUE_TOKEN!,
  to: 'user@example.com',
  subject: 'Welcome',
  text: 'Your account is ready.'
});
```

The final `from` address is chosen by the mailqueue API based on the bearer token configuration.

## Supported Options

- `token`: required bearer token from the mailqueue admin UI
- `to`: required recipient email address
- `subject`: required subject
- `text`: optional plain-text body
- `html`: optional HTML body
- `replyTo`: optional reply-to email address
- `scheduledAt`: optional ISO datetime with offset
- `maxAttempts`: optional retry count between `1` and `10`
- `headers`: optional extra string headers
- `apiUrl`: optional base URL, defaults to `process.env.MAILQUEUE_URL` or `http://localhost:5173`
- `endpoint`: optional API path, defaults to `/api/v1/messages`
- `timeoutMs`: optional HTTP timeout, defaults to `10000`
- `fetch`: optional custom `fetch` implementation

At least one of `text` or `html` is required.

## SvelteKit Example

### Environment

```dotenv
MAILQUEUE_URL=https://mailqueue.example.com
MAILQUEUE_TOKEN=mq_xxxxx_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Server helper

```ts
import { sendMail } from '@mightymax/mailqueue';

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

### Server action

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

    return { success: true };
  }
};
```

## Scheduled Delivery

```ts
import { sendMail } from '@mightymax/mailqueue';

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

Use regular `try/catch` in your app.

## Publishing

```bash
npm publish --access public
```

## License

EUROPEAN UNION PUBLIC LICENCE v. 1.2
