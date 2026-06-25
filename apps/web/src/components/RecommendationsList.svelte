<script lang="ts">
  import { onMount } from "svelte";
  import type { RecommendationDTO } from "@sismicaid/shared";
  import { getRecommendations } from "../lib/api";
  import RecommendationCard from "./RecommendationCard.svelte";

  // Etiquetas y orden de presentación por contexto (lo crítico primero).
  const CONTEXT_LABELS: Record<string, string> = {
    earthquake_during: "Durante un sismo",
    tsunami: "Amenaza de tsunami",
    coast: "Si estás en la costa",
    earthquake_after: "Después de un sismo",
    damaged_building: "Edificios dañados",
    earthquake_before: "Prepárate antes",
    communications: "Comunicación en emergencia",
  };
  const ORDER = Object.keys(CONTEXT_LABELS);

  let state: "loading" | "ready" | "error" = "loading";
  let recs: RecommendationDTO[] = [];

  $: groups = ORDER.map((ctx) => ({
    context: ctx,
    label: CONTEXT_LABELS[ctx] ?? ctx,
    items: recs.filter((r) => r.context === ctx),
  })).filter((g) => g.items.length > 0);

  onMount(async () => {
    try {
      recs = await getRecommendations();
      state = "ready";
    } catch {
      state = "error";
    }
  });
</script>

{#if state === "loading"}
  <p class="muted">Cargando recomendaciones...</p>
{:else if state === "error"}
  <p class="muted">No se pudieron cargar las recomendaciones. Verifica tu conexión e inténtalo de nuevo.</p>
{:else if recs.length === 0}
  <p class="muted">No hay recomendaciones disponibles por ahora.</p>
{:else}
  {#each groups as group}
    <section>
      <h2>{group.label}</h2>
      <div class="grid">
        {#each group.items as rec (rec.id)}
          <RecommendationCard {rec} />
        {/each}
      </div>
    </section>
  {/each}
{/if}

<style>
  section {
    margin-bottom: var(--space-6);
  }
  h2 {
    font-size: var(--font-xl);
    color: var(--color-text);
    margin: 0 0 var(--space-3);
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-3);
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
