import type { Urgency } from "@sismicaid/shared";

// Color por urgencia para el mapa de rescate (design.md §3 estados).
// Hex crudo: los atributos SVG de Leaflet no resuelven var().
export const URGENCY_HEX: Record<Urgency, string> = {
  critical: "#dc2626",
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#22c55e",
};

export const URGENCY_LABEL: Record<Urgency, string> = {
  critical: "Crítica",
  high: "Alta",
  medium: "Media",
  low: "Baja",
};
