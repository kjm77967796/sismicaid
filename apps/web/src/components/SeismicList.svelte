<script lang="ts">
  import type { SeismicEventDTO } from "@sismicaid/shared";
  import EventCard from "./EventCard.svelte";
  import EventDetail from "./EventDetail.svelte";

  export let events: SeismicEventDTO[] = [];
  export let selectedId: string | null = null;
  export let onSelect: (id: string) => void = () => {};
</script>

{#if events.length === 0}
  <p class="muted">No se encontraron eventos con estos filtros.</p>
{:else}
  <ul>
    {#each events as e (e.id)}
      <li>
        <button type="button" class:sel={e.id === selectedId} on:click={() => onSelect(e.id)} aria-expanded={e.id === selectedId}>
          <EventCard event={e} />
        </button>
        {#if e.id === selectedId}
          <div class="inline-detail">
            <EventDetail event={e} onClose={() => onSelect(e.id)} />
          </div>
        {/if}
      </li>
    {/each}
  </ul>
{/if}

<style>
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
  button {
    display: block;
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    border-radius: var(--radius-lg);
  }
  button.sel {
    outline: 2px solid var(--color-primary);
  }
  .inline-detail {
    margin-top: var(--space-2);
  }
  .muted {
    color: var(--color-text-soft);
  }
</style>
