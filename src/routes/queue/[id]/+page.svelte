<script lang="ts">
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
</script>

<section class="card">
  <header>
    <div>
      <p class="eyebrow">Queue detail</p>
      <h2>{data.item.subject}</h2>
      <p>{data.item.recipient}</p>
    </div>
    <a href="/queue">Terug</a>
  </header>

  <dl class="meta">
    <div>
      <dt>Status</dt>
      <dd>{data.item.status}</dd>
    </div>
    <div>
      <dt>Van</dt>
      <dd>{data.item.fromEmail}</dd>
    </div>
    <div>
      <dt>Reply-To</dt>
      <dd>{data.item.replyTo ?? 'n.v.t.'}</dd>
    </div>
    <div>
      <dt>Token</dt>
      <dd>{data.item.tokenName ?? 'n.v.t.'}</dd>
    </div>
    <div>
      <dt>SMTP service</dt>
      <dd>{data.item.smtpServiceName ?? 'n.v.t.'}</dd>
    </div>
    <div>
      <dt>Pogingen</dt>
      <dd>{data.item.attempts}/{data.item.maxAttempts}</dd>
    </div>
    <div>
      <dt>Scheduled at</dt>
      <dd>{new Date(data.item.scheduledAt).toLocaleString()}</dd>
    </div>
    <div>
      <dt>Aangemaakt</dt>
      <dd>{new Date(data.item.createdAt).toLocaleString()}</dd>
    </div>
    <div>
      <dt>Bijgewerkt</dt>
      <dd>{new Date(data.item.updatedAt).toLocaleString()}</dd>
    </div>
    <div>
      <dt>Sent at</dt>
      <dd>{data.item.sentAt ? new Date(data.item.sentAt).toLocaleString() : 'n.v.t.'}</dd>
    </div>
    <div>
      <dt>Failed at</dt>
      <dd>{data.item.failedAt ? new Date(data.item.failedAt).toLocaleString() : 'n.v.t.'}</dd>
    </div>
    <div>
      <dt>Last error</dt>
      <dd>{data.item.lastError ?? 'n.v.t.'}</dd>
    </div>
  </dl>

  {#if Object.keys(data.item.headersJson).length > 0}
    <section class="block">
      <h3>Headers</h3>
      <pre>{JSON.stringify(data.item.headersJson, null, 2)}</pre>
    </section>
  {/if}

  {#if data.item.textBody}
    <section class="block">
      <h3>Text body</h3>
      <pre>{data.item.textBody}</pre>
    </section>
  {/if}

  {#if data.item.htmlBody}
    <section class="block">
      <h3>HTML body</h3>
      <pre>{data.item.htmlBody}</pre>
    </section>
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

  header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  .eyebrow {
    text-transform: uppercase;
    letter-spacing: 0.14em;
    font-size: 0.8rem;
    color: #9a5d37;
    margin: 0 0 0.25rem;
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

  .meta {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 0.9rem;
    margin: 0 0 1.5rem;
  }

  .meta div {
    padding: 0.9rem;
    border-radius: 1rem;
    background: rgba(255, 255, 255, 0.7);
  }

  dt {
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #9a5d37;
    margin-bottom: 0.25rem;
  }

  dd {
    margin: 0;
    color: #1d2421;
    overflow-wrap: anywhere;
  }

  .block {
    margin-top: 1rem;
  }

  h3 {
    margin-bottom: 0.5rem;
  }

  pre {
    margin: 0;
    padding: 1rem;
    border-radius: 1rem;
    background: rgba(29, 36, 33, 0.06);
    overflow: auto;
    white-space: pre-wrap;
    word-break: break-word;
  }
</style>
