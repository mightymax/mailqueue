<script lang="ts">
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
  const values = $derived(
    data.flash?.values ?? {
      name: data.service.name,
      host: data.service.host,
      port: String(data.service.port),
      secure: data.service.secure ? 'on' : '',
      username: data.service.username,
      password: data.service.password
    }
  );
  const usingDirectTls = $derived(values.port === '465' && values.secure === 'on');
</script>

<section class="card">
  <p class="eyebrow">SMTP service</p>
  <header>
    <div>
      <h2>{data.service.name}</h2>
      <p>Bewerk transportinstellingen en test de verbinding voordat je opslaat.</p>
      <p class="helper">Aanbevolen voor k8s: poort 587 met STARTTLS. Gebruik 465 met directe TLS alleen als je zeker weet dat outbound 465 vanaf het cluster werkt.</p>
    </div>
    <a href="/smtp-services">Terug</a>
  </header>

  <form method="POST" class="form" autocomplete="off" data-1p-ignore data-lpignore="true">
    <label>
      Naam
      <input name="name" required autocomplete="off" value={values.name} />
    </label>
    <label>
      Host
      <input name="host" required autocomplete="off" value={values.host} />
    </label>
    <label>
      Poort
      <input name="port" type="number" min="1" max="65535" required autocomplete="off" value={values.port} />
    </label>
    <label class="inline">
      <input name="secure" type="checkbox" checked={values.secure === 'on'} />
      TLS direct (`secure=true`)
    </label>
    {#if usingDirectTls}
      <p class="warning">Waarschuwing: poort 465 met directe TLS gaf in dit cluster eerder timeouts. Gebruik bij voorkeur 587 zonder deze optie.</p>
    {:else}
      <p class="hint">Aanbevolen combinatie: poort 587 en `TLS direct` uit. Nodemailer gebruikt dan STARTTLS.</p>
    {/if}
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
      <button type="submit" formaction="?/update">Wijzigingen opslaan</button>
    </div>
  </form>

  {#if data.flash?.message}
    <p class:success={data.flash.success} class:feedback={true}>{data.flash.message}</p>
  {/if}

  {#if data.flash?.error}
    <p class="feedback error">{data.flash.error}</p>
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

  .helper,
  .hint,
  .warning {
    margin: 0.35rem 0 0;
    color: #59625f;
  }

  .warning {
    color: #9b5f55;
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

  .success {
    color: #2f6f5b;
  }

  .error {
    color: #9b5f55;
  }
</style>
