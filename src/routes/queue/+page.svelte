<script lang="ts">
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
</script>

<section class="card">
  <header>
    <div>
      <p class="eyebrow">Queue</p>
      <h2>Mail jobs</h2>
    </div>
    <div class="header-actions">
      <p>{data.items.length} items geladen</p>
      <form method="POST" action="?/sendBatch">
        <button type="submit">Verstuur batch nu</button>
      </form>
    </div>
  </header>

  {#if data.sent > 0}
    <p class="feedback success">Batch verwerkt, {data.sent} mail(s) opgepakt.</p>
  {/if}

  {#if data.sent === 0 && data.hadSendResult}
    <p class="feedback">Geen verzendbare mails gevonden in de queue.</p>
  {/if}

  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Status</th>
          <th>Ontvanger</th>
          <th>Onderwerp</th>
          <th>Token</th>
          <th>Pogingen</th>
          <th>Aangemaakt</th>
          <th>Actie</th>
        </tr>
      </thead>
      <tbody>
        {#each data.items as item (item.id)}
          <tr>
            <td><span class={`status ${item.status}`}>{item.status}</span></td>
            <td>{item.recipient}</td>
            <td>
              <strong>{item.subject}</strong>
              {#if item.lastError}
                <small>{item.lastError}</small>
              {/if}
            </td>
            <td>{item.tokenName ?? 'n/a'}</td>
            <td>{item.attempts}/{item.maxAttempts}</td>
            <td>{new Date(item.createdAt).toLocaleString()}</td>
            <td class="actions">
              <form method="POST" action="?/retry">
                <input type="hidden" name="id" value={item.id} />
                <button type="submit" disabled={item.status === 'sent' || item.status === 'sending'}>Retry</button>
              </form>
              <form method="POST" action="?/cancel">
                <input type="hidden" name="id" value={item.id} />
                <button type="submit" disabled={item.status === 'sent' || item.status === 'cancelled'}>Cancel</button>
              </form>
            </td>
          </tr>
        {:else}
          <tr>
            <td colspan="7">Queue is leeg.</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
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
    align-items: end;
    gap: 1rem;
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

  .header-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .table-wrap {
    overflow: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th,
  td {
    padding: 0.9rem 0.7rem;
    border-top: 1px solid rgba(29, 36, 33, 0.08);
    text-align: left;
    vertical-align: top;
  }

  small {
    display: block;
    margin-top: 0.4rem;
    color: #9b5f55;
    max-width: 30ch;
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

  .actions {
    display: flex;
    gap: 0.5rem;
  }

  button {
    border: 0;
    border-radius: 999px;
    background: #1d2421;
    color: #f6f1e8;
    padding: 0.55rem 0.9rem;
    cursor: pointer;
  }

  button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .feedback {
    margin: 0 0 1rem;
    color: #59625f;
  }

  .success {
    color: #2f6f5b;
  }
</style>
