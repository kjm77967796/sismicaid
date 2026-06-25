<script lang="ts">
  import { onMount } from "svelte";
  import type { CurrentTsunamiDTO, SeismicEventDTO } from "@sismicaid/shared";
  import { getCurrentTsunami, getSeismicEvents } from "../lib/api";
  import { fetchWithCache } from "../lib/cache";
  import TsunamiAlertCard from "./TsunamiAlertCard.svelte";
  import SeismicFilters from "./SeismicFilters.svelte";
  import SeismicList from "./SeismicList.svelte";
  import EventDetail from "./EventDetail.svelte";
  import SeismicMap from "./SeismicMap.svelte";

  let state: "loading" | "ready" | "error" = "loading";
  let offline = false;
  let events: SeismicEventDTO[] = [];
  let tsunami: CurrentTsunamiDTO | null = null;

  // Filtros (bindables en SeismicFilters).
  let window: "1h" | "6h" | "24h" | "7d" = "7d";
  let minMag = 0;
  let onlyTsunamiFlag = false;
  let onlyReviewed = false;

  let view: "list" | "map" = "list";
  let selectedId: string | null = null;

  const WINDOW_MS: Record<typeof window, number> = {
    "1h": 60 * 60 * 1000,
    "6h": 6 * 60 * 60 * 1000,
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
  };

  $: filtered = events.filter((e) => {
    if (Date.now() - new Date(e.eventTimeUtc).getTime() > WINDOW_MS[window]) return false;
    if (e.magnitude != null && e.magnitude < minMag) return false;
    if (e.magnitude == null && minMag > 0) return false;
    if (onlyTsunamiFlag && !e.tsunamiFlag) return false;
    if (onlyReviewed && e.status !== "reviewed") return false;
    return true;
  });

  // El detalle se deriva de los eventos FILTRADOS: si el seleccionado deja de
  // estar en los resultados (al filtrar), su detalle se oculta automáticamente.
  $: selectedEvent = selectedId ? (filtered.find((e) => e.id === selectedId) ?? null) : null;

  // Limpia la selección cuando cambian los filtros.
  let lastFilterKey = "";
  $: filterKey = `${window}|${minMag}|${onlyTsunamiFlag}|${onlyReviewed}`;
  $: if (filterKey !== lastFilterKey) {
    lastFilterKey = filterKey;
    selectedId = null;
  }

  function toggleSelect(id: string): void {
    selectedId = selectedId === id ? null : id;
  }

  // Auto-refresco cada 5 min (y al recuperar conexión). El refresco silencioso
  // no muestra el spinner ni pierde el filtro/selección actuales.
  const REFRESH_MS = 5 * 60 * 1000;

  async function load(silent = false) {
    if (!silent) state = "loading";
    try {
      const [e, t] = await Promise.all([
        fetchWithCache("events", () => getSeismicEvents()),
        fetchWithCache("tsunami", getCurrentTsunami),
      ]);
      events = e.data;
      tsunami = t.data;
      offline = e.fromCache || t.fromCache;
      state = "ready";
    } catch {
      if (!silent) state = "error";
    }
  }

  onMount(() => {
    load();
    const id = setInterval(() => load(true), REFRESH_MS);
    const onOnline = () => load(true);
    window.addEventListener("online", onOnline);
    return () => {
      clearInterval(id);
      window.removeEventListener("online", onOnline);
    };
  });
</script>

<div class="head">
  <div>
    <h1>Mapa sísmico</h1>
    <p class="sub">Secuencia de eventos sísmicos registrados en Venezuela y zonas cercanas.</p>
  </div>
  <button type="button" class="reload" on:click={() => load()} aria-label="Recargar">↻</button>
</div>

{#if offline}
  <p class="offline">Sin conexión. Mostrando últimos datos guardados; pueden estar desactualizados.</p>
{/if}

{#if state === "loading"}
  <p class="muted">Cargando últimos datos...</p>
{:else if state === "error"}
  <p class="muted">No se pudo actualizar la información y no hay datos guardados. Verifica fuentes oficiales.</p>
{:else}
  <TsunamiAlertCard current={tsunami} />

  <div class="toolbar">
    <SeismicFilters bind:window bind:minMag bind:onlyTsunamiFlag bind:onlyReviewed />
    <div class="viewtoggle" role="group" aria-label="Vista">
      <button type="button" class:active={view === "list"} on:click={() => (view = "list")}>Lista</button>
      <button type="button" class:active={view === "map"} on:click={() => (view = "map")}>Mapa</button>
    </div>
  </div>

  <p class="count">{filtered.length} evento(s)</p>

  {#if view === "map"}
    <SeismicMap events={filtered} onSelect={toggleSelect} />
    {#if selectedEvent}
      <div class="detail-wrap">
        <EventDetail event={selectedEvent} onClose={() => (selectedId = null)} />
      </div>
    {/if}
  {:else}
    <!-- En lista, el detalle se despliega inline bajo cada registro. -->
    <SeismicList events={filtered} {selectedId} onSelect={toggleSelect} />
  {/if}
{/if}

<style>
  .head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--space-3);
    margin-bottom: var(--space-3);
  }
  h1 {
    font-size: var(--font-2xl);
    margin: 0;
  }
  .sub {
    margin: var(--space-1) 0 0;
    color: var(--color-text-muted);
    font-size: var(--font-sm);
  }
  .reload {
    background: var(--color-surface-raised);
    border: 1px solid var(--color-border);
    color: var(--color-text);
    border-radius: var(--radius-md);
    min-width: 44px;
    min-height: 44px;
    font-size: var(--font-lg);
    cursor: pointer;
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
  .toolbar {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    margin: var(--space-4) 0 var(--space-2);
  }
  .viewtoggle {
    display: flex;
    gap: var(--space-2);
  }
  .viewtoggle button {
    flex: 1;
    min-height: 40px;
    background: var(--color-surface-raised);
    border: 1px solid var(--color-border);
    color: var(--color-text-muted);
    border-radius: var(--radius-sm);
  }
  .viewtoggle button.active {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
  .count {
    color: var(--color-text-soft);
    font-size: var(--font-sm);
    margin: 0 0 var(--space-3);
  }
  .detail-wrap {
    margin-top: var(--space-4);
  }
  .muted {
    color: var(--color-text-soft);
  }
  @media (min-width: 1024px) {
    .toolbar {
      flex-direction: row;
      justify-content: space-between;
      align-items: flex-start;
    }
    .viewtoggle {
      width: 220px;
    }
  }
</style>
