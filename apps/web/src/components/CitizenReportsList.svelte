<script lang="ts">
  import { onMount } from "svelte";
  import type { CitizenReportDTO, ReportType, Urgency } from "@sismicaid/shared";
  import { getReports } from "../lib/api";
  import { fetchWithCache } from "../lib/cache";
  import { REPORT_TYPE_LABEL, URGENCY_LABEL } from "../lib/labels";
  import { VENEZUELA_STATES } from "../lib/venezuela";
  import { INCIDENT_REPORT_TYPES, incidentReportsQuery } from "../lib/reportGroups";
  import StatusBadge from "./StatusBadge.svelte";
  import ReportCard from "./ReportCard.svelte";

  // Solo incidentes: las ayudas van en /ayuda y las necesidades en /necesidades.
  const REPORT_TYPES = INCIDENT_REPORT_TYPES.map((t) => [t, REPORT_TYPE_LABEL[t]] as [ReportType, string]);
  const URGENCIES = Object.entries(URGENCY_LABEL) as Array<[Urgency, string]>;

  let state: "loading" | "ready" | "error" = "loading";
  let offline = false;
  let reports: CitizenReportDTO[] = [];
  let stateFilter = "";
  let reportTypeFilter = "";
  let urgencyFilter = "";

  $: filtered = reports.filter(
    (r) =>
      (!stateFilter || r.state === stateFilter) &&
      (!reportTypeFilter || r.reportType === reportTypeFilter) &&
      (!urgencyFilter || r.urgency === urgencyFilter),
  );

  onMount(async () => {
    try {
      const res = await fetchWithCache("incident-reports", () => getReports(incidentReportsQuery));
      reports = res.data;
      offline = res.fromCache;
      state = "ready";
    } catch {
      state = "error";
    }
  });
</script>

<section class="reports" aria-labelledby="reportes-recientes">
  <div class="head">
    <div>
      <h2 id="reportes-recientes">Incidentes reportados recientemente</h2>
      <p>Daños, peligros y bloqueos compartidos por la comunidad. Sin verificar; no son datos oficiales. (La ayuda y las necesidades tienen su propia sección.)</p>
    </div>
    <StatusBadge label="Ciudadano" variant="pending" />
  </div>

  {#if offline}
    <p class="offline">Sin conexión. Mostrando últimos reportes guardados.</p>
  {/if}

  {#if state === "loading"}
    <p class="muted">Cargando reportes recientes...</p>
  {:else if state === "error"}
    <p class="muted">No se pudieron cargar los reportes ciudadanos. Verifica tu conexión.</p>
  {:else}
    <div class="filters">
      <label>
        Estado
        <select bind:value={stateFilter}>
          <option value="">Todos</option>
          {#each VENEZUELA_STATES as s}<option value={s}>{s}</option>{/each}
        </select>
      </label>
      <label>
        Tipo
        <select bind:value={reportTypeFilter}>
          <option value="">Todos</option>
          {#each REPORT_TYPES as [value, label]}<option value={value}>{label}</option>{/each}
        </select>
      </label>
      <label>
        Urgencia
        <select bind:value={urgencyFilter}>
          <option value="">Todas</option>
          {#each URGENCIES as [value, label]}<option value={value}>{label}</option>{/each}
        </select>
      </label>
    </div>

    {#if filtered.length === 0}
      <p class="muted">No hay reportes ciudadanos con estos filtros.</p>
    {:else}
      <div class="list">
        {#each filtered as report (report.id)}
          <ReportCard {report} />
        {/each}
      </div>
    {/if}
  {/if}
</section>

<style>
  .reports {
    margin-top: var(--space-8);
  }
  .head {
    display: flex;
    justify-content: space-between;
    gap: var(--space-3);
    align-items: flex-start;
    margin-bottom: var(--space-4);
  }
  h2 {
    font-size: var(--font-xl);
    margin: 0 0 var(--space-1);
  }
  p {
    color: var(--color-text-muted);
    margin: 0;
  }
  .filters {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-3);
    margin-bottom: var(--space-4);
  }
  label {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    font-size: var(--font-sm);
    color: var(--color-text-muted);
  }
  select {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    color: var(--color-text);
    border-radius: var(--radius-md);
    padding: 0.75rem;
    min-height: 44px;
  }
  .list {
    display: grid;
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
    .filters {
      grid-template-columns: repeat(3, 1fr);
    }
    .list {
      grid-template-columns: 1fr 1fr;
    }
  }
</style>
