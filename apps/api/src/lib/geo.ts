// apps/api/src/lib/geo.ts
// Difumina una coordenada redondeándola a una rejilla de 0.01° (~1.1 km).
// Determinista: el mismo reporte siempre cae en la misma celda (no "salta").
// Privacidad: el público nunca recibe la coordenada exacta de una persona
// atrapada (SECURITY_AND_PRIVACY.md). Ver spec 2026-06-26.
export function roundToGrid(coord: number): number {
  return Math.round(coord * 100) / 100;
}
