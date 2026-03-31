<script lang="ts">
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  const statuses = ['queued', 'sending', 'sent', 'failed', 'cancelled'];
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
        {#if data.status}
          <input type="hidden" name="currentStatus" value={data.status} />
        {/if}
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

  {#if data.action === 'retry'}
    <p class="feedback success">Queue-item opnieuw ingepland.</p>
  {/if}

  {#if data.action === 'cancel'}
    <p class="feedback">Queue-item geannuleerd.</p>
  {/if}

  {#if data.action === 'reset'}
    <p class="feedback success">Queue-item(s) opnieuw op queued gezet.</p>
  {/if}

  {#if data.action?.startsWith('status-')}
    <p class="feedback success">Status aangepast naar {data.action.replace('status-', '')}.</p>
  {/if}

  {#if data.action === 'delete'}
    <p class="feedback">Queue-item(s) gewist.</p>
  {/if}

  <form method="GET" class="filter-bar">
    <label>
      Status filter
      <select name="status">
        <option value="">Alle statussen</option>
        {#each statuses as status (status)}
          <option value={status} selected={data.status === status}>{status}</option>
        {/each}
      </select>
    </label>
    <button type="submit" class="secondary">Filter</button>
    <a href="/queue" class="reset-link">Reset filter</a>
  </form>

  <form method="POST" class="table-form">
    {#if data.status}
      <input type="hidden" name="currentStatus" value={data.status} />
    {/if}

    <div class="batch-bar">
      <button type="submit" formaction="?/reset">Reset naar queued</button>
      <div class="status-change">
        <select name="nextStatus">
          <option value="queued">queued</option>
          <option value="failed">failed</option>
          <option value="cancelled">cancelled</option>
        </select>
        <button type="submit" formaction="?/setStatus" class="secondary">Pas status aan</button>
      </div>
      <button type="submit" formaction="?/delete" class="danger">Wis geselecteerde</button>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Select</th>
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
              <td>
                <input type="checkbox" name="ids" value={item.id} />
              </td>
              <td><span class={`status ${item.status}`}>{item.status}</span></td>
              <td>{item.recipient}</td>
              <td>
                <a href={`/queue/${item.id}`} class="subject-link">
                  <strong>{item.subject}</strong>
                </a>
                {#if item.lastError}
                  <small>{item.lastError}</small>
                {/if}
              </td>
              <td>{item.tokenName ?? 'n/a'}</td>
              <td>{item.attempts}/{item.maxAttempts}</td>
              <td>{new Date(item.createdAt).toLocaleString()}</td>
              <td class="actions">
                <button type="submit" formaction="?/reset" name="ids" value={item.id}>Reset</button>
                <button type="submit" formaction="?/delete" name="ids" value={item.id} class="danger">Wis</button>
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="8">Queue is leeg.</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </form>
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

  .filter-bar,
  .batch-bar {
    display: flex;
    align-items: end;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }

  .filter-bar label,
  .status-change {
    display: grid;
    gap: 0.35rem;
  }

  .table-wrap {
    overflow: auto;
  }

  .table-form {
    display: grid;
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
    flex-wrap: wrap;
  }

  select,
  button {
    border: 0;
    border-radius: 999px;
    background: #1d2421;
    color: #f6f1e8;
    padding: 0.55rem 0.9rem;
    cursor: pointer;
  }

  select {
    border: 1px solid rgba(29, 36, 33, 0.15);
    background: rgba(255, 255, 255, 0.82);
    color: #1d2421;
  }

  .secondary {
    background: #d9d0c1;
    color: #1d2421;
  }

  .danger {
    background: #9b5f55;
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

  .reset-link,
  .subject-link {
    color: #9a5d37;
  }
</style>
