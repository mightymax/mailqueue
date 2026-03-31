<script lang="ts">
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
  const values = $derived(data.flash?.values ?? {
    name: '',
    websiteUrl: '',
    fromEmail: '',
    smtpServiceId: ''
  });
</script>

<section class="split">
  <article class="card">
    <p class="eyebrow">Nieuwe token</p>
    <h2>Geef API-toegang uit</h2>
    <form method="POST" action="?/create" class="form">
      <label>
        Naam
        <input name="name" placeholder="Billing app" required value={values.name} />
      </label>
      <label>
        Website URL
        <input name="websiteUrl" type="url" placeholder="https://billing.ldmax.nl" required value={values.websiteUrl} />
      </label>
      <label>
        Mail from
        <input name="fromEmail" type="email" placeholder="no-reply@example.com" required value={values.fromEmail} />
      </label>
      <label>
        SMTP service
        <select name="smtpServiceId" required disabled={data.smtpServices.length === 0}>
          <option value="">Kies een service</option>
          {#each data.smtpServices as service (service.id)}
            <option value={service.id} selected={service.id === values.smtpServiceId}>
              {service.name} ({service.host}:{service.port})
            </option>
          {/each}
        </select>
      </label>
      {#if data.smtpServices.length === 0}
        <p class="hint">Maak eerst een SMTP service aan voordat je tokens uitgeeft.</p>
      {/if}
      <button type="submit">Token aanmaken</button>
    </form>

    {#if data.flash?.createdToken}
      <div class="reveal">
        <strong>Nieuwe Bearer token</strong>
        <code>{data.flash.createdToken.token}</code>
        <p>Sla deze direct op. Alleen de hash wordt in Postgres bewaard.</p>
      </div>
    {/if}

    {#if data.flash?.error}
      <p class="hint">{data.flash.error}</p>
    {/if}
  </article>

  <article class="card">
    <p class="eyebrow">Bestaande tokens</p>
    <h2>Actieve clients</h2>
    <div class="list">
      {#each data.tokens as token (token.id)}
        <div class="row">
          <div>
            <strong>{token.name}</strong>
            <p>{token.websiteUrl}</p>
            <p>{token.fromEmail}</p>
          </div>
          <div>
            <p>{token.smtpServiceName}</p>
            <span>{token.tokenPrefix}</span>
            <p>{token.mailCount} mails verstuurd</p>
            <p><a href={`/tokens/${token.id}`}>Bewerken</a></p>
          </div>
        </div>
      {:else}
        <p>Nog geen tokens aangemaakt.</p>
      {/each}
    </div>
  </article>
</section>

<style>
  .split {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }

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

  .form,
  .list {
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

  .hint {
    margin: 0;
    color: #9b5f55;
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

  .row {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding-top: 0.9rem;
    border-top: 1px solid rgba(29, 36, 33, 0.08);
  }

  .row p,
  .reveal p {
    margin-bottom: 0;
    color: #59625f;
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

  .row a {
    color: #9a5d37;
  }
</style>
