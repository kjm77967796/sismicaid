<script lang="ts">
  import type { NeedDTO } from "@sismicaid/shared";
  import { NEED_STATUS_LABEL, URGENCY_LABEL, VERIFICATION_LABEL, VERIFICATION_VARIANT } from "../lib/labels";
  import StatusBadge from "./StatusBadge.svelte";
  import LastUpdated from "./LastUpdated.svelte";

  export let need: NeedDTO;

  const URGENCY_VARIANT = { low: "neutral", medium: "info", high: "warning", critical: "critical" } as const;

  $: place = [need.municipality, need.state].filter(Boolean).join(", ");
  let copied = false;

  async function copy() {
    const lines = [
      `Necesidad: ${need.title}`,
      `Categoría: ${need.category}`,
      place,
      `Urgencia: ${URGENCY_LABEL[need.urgency]} · Estado: ${NEED_STATUS_LABEL[need.status]}`,
      need.quantity ? `Cantidad: ${need.quantity}` : "",
    ].filter(Boolean);
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
  <header>
    <h3>{need.title}</h3>
    <StatusBadge label={URGENCY_LABEL[need.urgency]} variant={URGENCY_VARIANT[need.urgency]} />
  </header>
  <p class="meta">{need.category} · {place}</p>
  <div class="badges">
    <StatusBadge label={NEED_STATUS_LABEL[need.status]} variant="neutral" />
    {#if need.quantity}<StatusBadge label={`Cantidad: ${need.quantity}`} variant="neutral" />{/if}
    <StatusBadge label={VERIFICATION_LABEL[need.verificationStatus]} variant={VERIFICATION_VARIANT[need.verificationStatus]} />
  </div>
  {#if need.description}<p class="desc">{need.description}</p>{/if}
  <footer>
    <LastUpdated iso={need.lastVerifiedAt} />
    <button type="button" on:click={copy}>{copied ? "Copiado ✓" : "Copiar"}</button>
  </footer>
</article>

<style>
  .card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: var(--space-2);
  }
  h3 {
    margin: 0;
    font-size: var(--font-lg);
  }
  .meta {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-sm);
  }
  .badges {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
  }
  .desc {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-sm);
  }
  footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: var(--space-1);
  }
  footer button {
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
