<script lang="ts">
  import type { RecommendationDTO } from "@sismicaid/shared";

  export let rec: RecommendationDTO;

  $: bullets = rec.body
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
</script>

<article class="card">
  <h3>{rec.title}</h3>
  <ul>
    {#each bullets as b}
      <li>{b}</li>
    {/each}
  </ul>
</article>

<style>
  .card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
  }
  h3 {
    margin: 0 0 var(--space-3);
    font-size: var(--font-lg);
    color: var(--color-text);
  }
  ul {
    margin: 0;
    padding-left: var(--space-5);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  li {
    color: var(--color-text-muted);
    font-size: var(--font-md);
    line-height: 1.4;
  }
</style>
