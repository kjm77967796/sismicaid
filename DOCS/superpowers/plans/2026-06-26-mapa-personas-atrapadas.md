# Mapa de personas atrapadas (rescate) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mostrar reportes ciudadanos de personas atrapadas (`trapped_person`) en un mapa y lista de rescate, con ubicación aproximada (nunca exacta), estado "rescatado" y reportes sin verificar claramente marcados.

**Architecture:** Reutiliza el tipo de reporte `trapped_person`, la tabla `citizen_reports` y el patrón Leaflet de `SeismicMap.svelte`. El backend expone un DTO de mapa con coordenadas redondeadas a rejilla (~1 km) en un endpoint nuevo; el frontend añade una ruta `/rescate` con mapa de círculos + lista paralela + filtros + offline. Única adición de esquema: `citizen_reports.resolved_at`.

**Tech Stack:** Fastify + Prisma (PostgreSQL) en `apps/api`; Astro + Svelte + Leaflet en `apps/web`; tipos compartidos en `packages/shared`. Tests backend con `node:test` (`node --import tsx --test`).

---

## File Structure

- `apps/api/src/lib/geo.ts` — **Crear.** Función pura `roundToGrid` para difuminar coordenadas.
- `apps/api/src/lib/geo.test.ts` — **Crear.** Test de `roundToGrid`.
- `apps/api/prisma/schema.prisma` — **Modificar.** Añadir `resolvedAt` a `CitizenReport`.
- `apps/api/prisma/migrations/<ts>_trapped_resolved_at/migration.sql` — **Crear** (vía `prisma migrate dev`).
- `packages/shared/src/dto.ts` — **Modificar.** Añadir `TrappedPersonMarkerDTO`.
- `apps/api/src/services/trapped-persons.ts` — **Crear.** Listado → markers + marcar resuelto.
- `apps/api/src/services/trapped-persons.test.ts` — **Crear.** Test del mapeo a DTO.
- `apps/api/src/routes.ts` — **Modificar.** `GET /api/trapped-persons` + `PATCH /api/reports/:id/resolve`.
- `apps/api/.env.example` — **Modificar.** Documentar `MODERATION_TOKEN`.
- `apps/web/src/lib/api.ts` — **Modificar.** Cliente `getTrappedPersons`.
- `apps/web/src/lib/urgency.ts` — **Crear.** Color por urgencia (hex para Leaflet).
- `apps/web/src/components/RescueMap.svelte` — **Crear.** Mapa de círculos.
- `apps/web/src/components/RescueView.svelte` — **Crear.** Orquesta mapa + lista + filtros + offline.
- `apps/web/src/pages/rescate.astro` — **Crear.** Ruta `/rescate`.
- `apps/web/src/pages/index.astro` — **Modificar.** Acceso rápido a `/rescate`.

---

## Task 1: Función pura de difuminado de coordenadas

**Files:**
- Create: `apps/api/src/lib/geo.ts`
- Test: `apps/api/src/lib/geo.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/api/src/lib/geo.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { roundToGrid } from "./geo";

test("redondea a rejilla de 0.01° (~1 km)", () => {
  assert.equal(roundToGrid(10.512345), 10.51);
  assert.equal(roundToGrid(-66.918765), -66.92);
});

test("es determinista: misma entrada, misma salida", () => {
  assert.equal(roundToGrid(10.512345), roundToGrid(10.512345));
});

test("nunca conserva más de 2 decimales (no expone la coordenada exacta)", () => {
  const r = roundToGrid(10.512999);
  assert.equal(Math.round(r * 100) / 100, r);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/api && node --import tsx --test src/lib/geo.test.ts`
Expected: FAIL — `Cannot find module './geo'`.

- [ ] **Step 3: Write minimal implementation**

```ts
// apps/api/src/lib/geo.ts
// Difumina una coordenada redondeándola a una rejilla de 0.01° (~1.1 km).
// Determinista: el mismo reporte siempre cae en la misma celda (no "salta").
// Privacidad: el público nunca recibe la coordenada exacta de una persona
// atrapada (SECURITY_AND_PRIVACY.md). Ver spec 2026-06-26.
export function roundToGrid(coord: number): number {
  return Math.round(coord * 100) / 100;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/api && node --import tsx --test src/lib/geo.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/lib/geo.ts apps/api/src/lib/geo.test.ts
git commit -m "feat(api): roundToGrid para difuminar coordenadas de rescate"
```

