<script lang="ts">
  import type { CurrentTsunamiDTO } from "@sismicaid/shared";
  import { link } from "../lib/links";
  import LastUpdated from "./LastUpdated.svelte";

  export let current: CurrentTsunamiDTO | null;

  // Estado de tsunami SOLO desde boletines oficiales (nunca del tsunami_flag).
  const STATUS_META: Record<string, { color: string; label: string; action: string }> = {
    information: { color: "var(--tsunami-info)", label: "Información", action: "Mantente atento a fuentes oficiales." },
    watch: { color: "var(--tsunami-watch)", label: "Vigilancia", action: "Prepárate para alejarte de la costa." },
    advisory: { color: "var(--tsunami-watch)", label: "Aviso", action: "Aléjate de playas y zonas bajas de la costa." },
    warning: { color: "var(--tsunami-warning)", label: "Alerta", action: "Aléjate de la costa y busca terreno alto ahora." },
    canceled: { color: "var(--tsunami-canceled)", label: "Cancelada", action: "Mantente atento a nuevas actualizaciones oficiales." },
    unknown: { color: "var(--tsunami-canceled)", label: "Sin clasificar", action: "Consulta fuentes oficiales." },
  };

  $: alert = current?.alert ?? null;
  $: meta = alert ? (STATUS_META[alert.status] ?? STATUS_META.unknown) : null;
</script>

{#if alert && meta}
  <article class="card" style={`--c:${meta.color}`}>
    <header>
      <span class="state">Tsunami: {meta.label}</span>
      <LastUpdated iso={current?.lastCheckedAt ?? null} />
    </header>
    <p class="headline">{alert.headline}</p>
    {#if alert.affectedAreaText}<p class="area">Zona: {alert.affectedAreaText}</p>{/if}
    <p class="action">{meta.action}</p>
    <footer>
      <span class="src">Fuente: {alert.provider}</span>
      {#if alert.effectiveAt}<span class="src">Emitido: {new Date(alert.effectiveAt).toLocaleString("es-VE")}</span>{/if}
      <a href={link("/recomendaciones")}>Qué hacer ahora →</a>
    </footer>
  </article>
{:else}
  <article class="card" style="--c: var(--tsunami-none)">
    <header>
      <span class="state">Sin alerta de tsunami vigente</span>
      <LastUpdated iso={current?.lastCheckedAt ?? null} />
    </header>
    <p class="action">
      No hay datos de alerta de tsunami activa según la última fuente consultada. Consulta fuentes oficiales antes de
      acercarte a la costa.
    </p>
  </article>
{/if}

<style>
  .card {
    border: 1px solid var(--color-border);
    border-left: 4px solid var(--c);
    background: var(--color-surface);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: var(--space-3);
    flex-wrap: wrap;
  }
  .state {
    color: var(--c);
    font-size: var(--font-lg);
    font-weight: 700;
  }
  .headline {
    margin: var(--space-2) 0 0;
    color: var(--color-text);
  }
  .area {
    margin: var(--space-1) 0 0;
    color: var(--color-text-muted);
    font-size: var(--font-sm);
  }
  .action {
    margin: var(--space-2) 0 0;
    color: var(--color-text-muted);
  }
  footer {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    align-items: center;
    margin-top: var(--space-3);
  }
  .src {
    font-size: var(--font-xs);
    color: var(--color-text-soft);
  }
  a {
    color: var(--color-primary);
    text-decoration: none;
    font-size: var(--font-sm);
    margin-left: auto;
  }
</style>
