<script lang="ts">
  import type { PageProps } from './$types';

  let { data, form }: PageProps = $props();
  const values = $derived(
    form?.values ?? {
      tokenId: '',
      to: '',
      subject: '',
      text: 'Dit is een testmail uit mailqueue.',
      html: '<p>Dit is een testmail uit <strong>mailqueue</strong>.</p>',
      replyTo: '',
      scheduledAt: '',
      maxAttempts: '5'
    }
  );
</script>

<section class="card">
  <p class="eyebrow">Test email</p>
  <h2>Zet handmatig een mail in de queue</h2>
  <form method="POST" action="?/create" class="form">
    <label>
      Client
      <select name="tokenId" required>
        <option value="">Kies een client</option>
        {#each data.tokens as token (token.id)}
          <option value={token.id} selected={token.id === values.tokenId}>
            {token.name} ({token.fromEmail ?? 'default from'})
          </option>
        {/each}
      </select>
    </label>
    <label>
      Aan
      <input name="to" type="email" required value={values.to} />
    </label>
    <label>
      Onderwerp
      <input name="subject" required value={values.subject} />
    </label>
    <label>
      Reply-To
      <input name="replyTo" type="email" value={values.replyTo} />
    </label>
    <label>
      Gepland op
      <input name="scheduledAt" type="datetime-local" value={values.scheduledAt} />
    </label>
    <label>
      Max attempts
      <input name="maxAttempts" type="number" min="1" max="10" value={values.maxAttempts} />
    </label>
    <label>
      Tekst
      <textarea name="text" rows="8">{values.text}</textarea>
    </label>
    <label>
      HTML
      <textarea name="html" rows="8">{values.html}</textarea>
    </label>
    <button type="submit">In queue zetten</button>
  </form>

  {#if data.saved}
    <p class="feedback success">Testmail succesvol in de queue gezet.</p>
  {/if}

  {#if form?.error}
    <p class="feedback error">{form.error}</p>
  {/if}
</section>

<style>
  .card {
    padding: 1.4rem;
    border-radius: 1.5rem;
    background: rgba(255, 252, 247, 0.88);
    border: 1px solid rgba(29, 36, 33, 0.08);
    box-shadow: 0 18px 48px rgba(29, 36, 33, 0.08);
  }

  .eyebrow {
    text-transform: uppercase;
    letter-spacing: 0.14em;
    font-size: 0.8rem;
    color: #9a5d37;
    margin: 0 0 0.25rem;
  }

  h2 {
    margin-top: 0;
  }

  .form {
    display: grid;
    gap: 0.9rem;
  }

  label {
    display: grid;
    gap: 0.35rem;
  }

  select,
  input,
  textarea {
    border: 1px solid rgba(29, 36, 33, 0.15);
    border-radius: 0.9rem;
    padding: 0.75rem 0.9rem;
    background: rgba(255, 255, 255, 0.82);
    font: inherit;
  }

  textarea {
    resize: vertical;
  }

  button {
    justify-self: start;
    border: 0;
    border-radius: 999px;
    background: #1d2421;
    color: #f6f1e8;
    padding: 0.7rem 1rem;
    cursor: pointer;
  }

  .feedback {
    margin: 1rem 0 0;
  }

  .success {
    color: #2f6f5b;
  }

  .error {
    color: #9b5f55;
  }
</style>