---

## Task 2: Esquema — `resolved_at` en citizen_reports

**Files:**
- Modify: `apps/api/prisma/schema.prisma:344-369`

- [ ] **Step 1: Add the column to the model**

En `model CitizenReport`, añade la línea `resolvedAt` justo después de `moderatorNotes`:

```prisma
  moderatorNotes     String?                  @map("moderator_notes")
  // Marca cuándo se confirmó el rescate/cierre. NULL = activo. Spec rescate.
  resolvedAt         DateTime?                @map("resolved_at")
  createdAt          DateTime                 @default(now()) @map("created_at")
```

- [ ] **Step 2: Generate the migration**

Run: `cd apps/api && pnpm prisma migrate dev --name trapped_resolved_at`
Expected: crea `prisma/migrations/<ts>_trapped_resolved_at/migration.sql` con
`ALTER TABLE "citizen_reports" ADD COLUMN "resolved_at" TIMESTAMP(3);` y regenera el cliente Prisma.

> Si no hay base de datos local disponible, genera solo el SQL con
> `pnpm prisma migrate dev --create-only --name trapped_resolved_at` y luego
> `pnpm prisma generate`.

- [ ] **Step 3: Verify the client compiles**

Run: `cd apps/api && pnpm typecheck`
Expected: PASS (sin errores).

- [ ] **Step 4: Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations
git commit -m "feat(api): columna resolved_at en citizen_reports"
```

---

## Task 3: DTO compartido `TrappedPersonMarkerDTO`

**Files:**
- Modify: `packages/shared/src/dto.ts` (después de `CitizenReportDTO`, ~línea 160)

- [ ] **Step 1: Add the DTO**

```ts
// packages/shared/src/dto.ts
// Marcador de mapa de rescate. NO expone coordenadas exactas: approxLat/approxLng
// vienen redondeadas a rejilla (~1 km) por el servidor. Nunca nombres ni contacto.
export interface TrappedPersonMarkerDTO {
  id: string;
  approxLat: number;
  approxLng: number;
  municipality: string | null;
  urgency: Urgency;
  verificationStatus: ReportVerificationStatus;
  resolved: boolean;
  createdAt: string;
}
```

> `Urgency` y `ReportVerificationStatus` ya se importan en este archivo (usados por `CitizenReportDTO`). No añadas imports nuevos. Se exporta solo con `export * from "./dto"` en `index.ts` (ya existe).

- [ ] **Step 2: Verify shared builds**

Run: `cd packages/shared && pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/shared/src/dto.ts
git commit -m "feat(shared): TrappedPersonMarkerDTO"
```

---

## Task 4: Servicio `trapped-persons`

**Files:**
- Create: `apps/api/src/services/trapped-persons.ts`
- Test: `apps/api/src/services/trapped-persons.test.ts`

- [ ] **Step 1: Write the failing test**

El test prueba la función pura de mapeo (sin DB), igual que `usgs.test.ts` prueba `mapUsgsFeature`.

```ts
// apps/api/src/services/trapped-persons.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { toMarkerDTO } from "./trapped-persons";
import type { CitizenReport } from "../generated/prisma";

const base = {
  id: "r1",
  reportType: "trapped_person",
  title: "Persona atrapada",
  description: "texto privado",
  state: "La Guaira",
  municipality: "Vargas",
  parish: null,
  latitude: 10.612345,
  longitude: -66.918765,
  locationPrecision: "approximate",
  urgency: "critical",
  evidenceUrl: null,
  reportSourceType: "first_hand",
  privateContact: "0414...",
  publicSafeSummary: "Atrapada en planta baja",
  verificationStatus: "pending",
  moderatorNotes: null,
  resolvedAt: null,
  createdAt: new Date("2026-06-26T12:00:00Z"),
  updatedAt: new Date("2026-06-26T12:00:00Z"),
} as unknown as CitizenReport;

test("difumina las coordenadas (no expone las exactas)", () => {
  const dto = toMarkerDTO(base);
  assert.equal(dto.approxLat, 10.61);
  assert.equal(dto.approxLng, -66.92);
});

test("no incluye campos privados ni coordenadas exactas", () => {
  const dto = toMarkerDTO(base) as Record<string, unknown>;
  assert.equal("latitude" in dto, false);
  assert.equal("longitude" in dto, false);
  assert.equal("privateContact" in dto, false);
  assert.equal("description" in dto, false);
});

