<script lang="ts">
  interface Props {
    label: string;
    value: number;
    tone?: 'default' | 'warn';
  }

  let { label, value, tone = 'default' }: Props = $props();
</script>

<article class:tone-warn={tone === 'warn'}>
  <span>{label}</span>
  <strong>{value}</strong>
</article>

<style>
  article {
    padding: 1.2rem;
    border-radius: 1.25rem;
    background: rgba(255, 255, 255, 0.72);
    border: 1px solid rgba(29, 36, 33, 0.08);
    box-shadow: 0 10px 40px rgba(29, 36, 33, 0.07);
  }

  span {
    display: block;
    font-size: 0.82rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: #59625f;
    margin-bottom: 0.45rem;
  }

  strong {
    font-size: 2rem;
    line-height: 1;
  }

  .tone-warn {
    background: rgba(202, 109, 63, 0.12);
    border-color: rgba(202, 109, 63, 0.25);
  }
</style>
