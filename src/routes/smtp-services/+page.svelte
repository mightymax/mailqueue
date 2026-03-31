<script lang="ts">
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
  const values = $derived(data.flash?.values ?? {
    name: '',
    host: '',
    port: '587',
    secure: '',
    username: '',
    password: ''
  });
</script>

<section class="split">
  <article class="card">
    <p class="eyebrow">Nieuwe service</p>
    <h2>SMTP verbinding beheren</h2>
    <form method="POST" class="form" autocomplete="off" data-1p-ignore data-lpignore="true">
      <label>
        Naam
        <input name="name" placeholder="Postmark production" required autocomplete="off" value={values.name} />
      </label>
      <label>
        Host
        <input name="host" placeholder="smtp.example.com" required autocomplete="off" value={values.host} />
      </label>
      <label>
        Poort
        <input
          name="port"
          type="number"
          min="1"
          max="65535"
          value={values.port}
          required
          autocomplete="off"
        />
      </label>
      <label class="inline">
        <input name="secure" type="checkbox" checked={values.secure === 'on'} />
        TLS direct (`secure=true`)
      </label>
      <label>
        Username
        <input
          name="username"
          required
          autocomplete="off"
          autocapitalize="none"
          autocorrect="off"
          spellcheck="false"
          value={values.username}
        />
      </label>
      <label>
        Password
        <input name="password" type="password" required autocomplete="new-password" value={values.password} />
      </label>
      <div class="actions">
        <button type="submit" formaction="?/test" class="secondary">Test verbinding</button>
        <button type="submit" formaction="?/create">SMTP service opslaan</button>
      </div>
    </form>

    {#if data.flash?.message}
      <p class:success={data.flash.success} class:feedback={true}>{data.flash.message}</p>
    {/if}

    {#if data.flash?.error}
      <p class="feedback error">{data.flash.error}</p>
    {/if}
  </article>

  <article class="card">
    <p class="eyebrow">Bestaande services</p>
    <h2>Beschikbare transports</h2>
    <div class="list">
      {#each data.services as service (service.id)}
        <div class="row">
          <div>
            <strong>{service.name}</strong>
            <p>{service.host}:{service.port}</p>
          </div>
          <div>
            <span>{service.secure === 1 ? 'TLS direct' : 'STARTTLS / plain'}</span>
            <p>Credentials encrypted opgeslagen</p>
            <p><a href={`/smtp-services/${service.id}`}>Bewerken</a></p>
          </div>
        </div>
      {:else}
        <p>Nog geen SMTP services aangemaakt.</p>
      {/each}
    </div>
  </article>
</section>

<style>
  .split {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
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

  .inline {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  input {
    border: 1px solid rgba(29, 36, 33, 0.15);
    border-radius: 0.9rem;
    padding: 0.75rem 0.9rem;
    background: rgba(255, 255, 255, 0.82);
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

  .actions {
    display: flex;
    gap: 0.75rem;
  }

  .secondary {
    background: #d9d0c1;
    color: #1d2421;
  }

  .feedback {
    margin: 1rem 0 0;
    color: #9b5f55;
  }

  .success {
    color: #2f6f5b;
  }

  .error {
    color: #9b5f55;
  }

  .row {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding-top: 0.9rem;
    border-top: 1px solid rgba(29, 36, 33, 0.08);
  }

  .row p {
    margin-bottom: 0;
    color: #59625f;
  }

  .row a {
    color: #9a5d37;
  }
</style>
