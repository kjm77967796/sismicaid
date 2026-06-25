<script lang="ts">
  import type { ResourceDTO } from "@sismicaid/shared";
  import {
    CAPACITY_LABEL,
    RESOURCE_STATUS_LABEL,
    RESOURCE_TYPE_LABEL,
    VERIFICATION_LABEL,
    VERIFICATION_VARIANT,
  } from "../lib/labels";
  import StatusBadge from "./StatusBadge.svelte";
  import LastUpdated from "./LastUpdated.svelte";

  export let resource: ResourceDTO;

  const STATUS_VARIANT = { active: "success", saturated: "warning", closed: "danger", unknown: "neutral" } as const;

  $: place = [resource.municipality, resource.state].filter(Boolean).join(", ");
  let copied = false;

  async function copy() {
    const lines = [
      `${RESOURCE_TYPE_LABEL[resource.type]}: ${resource.name}`,
      place,
      `Estado: ${RESOURCE_STATUS_LABEL[resource.status]} · ${CAPACITY_LABEL[resource.capacityStatus]}`,
      resource.publicContact ? `Contacto: ${resource.publicContact}` : "",
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
    <h3>{resource.name}</h3>
    <StatusBadge label={VERIFICATION_LABEL[resource.verificationStatus]} variant={VERIFICATION_VARIANT[resource.verificationStatus]} />
  </header>
  <p class="type">{RESOURCE_TYPE_LABEL[resource.type]} · {place}</p>
  <div class="badges">
    <StatusBadge label={RESOURCE_STATUS_LABEL[resource.status]} variant={STATUS_VARIANT[resource.status]} />
    <StatusBadge label={CAPACITY_LABEL[resource.capacityStatus]} variant="neutral" />
  </div>
  {#if resource.description}<p class="desc">{resource.description}</p>{/if}
  {#if resource.publicContact}<p class="contact">Contacto: {resource.publicContact}</p>{/if}
  <footer>
    <LastUpdated iso={resource.lastVerifiedAt} />
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
  .type {
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
  .contact {
    margin: 0;
    color: var(--color-text);
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
