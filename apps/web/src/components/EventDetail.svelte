<script lang="ts">
  import type { SeismicEventDTO } from "@sismicaid/shared";

  export let event: SeismicEventDTO;
  export let onClose: () => void = () => {};

  const fmt = (v: number | null, suffix = "") => (v != null ? `${v}${suffix}` : "—");
  $: rows = [
    ["Magnitud", event.magnitude != null ? `${event.magnitude} ${event.magnitudeType ?? ""}`.trim() : "—"],
    ["Lugar", event.place || "—"],
    ["Hora UTC", new Date(event.eventTimeUtc).toISOString().replace("T", " ").slice(0, 19)],
    ["Hora local (VET)", event.eventTimeLocal ? event.eventTimeLocal.replace("T", " ") : "—"],
    ["Latitud", fmt(event.latitude)],
    ["Longitud", fmt(event.longitude)],
    ["Profundidad", fmt(event.depthKm, " km")],
    ["Intensidad estimada (MMI)", fmt(event.mmi)],
    ["Intensidad reportada (CDI)", fmt(event.cdi)],
    ["Estado de revisión", event.status === "reviewed" ? "Revisado" : "Automático"],
    ["Nivel de alerta (PAGER)", event.alertLevel === "unknown" ? "—" : event.alertLevel],
    ["Fuente", event.source],
  ] as Array<[string, string]>;
</script>

<aside class="detail">
  <header>
    <h3>Detalle del evento</h3>
    <button type="button" on:click={onClose} aria-label="Cerrar detalle">✕</button>
  </header>

  <dl>
    {#each rows as [k, v]}
      <div><dt>{k}</dt><dd>{v}</dd></div>
    {/each}
  </dl>

  {#if event.tsunamiFlag}
    <p class="flag">
      Este evento trae bandera de tsunami de la fuente. <strong>No equivale a una alerta de tsunami activa</strong>; el
      estado de tsunami se consulta arriba.
    </p>
  {/if}

  {#if event.detailUrl}
    <a class="src" href={event.detailUrl} target="_blank" rel="noopener noreferrer">Ver en la fuente oficial →</a>
  {/if}
</aside>

<style>
  .detail {
    background: var(--color-surface-raised);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  h3 {
    margin: 0;
    font-size: var(--font-lg);
  }
  header button {
    background: none;
    border: none;
    color: var(--color-text-soft);
    font-size: var(--font-lg);
    cursor: pointer;
    min-width: 44px;
    min-height: 44px;
  }
  dl {
    margin: var(--space-2) 0 0;
    display: flex;
    flex-direction: column;
  }
  dl div {
    display: flex;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-2) 0;
    border-bottom: 1px solid var(--color-border-soft);
  }
  dt {
    color: var(--color-text-soft);
    font-size: var(--font-sm);
  }
  dd {
    margin: 0;
    color: var(--color-text);
    font-size: var(--font-sm);
    text-align: right;
  }
  .flag {
    margin: var(--space-3) 0 0;
    color: var(--color-warning);
    font-size: var(--font-sm);
  }
  .src {
    display: inline-block;
    margin-top: var(--space-3);
    color: var(--color-primary);
    text-decoration: none;
    font-size: var(--font-sm);
  }
</style>
