<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import type * as L from "leaflet";
  import type { SeismicEventDTO } from "@sismicaid/shared";
  import { magnitudeSeverity, SEVERITY_HEX } from "../lib/severity";

  export let events: SeismicEventDTO[] = [];
  export let onSelect: (id: string) => void = () => {};

  let container: HTMLDivElement;
  // Leaflet se importa SOLO al montar este componente (carga diferida): la lista
  // nunca depende del mapa ni carga esta librería pesada por defecto.
  let leaflet: typeof import("leaflet") | null = null;
  let map: L.Map | null = null;
  let layer: L.LayerGroup | null = null;

  const LEGEND = [
    { label: "Leve", color: SEVERITY_HEX.low },
    { label: "Moderado", color: SEVERITY_HEX.medium },
    { label: "Fuerte", color: SEVERITY_HEX.high },
    { label: "Severo", color: SEVERITY_HEX.severe },
    { label: "Crítico", color: SEVERITY_HEX.critical },
  ];

  function draw() {
    if (!map || !leaflet) return;
    if (layer) layer.remove();
    const lg = leaflet.layerGroup();
    for (const e of events) {
      const color = SEVERITY_HEX[magnitudeSeverity(e.magnitude)];
      const radius = 4 + (e.magnitude ?? 0) * 2;
      const marker = leaflet.circleMarker([e.latitude, e.longitude], {
        radius,
        color,
        fillColor: color,
        fillOpacity: 0.5,
        weight: 1,
      });
      marker.bindTooltip(`M${e.magnitude ?? "—"} · ${e.place ?? ""}`);
      marker.on("click", () => onSelect(e.id));
      marker.addTo(lg);
    }
    lg.addTo(map);
    layer = lg;
  }

  onMount(async () => {
    await import("leaflet/dist/leaflet.css");
    leaflet = await import("leaflet");
    map = leaflet.map(container).setView([10.5, -66.9], 6);
    leaflet
      .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 18,
      })
      .addTo(map);
    draw();
  });

  // Redibuja al cambiar los eventos filtrados.
  $: if (map && leaflet && events) draw();

  onDestroy(() => {
    map?.remove();
    map = null;
  });
</script>

<div class="wrap">
  <div class="map" bind:this={container}></div>
  <ul class="legend" aria-label="Leyenda de severidad sísmica">
    {#each LEGEND as l}
      <li><span class="dot" style={`background:${l.color}`}></span>{l.label}</li>
    {/each}
  </ul>
</div>

<style>
  .map {
    height: 360px;
    width: 100%;
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-border);
    z-index: 0;
  }
  .legend {
    list-style: none;
    margin: var(--space-2) 0 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
  }
  .legend li {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    font-size: var(--font-xs);
    color: var(--color-text-muted);
  }
  .dot {
    width: 12px;
    height: 12px;
    border-radius: var(--radius-full);
  }
</style>