test("resolved deriva de resolvedAt", () => {
  assert.equal(toMarkerDTO(base).resolved, false);
  assert.equal(toMarkerDTO({ ...base, resolvedAt: new Date() }).resolved, true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/api && node --import tsx --test src/services/trapped-persons.test.ts`
Expected: FAIL — `Cannot find module './trapped-persons'`.

- [ ] **Step 3: Write minimal implementation**

```ts
// apps/api/src/services/trapped-persons.ts
import type { TrappedPersonMarkerDTO } from "@sismicaid/shared";
import { prisma } from "../db";
import type { CitizenReport } from "../generated/prisma";
import { roundToGrid } from "../lib/geo";

// DTO de mapa: coordenadas difuminadas, sin nombres ni campos privados.
export function toMarkerDTO(r: CitizenReport): TrappedPersonMarkerDTO {
  return {
    id: r.id,
    approxLat: roundToGrid(r.latitude as number),
    approxLng: roundToGrid(r.longitude as number),
    municipality: r.municipality,
    urgency: r.urgency,
    verificationStatus: r.verificationStatus,
    resolved: r.resolvedAt != null,
    createdAt: r.createdAt.toISOString(),
  };
}

// Lista de marcadores para el mapa de rescate. Devuelve también resueltos:
// el cliente decide si los oculta (filtro de presentación).
export async function listTrappedPersons(): Promise<TrappedPersonMarkerDTO[]> {
  const rows = await prisma.citizenReport.findMany({
    where: {
      reportType: "trapped_person",
      verificationStatus: { notIn: ["rejected", "duplicate"] },
      latitude: { not: null },
      longitude: { not: null },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return rows.map(toMarkerDTO);
}

// Marca un reporte como rescatado/cerrado. Devuelve null si no existe.
export async function resolveTrappedPerson(id: string): Promise<TrappedPersonMarkerDTO | null> {
  const existing = await prisma.citizenReport.findUnique({ where: { id } });
  if (!existing || existing.reportType !== "trapped_person") return null;
  const updated = await prisma.citizenReport.update({
    where: { id },
    data: { resolvedAt: new Date() },
  });
  return toMarkerDTO(updated);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/api && node --import tsx --test src/services/trapped-persons.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/services/trapped-persons.ts apps/api/src/services/trapped-persons.test.ts
git commit -m "feat(api): servicio trapped-persons (markers difuminados + resolver)"
```

---

## Task 5: Rutas + token de moderación

**Files:**
- Modify: `apps/api/src/routes.ts`
- Modify: `apps/api/.env.example`

No hay sistema de auth todavía; la acción de moderación se protege con un token
compartido por cabecera. Mínimo y honesto: no es un panel completo, pero evita
una mutación abierta. (ponytail: `x-moderation-token` vía env; subir a auth real
cuando exista el panel `/admin`.)

- [ ] **Step 1: Add the import**

En `apps/api/src/routes.ts`, junto a los otros imports de servicios:

```ts
import { listTrappedPersons, resolveTrappedPerson } from "./services/trapped-persons";
```

- [ ] **Step 2: Register the GET endpoint**

Dentro de `registerRoutes`, después del bloque `app.get("/api/reports", ...)`:

```ts
  app.get("/api/trapped-persons", async () => listTrappedPersons());
```

- [ ] **Step 3: Register the protected resolve endpoint**

Justo debajo del anterior:

```ts
  // Acción de moderación: marcar zona como rescatada. Protegida por token
  // compartido (no hay auth aún). Devuelve 401 sin token válido.
  app.patch("/api/reports/:id/resolve", async (req, reply) => {
    const token = req.headers["x-moderation-token"];
    const expected = process.env.MODERATION_TOKEN;
    if (!expected || token !== expected) {
      return reply.code(401).send({ error: "unauthorized" });
    }
    const { id } = req.params as { id: string };
    const dto = await resolveTrappedPerson(id);
    if (!dto) return reply.code(404).send({ error: "not_found" });
    return dto;
  });
```

- [ ] **Step 4: Document the env var**

En `apps/api/.env.example`, añade al final:

```
# Token para acciones de moderación (marcar rescatado). Sin definir, el endpoint
# de resolución responde 401. No comitear el valor real.
# MODERATION_TOKEN=cambia-esto
```

- [ ] **Step 5: Verify typecheck**

Run: `cd apps/api && pnpm typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/routes.ts apps/api/.env.example
git commit -m "feat(api): endpoints trapped-persons + resolver con token de moderación"
```

---

## Task 6: Cliente API + color por urgencia (web)

**Files:**
- Modify: `apps/web/src/lib/api.ts`
- Create: `apps/web/src/lib/urgency.ts`

- [ ] **Step 1: Add the API client method**

En `apps/web/src/lib/api.ts`, añade `TrappedPersonMarkerDTO` al import de tipos
desde `@sismicaid/shared` y, al final del archivo:

```ts
export function getTrappedPersons(): Promise<TrappedPersonMarkerDTO[]> {
  return apiGet<TrappedPersonMarkerDTO[]>("/api/trapped-persons");
}
```

- [ ] **Step 2: Create the urgency color helper**

```ts
// apps/web/src/lib/urgency.ts
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
```

- [ ] **Step 3: Verify typecheck**

Run: `cd apps/web && pnpm typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/api.ts apps/web/src/lib/urgency.ts
git commit -m "feat(web): cliente getTrappedPersons + colores de urgencia"
```

---

## Task 7: Componente `RescueMap.svelte`

**Files:**
- Create: `apps/web/src/components/RescueMap.svelte`

Sigue el patrón de `SeismicMap.svelte` (carga diferida de Leaflet, capa única,
fallback a lista en el componente padre). Diferencia clave: dibuja `L.circle`
de ~1 km (zona, no pin); borde punteado para no verificados; atenúa resueltos.

- [ ] **Step 1: Create the component**

```svelte
<!-- apps/web/src/components/RescueMap.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import type * as L from "leaflet";
  import type { TrappedPersonMarkerDTO } from "@sismicaid/shared";
  import { URGENCY_HEX, URGENCY_LABEL } from "../lib/urgency";

  export let markers: TrappedPersonMarkerDTO[] = [];

  let container: HTMLDivElement;
  let leaflet: typeof import("leaflet") | null = null;
  let map: L.Map | null = null;
  let layer: L.LayerGroup | null = null;

  const LEGEND = [
    { label: "Crítica", color: URGENCY_HEX.critical },
    { label: "Alta", color: URGENCY_HEX.high },
    { label: "Media", color: URGENCY_HEX.medium },
    { label: "Baja", color: URGENCY_HEX.low },
  ];

  function draw() {
    if (!map || !leaflet) return;
    if (layer) layer.remove();
    const lg = leaflet.layerGroup();
    for (const m of markers) {
      const color = URGENCY_HEX[m.urgency];
      const unverified = m.verificationStatus !== "verified";
      const circle = leaflet.circle([m.approxLat, m.approxLng], {
        radius: 1000, // metros: comunica que es una ZONA aproximada, no un punto
        color,
        fillColor: color,
        fillOpacity: m.resolved ? 0.08 : 0.25,
        weight: 2,
        opacity: m.resolved ? 0.4 : 1,
        dashArray: unverified ? "5,5" : undefined,
      });
      const estado = m.resolved
        ? "Rescatado"
        : unverified
          ? "Sin verificar"
          : "Verificado";
      circle.bindTooltip(
        `Urgencia ${URGENCY_LABEL[m.urgency]} · ${estado}${m.municipality ? " · " + m.municipality : ""}`,
      );
      circle.addTo(lg);
    }
    lg.addTo(map);
    layer = lg;
  }

  onMount(async () => {
    await import("leaflet/dist/leaflet.css");
    leaflet = await import("leaflet");
    map = leaflet.map(container).setView([10.5, -66.9], 7);
    leaflet
      .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 18,
      })
      .addTo(map);
    draw();
  });

  $: if (map && leaflet && markers) draw();

  onDestroy(() => {
    map?.remove();
    map = null;
  });
</script>

<div class="wrap">
  <div class="map" bind:this={container}></div>
  <ul class="legend" aria-label="Leyenda de urgencia">
    {#each LEGEND as l}
      <li><span class="dot" style={`background:${l.color}`}></span>{l.label}</li>
    {/each}
    <li><span class="dot dashed"></span>Sin verificar</li>
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
    font-size: var(--font-sm);
    color: var(--color-text-soft);
  }
  .dot {
    display: inline-block;
    width: 0.75rem;
    height: 0.75rem;
    border-radius: var(--radius-full);
    margin-right: var(--space-1);
    vertical-align: middle;
  }
  .dot.dashed {
    background: transparent;
    border: 2px dashed var(--color-text-soft);
  }
</style>
```

- [ ] **Step 2: Verify typecheck**

Run: `cd apps/web && pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/RescueMap.svelte
git commit -m "feat(web): RescueMap con círculos de zona y marcado sin verificar"
```

---

## Task 8: Componente `RescueView.svelte` (mapa + lista + filtros + offline)

**Files:**
- Create: `apps/web/src/components/RescueView.svelte`

Orquesta como `SismosView`: carga con `fetchWithCache`, filtros, lista paralela
(regla SPEC: nunca solo mapa), aviso offline.

- [ ] **Step 1: Create the component**

```svelte
<!-- apps/web/src/components/RescueView.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import type { TrappedPersonMarkerDTO } from "@sismicaid/shared";
  import { getTrappedPersons } from "../lib/api";
  import { fetchWithCache } from "../lib/cache";
  import { URGENCY_HEX, URGENCY_LABEL } from "../lib/urgency";
  import RescueMap from "./RescueMap.svelte";

  let state: "loading" | "ready" = "loading";
  let fromCache = false;
  let all: TrappedPersonMarkerDTO[] = [];

  // Filtros de presentación.
  let onlyVerified = false;
  let showResolved = false;

  $: visible = all.filter(
    (m) =>
      (showResolved || !m.resolved) &&
      (!onlyVerified || m.verificationStatus === "verified"),
  );

  function estado(m: TrappedPersonMarkerDTO): string {
    if (m.resolved) return "Rescatado";
    return m.verificationStatus === "verified" ? "Verificado" : "Sin verificar";
  }

  onMount(async () => {
    const res = await fetchWithCache("trapped-persons", getTrappedPersons).catch(() => null);
    if (res) {
      all = res.data;
      fromCache = res.fromCache;
    }
    state = "ready";
  });
</script>

<p class="notice">
  Reportes ciudadanos sin verificar. Ubicación aproximada por seguridad. No incluye nombres.
</p>

{#if fromCache}
  <p class="offline">Sin conexión. Mostrando últimos datos guardados, posiblemente desactualizados.</p>
{/if}

<div class="filters">
  <label><input type="checkbox" bind:checked={onlyVerified} /> Solo verificados</label>
  <label><input type="checkbox" bind:checked={showResolved} /> Mostrar rescatados</label>
</div>

{#if state === "loading"}
  <p class="muted">Cargando últimos datos...</p>
{:else}
  <RescueMap markers={visible} />

  {#if visible.length === 0}
    <p class="muted">No hay reportes de personas atrapadas según la última actualización.</p>
  {:else}
    <ul class="list">
      {#each visible as m (m.id)}
        <li>
          <span class="badge" style={`background:${URGENCY_HEX[m.urgency]}`}>
            {URGENCY_LABEL[m.urgency]}
          </span>
          <div>
            <strong>{m.municipality ?? "Ubicación aproximada"}</strong>
            <span class="est">{estado(m)}</span>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
{/if}

<style>
  .notice {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-3);
    color: var(--color-text-muted);
    font-size: var(--font-sm);
    margin: 0 0 var(--space-4);
  }
  .offline {
    color: var(--color-warning);
    font-size: var(--font-sm);
    margin: 0 0 var(--space-3);
  }
  .filters {
    display: flex;
    gap: var(--space-4);
    margin: 0 0 var(--space-4);
    font-size: var(--font-sm);
    color: var(--color-text-muted);
  }
  .muted {
    color: var(--color-text-soft);
    margin-top: var(--space-4);
  }
  .list {
    list-style: none;
    padding: 0;
    margin: var(--space-4) 0 0;
    display: grid;
    gap: var(--space-2);
  }
  .list li {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-3);
  }
  .badge {
    color: #fff;
    border-radius: var(--radius-full);
    padding: 0.125rem 0.625rem;
    font-size: var(--font-xs);
    white-space: nowrap;
  }
  .est {
    color: var(--color-text-soft);
    font-size: var(--font-sm);
    margin-left: var(--space-2);
  }
</style>
```

- [ ] **Step 2: Verify typecheck**

Run: `cd apps/web && pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/RescueView.svelte
git commit -m "feat(web): RescueView con lista paralela, filtros y offline"
```

---

## Task 9: Ruta `/rescate` + acceso desde la home

**Files:**
- Create: `apps/web/src/pages/rescate.astro`
- Modify: `apps/web/src/pages/index.astro`

- [ ] **Step 1: Create the page**

Sigue la estructura de `apps/web/src/pages/recomendaciones.astro` (layout `Base`,
header con enlace a Inicio, componente con `client:load`).

```astro
---
import Base from "../layouts/Base.astro";
import RescueView from "../components/RescueView.svelte";
import { link } from "../lib/links";
---

<Base title="Personas atrapadas · Sismicaid">
  <main>
    <header>
      <a href={link("/")} class="back">← Inicio</a>
      <h1>Personas atrapadas</h1>
      <p class="lead">Reportes ciudadanos de rescate por zona. Ubicación aproximada, sin nombres.</p>
    </header>
    <RescueView client:load />
  </main>
</Base>

<style>
  main {
    max-width: 880px;
    margin: 0 auto;
    padding: var(--space-5) var(--space-4) var(--space-8);
  }
  header {
    margin-bottom: var(--space-6);
  }
  .back {
    color: var(--color-primary);
    text-decoration: none;
    font-size: var(--font-sm);
  }
  h1 {
    font-size: var(--font-2xl);
    margin: var(--space-2) 0 var(--space-1);
  }
  .lead {
    color: var(--color-text-muted);
    margin: 0;
  }
</style>
```

- [ ] **Step 2: Add a quick-access link on the home**

Abre `apps/web/src/pages/index.astro`. Localiza el bloque de accesos rápidos
(enlaces a `/sismos`, `/ayuda`, `/reportar`, etc., usando el helper `link()`).
Añade, siguiendo exactamente el mismo marcado que los enlaces hermanos, uno a
`/rescate` con el texto "Personas atrapadas". Ejemplo del patrón a replicar
(ajusta la clase/estructura a la que ya exista en el archivo):

```astro
<a href={link("/rescate")} class="quick-action">Personas atrapadas</a>
```

> Si los accesos rápidos viven en un componente Svelte (p. ej. `HomeView.svelte`)
> en vez de en `index.astro`, añade el enlace allí siguiendo el mismo patrón.
> No dupliques estilos: reutiliza la clase existente de los demás accesos.

- [ ] **Step 3: Build the web app**

Run: `cd apps/web && pnpm build`
Expected: build OK; entre las rutas generadas aparece `/rescate/index.html`.

- [ ] **Step 4: Verify the route is precached for offline**

El `globPatterns` del SW (`astro.config.mjs`) ya incluye todos los `**/*.html`,
así que `/rescate/index.html` queda precacheado automáticamente. Confirma en la
salida del build que el conteo de "precache entries" aumentó respecto al anterior.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/pages/rescate.astro apps/web/src/pages/index.astro
git commit -m "feat(web): ruta /rescate y acceso desde la home"
```

---

## Task 10: Verificación final

- [ ] **Step 1: Run the full backend test suite**

Run: `cd apps/api && pnpm test`
Expected: PASS (incluye `geo.test.ts` y `trapped-persons.test.ts`).

- [ ] **Step 2: Typecheck both apps**

Run: `cd apps/api && pnpm typecheck && cd ../web && pnpm typecheck`
Expected: PASS en ambos.

- [ ] **Step 3: Manual smoke (con API y DB arriba)**

1. Crea un reporte `trapped_person` con coordenadas vía `/reportar` o `POST /api/reports`.
2. `GET /api/trapped-persons` → el item aparece con `approxLat`/`approxLng`
   redondeadas a 2 decimales y **sin** `latitude`/`longitude`/`privateContact`.
3. Abre `/rescate`: el círculo aparece con borde punteado (sin verificar) y en la lista.
4. `PATCH /api/reports/:id/resolve` con cabecera `x-moderation-token` válida → 200;
   sin cabecera → 401. Tras resolver, el círculo desaparece salvo "Mostrar rescatados".

---

## Notas de cierre

- **Dependencia conocida:** la resolución usa un token compartido por env, no auth
  real. Migrar a la autorización del panel `/admin` cuando exista (SPEC §5.8).
- **Fuera de alcance (confirmado en spec):** nombres, fotos, registro buscable,
  tiempo real, clustering, selector de mapa en el formulario.
