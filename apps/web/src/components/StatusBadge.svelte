<script lang="ts">
  // Badge pequeño con texto y color semántico. Nunca depende solo del color
  // (siempre lleva texto) — accesibilidad (design.md §12).
  export let label: string;
  export let variant:
    | "official"
    | "verified"
    | "pending"
    | "outdated"
    | "canceled"
    | "critical"
    | "info"
    | "success"
    | "warning"
    | "danger"
    | "neutral" = "neutral";

  const COLORS: Record<string, string> = {
    official: "var(--color-info)",
    verified: "var(--color-success)",
    pending: "var(--color-warning)",
    outdated: "var(--color-text-soft)",
    canceled: "var(--color-text-soft)",
    critical: "var(--color-critical)",
    info: "var(--color-info)",
    success: "var(--color-success)",
    warning: "var(--color-warning)",
    danger: "var(--color-danger)",
    neutral: "var(--color-text-soft)",
  };
  $: color = COLORS[variant] ?? COLORS.neutral;
</script>

<span class="badge" style={`--c:${color}`}>{label}</span>

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    padding: 2px var(--space-2);
    border-radius: var(--radius-full);
    border: 1px solid var(--c);
    color: var(--c);
    font-size: var(--font-xs);
    line-height: 1.4;
    white-space: nowrap;
  }
</style>
