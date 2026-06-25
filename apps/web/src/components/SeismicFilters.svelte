<script lang="ts">
  // Filtros rápidos (SPEC §5.2). Props bindables: el padre filtra en cliente
  // sobre los datos cacheados (funciona offline).
  export let window: "1h" | "6h" | "24h" | "7d" = "7d";
  export let minMag = 0;
  export let onlyTsunamiFlag = false;
  export let onlyReviewed = false;

  const WINDOWS: Array<{ value: typeof window; label: string }> = [
    { value: "1h", label: "1 h" },
    { value: "6h", label: "6 h" },
    { value: "24h", label: "24 h" },
    { value: "7d", label: "7 d" },
  ];
</script>

<div class="filters">
  <div class="row" role="group" aria-label="Ventana de tiempo">
    {#each WINDOWS as w}
      <button type="button" class:active={window === w.value} on:click={() => (window = w.value)}>{w.label}</button>
    {/each}
  </div>
  <label class="mag">
    Magnitud mínima: {minMag.toFixed(1)}
    <input type="range" min="0" max="7" step="0.5" bind:value={minMag} />
  </label>
  <label class="check"><input type="checkbox" bind:checked={onlyReviewed} /> Solo revisados</label>
  <label class="check"><input type="checkbox" bind:checked={onlyTsunamiFlag} /> Con bandera de tsunami</label>
</div>

<style>
  .filters {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-3);
  }
  .row {
    display: flex;
    gap: var(--space-2);
  }
  .row button {
    flex: 1;
    min-height: 40px;
    background: var(--color-surface-raised);
    border: 1px solid var(--color-border);
    color: var(--color-text-muted);
    border-radius: var(--radius-sm);
    font-size: var(--font-sm);
  }
  .row button.active {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
  .mag {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    font-size: var(--font-sm);
    color: var(--color-text-muted);
  }
  .mag input {
    width: 100%;
  }
  .check {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--font-sm);
    color: var(--color-text-muted);
    min-height: 32px;
  }
</style>
