<script lang="ts">
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
  const values = $derived(
    data.flash?.values ?? {
      name: data.token.name,
      websiteUrl: data.token.websiteUrl,
      fromEmail: data.token.fromEmail ?? '',
      smtpServiceId: data.token.smtpServiceId ?? ''
    }
  );
</script>

<section class="card">
  <p class="eyebrow">Client</p>
  <header>
    <div>
      <h2>{data.token.name}</h2>
      <p>Werk de clientconfig bij. Opslaan redirect direct terug naar deze pagina.</p>
    </div>
    <a href="/tokens">Terug</a>
  </header>

  <form method="POST" action="?/update" class="form">
    <label>
      Naam
      <input name="name" required value={values.name} />
    </label>
    <label>
      Website URL
      <input name="websiteUrl" type="url" required value={values.websiteUrl} />
    </label>
    <label>
      Mail from
      <input name="fromEmail" type="email" required value={values.fromEmail} />
    </label>
    <label>
      SMTP service
      <select name="smtpServiceId" required>
        <option value="">Kies een service</option>
        {#each data.smtpServices as service (service.id)}
          <option value={service.id} selected={service.id === values.smtpServiceId}>
            {service.name} ({service.host}:{service.port})
          </option>
        {/each}
      </select>
    </label>

    <div class="actions">
      <button type="submit" formaction="?/rotate" class="secondary">Nieuwe token genereren</button>
      <button type="submit">Wijzigingen opslaan</button>
    </div>
  </form>

  {#if data.flash?.createdToken}
    <div class="reveal">
      <strong>Nieuwe Bearer token</strong>
      <code>{data.flash.createdToken.token}</code>
      <p>Deze wordt maar een keer getoond. Oude token werkt niet meer.</p>
    </div>
  {/if}

  {#if data.flash?.error}
    <p class="feedback error">{data.flash.error}</p>
  {/if}

  {#if data.flash?.message}
    <p class="feedback success">{data.flash.message}</p>
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

  header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  h2 {
    margin: 0;
  }

  header p {
    margin: 0.35rem 0 0;
    color: #59625f;
  }

  header a {
    color: #9a5d37;
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
  input {
    border: 1px solid rgba(29, 36, 33, 0.15);
    border-radius: 0.9rem;
    padding: 0.75rem 0.9rem;
    background: rgba(255, 255, 255, 0.82);
  }

  .actions {
    display: flex;
    gap: 0.75rem;
  }

  button {
    border: 0;
    border-radius: 999px;
    background: #1d2421;
    color: #f6f1e8;
    padding: 0.7rem 1rem;
    cursor: pointer;
  }

  .secondary {
    background: #d9d0c1;
    color: #1d2421;
  }

  .feedback {
    margin: 1rem 0 0;
    color: #9b5f55;
  }

  .error {
    color: #9b5f55;
  }

  .success {
    color: #2f6f5b;
  }

  .reveal {
    margin-top: 1rem;
    padding: 1rem;
    border-radius: 1rem;
    background: rgba(226, 165, 111, 0.14);
  }

  code {
    display: block;
    margin-top: 0.5rem;
    overflow-wrap: anywhere;
  }
</style>
