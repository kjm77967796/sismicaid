// Severidad sísmica por magnitud -> color (design.md §11). Reutilizado por
// EventCard y, más adelante, por el mapa sísmico.
export type Severity = "low" | "medium" | "high" | "severe" | "critical";

export function magnitudeSeverity(mag: number | null): Severity {
  if (mag == null || mag < 4) return "low";
  if (mag < 5) return "medium";
  if (mag < 6) return "high";
  if (mag < 7) return "severe";
  return "critical";
}

export const SEVERITY_COLOR: Record<Severity, string> = {
  low: "var(--quake-low)",
  medium: "var(--quake-medium)",
  high: "var(--quake-high)",
  severe: "var(--quake-severe)",
  critical: "var(--quake-critical)",
};

// Hex crudo para contextos que no resuelven var() (atributos SVG de Leaflet).
// Debe coincidir con las variables --quake-* de tokens.css.
export const SEVERITY_HEX: Record<Severity, string> = {
  low: "#22c55e",
  medium: "#facc15",
  high: "#f97316",
  severe: "#ef4444",
  critical: "#a855f7",
};
