<script lang="ts">
  import { onMount } from "svelte";
  import type { CitizenReportDTO } from "@sismicaid/shared";
  import { getReports } from "../lib/api";
  import { fetchWithCache } from "../lib/cache";
  import { VENEZUELA_STATES } from "../lib/venezuela";
  import { needReportsQuery } from "../lib/reportGroups";
  import ReportCard from "./ReportCard.svelte";
  import CommunityNotice from "./CommunityNotice.svelte";

  let state: "loading" | "ready" | "error" = "loading";
  let offline = false;
  let reports: CitizenReportDTO[] = [];
  let stateFilter = "";

  $: filtered = stateFilter ? reports.filter((r) => r.state === stateFilter) : reports;

  onMount(async () => {
    try {
      const res = await fetchWithCache("necesidades-reports", () => getReports(needReportsQuery));
      reports = res.data;
      offline = res.fromCache;
      state = "ready";
    } catch {
      state = "error";
    }
  });
</script>

{#if offline}
  <p class="offline">Sin conexión. Mostrando últimos datos guardados.</p>
{/if}

{#if state === "loading"}
  <p class="muted">Cargando necesidades...</p>
{:else if state === "error"}
  <p class="muted">No se pudieron cargar las necesidades. Verifica tu conexión.</p>
{:else}
  <CommunityNotice text="Las necesidades las reportan otros usuarios. No están verificadas ni son oficiales." />
  <label class="filter">
    Estado
    <select bind:value={stateFilter}>
      <option value="">Todos</option>
      {#each VENEZUELA_STATES as s}<option value={s}>{s}</option>{/each}
    </select>
  </label>

  {#if filtered.length === 0}
    <p class="muted">No hay necesidades reportadas para esta zona por ahora. Usa "Reportar" para compartir una necesidad urgente.</p>
  {:else}
    <div class="grid">
      {#each filtered as r (r.id)}<ReportCard report={r} />{/each}
    </div>
  {/if}
{/if}

<style>
  .filter {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    font-size: var(--font-sm);
    color: var(--color-text-muted);
    margin-bottom: var(--space-4);
    max-width: 260px;
  }
  select {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    color: var(--color-text);
    border-radius: var(--radius-md);
    padding: 0.75rem;
    min-height: 44px;
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-3);
  }
  .offline {
    background: var(--color-surface);
    border-left: 4px solid var(--color-warning);
    color: var(--color-warning);
    border-radius: var(--radius-md);
    padding: var(--space-2) var(--space-3);
    font-size: var(--font-sm);
    margin-bottom: var(--space-3);
  }
  .muted {
    color: var(--color-text-soft);
  }
  @media (min-width: 768px) {
    .grid {
      grid-template-columns: 1fr 1fr;
    }
  }
</style>
