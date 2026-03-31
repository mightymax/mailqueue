<script lang="ts">
  import StatCard from '$lib/components/StatCard.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
</script>

<section class="hero">
  <div>
    <p class="kicker">Operational dashboard</p>
    <h2>LDMax mailing platform</h2>
  </div>
  <div class="panel">
    <p>API-clients zetten mail in de queue via Bearer tokens. De worker claimt batches uit Postgres en levert af via SMTP.</p>
  </div>
</section>

<section class="stats">
  <StatCard label="Queued" value={data.stats.queued} />
  <StatCard label="Processing" value={data.stats.processing} />
  <StatCard label="Failed" value={data.stats.failed} tone="warn" />
  <StatCard label="Sent today" value={data.stats.sentToday} />
  <StatCard label="Tokens" value={data.stats.tokenCount} />
  <StatCard label="SMTP services" value={data.stats.smtpServiceCount} />
</section>

<section class="grid">
  <article class="card">
    <header>
      <h3>Laatste queue items</h3>
      <a href="/queue">Volledig overzicht</a>
    </header>
    <div class="list">
      {#each data.recentQueue as item (item.id)}
        <div class="row">
          <div>
            <strong>{item.subject}</strong>
            <p>{item.recipient}</p>
          </div>
          <span class={`status ${item.status}`}>{item.status}</span>
        </div>
      {:else}
        <p>Er staat nog geen mail in de queue.</p>
      {/each}
    </div>
  </article>

  <article class="card">
    <header>
      <h3>Actieve tokens</h3>
      <a href="/tokens">Tokenbeheer</a>
    </header>
    <div class="list">
      {#each data.recentTokens as token (token.id)}
        <div class="row">
          <div>
            <strong>{token.name}</strong>
            <p>{token.websiteUrl}</p>
          </div>
          <span>{token.tokenPrefix}</span>
        </div>
      {:else}
        <p>Er zijn nog geen API tokens uitgegeven.</p>
      {/each}
    </div>
  </article>
</section>

<style>
  .hero,
  .stats,
  .grid {
    margin-bottom: 1.5rem;
  }

  .hero {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 1rem;
  }

  .kicker {
    text-transform: uppercase;
    letter-spacing: 0.15em;
    font-size: 0.8rem;
    color: #9a5d37;
    margin-bottom: 0.5rem;
  }

  h2 {
    margin: 0;
    max-width: 18ch;
    font-size: clamp(2rem, 4vw, 3.4rem);
    line-height: 0.98;
  }

  .panel,
  .card {
    padding: 1.4rem;
    border-radius: 1.5rem;
    background: rgba(255, 252, 247, 0.88);
    border: 1px solid rgba(29, 36, 33, 0.08);
    box-shadow: 0 18px 48px rgba(29, 36, 33, 0.08);
  }

  .stats {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }

  .grid {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }

  header,
  .row {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: center;
  }

  .list {
    display: grid;
    gap: 1rem;
  }

  .row p,
  .panel p {
    margin: 0.35rem 0 0;
    color: #5b6663;
  }

  .status {
    padding: 0.35rem 0.7rem;
    border-radius: 999px;
    background: #ebe3d5;
    text-transform: uppercase;
    font-size: 0.78rem;
  }

  .status.failed {
    background: rgba(202, 109, 63, 0.14);
  }

  .status.sent {
    background: rgba(55, 121, 99, 0.14);
  }

  @media (max-width: 900px) {
    .hero {
      grid-template-columns: 1fr;
    }
  }
</style>
