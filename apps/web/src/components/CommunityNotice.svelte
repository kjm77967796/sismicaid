<script lang="ts">
  // Aviso claro: estos datos los comparte la comunidad y NO están verificados
  // ni son oficiales (regla de docs/CLAUDE.md / SECURITY_AND_PRIVACY.md).
  export let text =
    "Esta información la comparten otros usuarios. No está verificada ni es oficial. Confírmala antes de actuar.";
</script>

<p class="notice" role="note">⚠ {text}</p>

<style>
  .notice {
    background: var(--color-surface);
    border-left: 4px solid var(--color-warning);
    color: var(--color-text-muted);
    border-radius: var(--radius-md);
    padding: var(--space-3) var(--space-4);
    font-size: var(--font-sm);
    margin-bottom: var(--space-4);
  }
</style>
