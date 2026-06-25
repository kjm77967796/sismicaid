<script lang="ts">
  import type { CitizenReportDTO } from "@sismicaid/shared";
  import { REPORT_TYPE_LABEL, URGENCY_LABEL } from "../lib/labels";
  import StatusBadge from "./StatusBadge.svelte";

  export let report: CitizenReportDTO;

  $: place = report.state + (report.municipality ? ` · ${report.municipality}` : "");
  let copied = false;

  async function copy() {
    const lines = [
      `${REPORT_TYPE_LABEL[report.reportType]}: ${report.title}`,
      place,
      `Urgencia: ${URGENCY_LABEL[report.urgency]}`,
      "Información ciudadana sin verificar — confírmala antes de actuar.",
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      copied = true;
      setTimeout(() => (copied = false), 1500);
    } catch {
      copied = false;
    }
  }
</script>

<article class="card">
  <div class="meta">
    <StatusBadge label="Sin verificar" variant="pending" />
    <span>{REPORT_TYPE_LABEL[report.reportType]}</span>
    <span>{new Date(report.createdAt).toLocaleString("es-VE")}</span>
  </div>
  <h3>{report.title}</h3>
  {#if report.publicSafeSummary}<p class="summary">{report.publicSafeSummary}</p>{/if}
  <dl>
    <div><dt>Zona</dt><dd>{place}</dd></div>
    <div><dt>Urgencia</dt><dd>{URGENCY_LABEL[report.urgency]}</dd></div>
    <div><dt>Ubicación</dt><dd>Aproximada</dd></div>
  </dl>
  <button type="button" class="copy" on:click={copy}>{copied ? "Copiado ✓" : "Copiar"}</button>
</article>

<style>
  .card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    align-items: center;
    color: var(--color-text-soft);
    font-size: var(--font-xs);
  }
  h3 {
    margin: var(--space-2) 0;
    font-size: var(--font-lg);
  }
  .summary {
    color: var(--color-text-muted);
    margin: 0;
  }
  dl {
    display: grid;
    gap: var(--space-2);
    margin: var(--space-3) 0 0;
  }
  dl div {
    display: flex;
    justify-content: space-between;
    gap: var(--space-3);
  }
  dt {
    color: var(--color-text-soft);
  }
  dd {
    margin: 0;
    text-align: right;
  }
  .copy {
    margin-top: var(--space-3);
    background: var(--color-surface-raised);
    border: 1px solid var(--color-border);
    color: var(--color-text);
    border-radius: var(--radius-sm);
    padding: var(--space-2) var(--space-3);
    min-height: 36px;
    cursor: pointer;
    font-size: var(--font-sm);
  }
</style>
