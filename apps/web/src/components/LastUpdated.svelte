<script lang="ts">
  // Muestra cuán reciente es un dato. Pasa a color warning si supera el umbral.
  export let iso: string | null;
  export let fromCache = false;
  export let thresholdMin = 30;

  function relative(isoStr: string): { text: string; minutes: number } {
    const then = new Date(isoStr).getTime();
    const minutes = Math.max(0, Math.round((Date.now() - then) / 60000));
    if (minutes < 1) return { text: "hace segundos", minutes };
    if (minutes < 60) return { text: `hace ${minutes} min`, minutes };
    const hours = Math.round(minutes / 60);
    if (hours < 24) return { text: `hace ${hours} h`, minutes };
    return { text: `hace ${Math.round(hours / 24)} d`, minutes };
  }

  $: info = iso ? relative(iso) : null;
  $: stale = info ? info.minutes > thresholdMin : true;
</script>

<span class="lu" class:stale class:cache={fromCache}>
  {#if fromCache}
    Datos guardados sin conexión{info ? ` · ${info.text}` : ""}
  {:else if info}
    Actualizado {info.text}
  {:else}
    Sin datos recientes
  {/if}
</span>

<style>
  .lu {
    font-size: var(--font-sm);
    color: var(--color-text-soft);
  }
  .lu.stale,
  .lu.cache {
    color: var(--color-warning);
  }
</style>
