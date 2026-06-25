<script lang="ts">
  export let variant: "success" | "info" | "warning" | "danger" | "neutral" = "neutral";
  export let title: string;
  export let detail: string | null = null;

  const COLORS: Record<string, string> = {
    success: "var(--color-success)",
    info: "var(--color-info)",
    warning: "var(--color-warning)",
    danger: "var(--color-danger)",
    neutral: "var(--color-text-soft)",
  };
  $: color = COLORS[variant] ?? COLORS.neutral;
</script>

<div class="banner" style={`--c:${color}`} role="status">
  <strong>{title}</strong>
  {#if detail}<span>{detail}</span>{/if}
</div>

<style>
  .banner {
    display: flex;
    flex-direction: column;
    gap: 2px;
    border-left: 4px solid var(--c);
    background: var(--color-surface);
    border-radius: var(--radius-md);
    padding: var(--space-3) var(--space-4);
  }
  strong {
    color: var(--c);
    font-size: var(--font-lg);
  }
  span {
    color: var(--color-text-muted);
    font-size: var(--font-sm);
  }
</style>
