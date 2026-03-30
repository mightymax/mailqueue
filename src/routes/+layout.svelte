<script lang="ts">
  let { children } = $props();
</script>

<svelte:head>
  <title>Mailqueue</title>
  <meta name="robots" content="noindex,nofollow" />
</svelte:head>

<div class="shell">
  <aside class="sidebar">
    <div>
      <p class="eyebrow">mailqueue</p>
      <h1>Outbound email control</h1>
      <p class="muted">Queuebeheer, tokenuitgifte en SMTP delivery voor het Lindeman IT cluster.</p>
    </div>

    <nav>
      <a href="/">Dashboard</a>
      <a href="/queue">Queue</a>
      <a href="/tokens">API tokens</a>
      <a href="/test-email">Test email</a>
      <a href="/smtp-services">SMTP services</a>
      <a href="/healthz">Health</a>
    </nav>
  </aside>

  <main class="content">
    {@render children()}
  </main>
</div>

<style>
  :global(body) {
    margin: 0;
    min-height: 100vh;
    font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
    background:
      radial-gradient(circle at top left, rgba(209, 119, 65, 0.2), transparent 32%),
      linear-gradient(180deg, #f6f1e8 0%, #ebe3d5 100%);
    color: #1d2421;
  }

  :global(a) {
    color: inherit;
    text-decoration: none;
  }

  .shell {
    display: grid;
    grid-template-columns: minmax(250px, 320px) minmax(0, 1fr);
    min-height: 100vh;
  }

  .sidebar {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 2rem;
    background: rgba(23, 33, 29, 0.93);
    color: #f6f1e8;
  }

  .eyebrow {
    margin: 0 0 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.22em;
    font-size: 0.72rem;
    color: #e2a56f;
  }

  h1 {
    margin: 0;
    font-size: clamp(2rem, 4vw, 3rem);
    line-height: 0.95;
  }

  .muted {
    color: rgba(246, 241, 232, 0.72);
    max-width: 18rem;
  }

  nav {
    display: grid;
    gap: 0.75rem;
    margin-top: 2rem;
  }

  nav a {
    padding: 0.85rem 1rem;
    border: 1px solid rgba(246, 241, 232, 0.15);
    border-radius: 999px;
    transition: transform 0.18s ease, border-color 0.18s ease;
  }

  nav a:hover {
    transform: translateX(4px);
    border-color: rgba(226, 165, 111, 0.6);
  }

  .content {
    padding: 2rem;
  }

  @media (max-width: 900px) {
    .shell {
      grid-template-columns: 1fr;
    }

    .sidebar {
      gap: 1.5rem;
    }
  }
</style>
