# Sismicaid — Plan de desarrollo por slices (MVP)

> **Para workers agénticos:** SUB-SKILL REQUERIDA: usa `superpowers:subagent-driven-development` o `superpowers:executing-plans` para ejecutar slice por slice. Cada slice debería expandirse a tareas TDD con la skill de proyecto `build-feature-slice` (o `add-official-source` para ingesta) antes de tocar código.

**Goal:** Llevar el esqueleto actual a un MVP usable: sismos oficiales (USGS), estado de tsunami (NOAA/PTWC), recomendaciones, reportes ciudadanos moderados, y ayuda/necesidades verificadas — mobile-first, dark mode, con fallback offline.

**Architecture:** Monorepo pnpm. `apps/api` (Fastify + PostgreSQL vía Drizzle) expone DTOs públicos seguros; jobs internos de ingesta normalizan fuentes oficiales a tablas locales. `apps/web` (Astro + Svelte) consume la API, siempre con vista lista además de mapa, y cachea el último dato para offline. `packages/shared` es la frontera de tipos.

**Tech Stack:** Astro 4, Svelte 4, Fastify 4, Prisma ORM (PostgreSQL), Zod (validación en frontera), Leaflet (mapa, carga diferida), TypeScript estricto, CSS puro.

---

## Revisión de diseño — hallazgos que el plan respeta

Antes de los slices, los puntos críticos que se derivan de CLAUDE.md y los docs, y cómo el plan los honra:

1. **`tsunami_flag` ≠ alerta activa de tsunami.** Son dos cosas distintas en dos tablas (`seismic_events.tsunami_flag` vs `tsunami_alerts.status`). En la UI **nunca** se renderiza `tsunami_flag` como alerta. La tarjeta de tsunami (Slice 4) solo lee `tsunami_alerts` / `coastal_alert_zones`. El flag del evento se muestra, como mucho, como metadato neutro ("el evento trae bandera de tsunami de la fuente; no implica alerta activa").
2. **No inventar datos oficiales.** Los endpoints no implementados devuelven `501` (ya es así), nunca mock. Solo se "siembra" lo que NO es dato oficial dinámico: geometría de zonas costeras (estática) y recomendaciones (texto curado desde fuentes oficiales). Sismos y tsunami solo entran por fetch real.
3. **Privacidad (SECURITY_AND_PRIVACY.md).** DTOs ya excluyen `private_contact` y direcciones exactas. `CreateReportInput` acepta `privateContact` pero ningún DTO público lo devuelve. **Evidencia en MVP = solo URL/enlace**, no subida de imágenes → se evita el riesgo de EXIF por completo (subida + stripping EXIF se difiere a un slice posterior, ver Riesgos).
4. **Reportes ciudadanos siempre `pending`.** Forzado en el handler, no confiando en el cliente. Más rate limit + sanitización en la frontera.
5. **Siempre lista junto al mapa.** `/sismos` se construye lista primero (Slice 6); Leaflet se añade como capa opcional con carga diferida, nunca como única vía.
6. **Decisión de ORM:** Prisma (elegido por el equipo). `schema.prisma` como fuente del esquema + `prisma migrate` para migraciones versionadas. Nota: se reemplaza la conexión `postgres-js` actual de `apps/api/src/db.ts` por `PrismaClient` en Slice 1.

---

## Estado actual (Slice 0 — COMPLETO)

Hecho y verificado (`pnpm typecheck` limpio): monorepo, `packages/shared` (enums + DTOs), `apps/api` (Fastify + `/health` + `/api/status` honesto + stubs 501 + conexión postgres perezosa), `apps/web` (Astro+Svelte, tokens CSS, layout base, home placeholder).

---

## Slice 1 — Fundación de datos (Prisma + esquema + seed de fuentes)

**Objetivo:** Tener PostgreSQL con las tablas base de `docs/DATABASE.md`, migraciones versionadas con Prisma, y `official_sources` sembrado. Sin ingesta todavía.

**Archivos:**
- Crear: `apps/api/prisma/schema.prisma` (datasource + generator + modelos: `OfficialSource`, `SeismicEvent`, `TsunamiAlert`, `CoastalAlertZone`, `Resource`, `Need`, `CitizenReport`, `SafetyRecommendation`, `FetchRun`, con `@@map` a snake_case y `enum` Prisma alineados a `shared`)
- Crear: `apps/api/prisma/migrations/` (migración generada por `prisma migrate dev`)
- Crear: `apps/api/prisma/seed-sources.ts` (USGS, NOAA_PTWC, NOAA_NTWC, FUNVISIS, Protección Civil — solo metadatos de fuente, no datos)
- Modificar: `apps/api/src/db.ts` (reemplazar `postgres-js` por `export const prisma = new PrismaClient()`, singleton)
- Modificar: `apps/api/package.json` (quitar `postgres`; añadir `prisma` dev + `@prisma/client`; scripts `db:migrate` → `prisma migrate dev`, `db:generate` → `prisma generate`, `seed:sources`)

**Pasos clave:**
1. Añadir `prisma` (dev) + `@prisma/client`. Definir `schema.prisma`: `enum`s con exactamente los mismos literales que `packages/shared/src/enums.ts`; índices de `SeismicEvent` (`@@index` sobre `externalId`, `eventTimeUtc`, `magnitude`, `[latitude, longitude]`, `sourceId`, `tsunamiFlag`); `rawPayload Json`.
2. `prisma migrate dev --name init` → migración versionada. Revisar el SQL generado.
3. Seed idempotente de `official_sources` vía `prisma.officialSource.upsert` por `name`.
4. Reemplazar `db.ts` por el singleton de `PrismaClient`; eliminar `requireSql`.

**Criterios de verificación:**
- `pnpm --filter @sismicaid/api db:migrate` crea las 9 tablas (verificar con `\dt` o `information_schema`).
- `pnpm --filter @sismicaid/api seed:sources` deja N filas en `official_sources`; correrlo dos veces no duplica (upsert).
- `pnpm typecheck` limpio (con cliente Prisma generado).
- Test: `node --test` que valide que cada `enum` de Prisma cubre los mismos literales que el union type de `shared` (evita deriva enum↔DB).

**Riesgos:**
- Deriva entre enums de `shared` y los `enum` de Prisma → mitigado con el test de paridad.
- `prisma generate` debe correr antes de `typecheck`/`build` (añadir a `postinstall` o documentarlo).
- Requiere Postgres corriendo localmente; documentar en `.env.example` (ya existe `DATABASE_URL`). Sugerir `docker run postgres` o Neon.

---

## Slice 2 — Ingesta USGS + endpoints sísmicos

**Objetivo:** Job que trae sismos reales de USGS (bbox Venezuela/Caribe, SPEC §7.5), los normaliza a `seismic_events` (upsert por `external_id`), registra `fetch_runs`, y los expone. Usar la skill `add-official-source`.

**Archivos:**
- Crear: `apps/api/src/jobs/fetch-usgs.ts` (fetch GeoJSON + normalización + upsert + fetch_run)
- Crear: `apps/api/src/mappers/usgs.ts` (USGS feature → fila `seismic_events`; pura, testeable)
- Crear: `apps/api/src/services/seismic.ts` (queries con filtros de API.md)
- Modificar: `apps/api/src/routes.ts` (implementar `GET /api/seismic-events`, `GET /api/seismic-events/:id`, y números reales en `/api/status`)
- Modificar: `apps/api/package.json` (script `fetch:usgs`)
- Test: `apps/api/src/mappers/usgs.test.ts` (con un payload USGS real guardado como fixture)

**Pasos clave:**
1. TDD del mapper con un fixture GeoJSON real de USGS (guardar `raw_payload`; convertir hora UTC→VET; mapear `mag`, `depth`, `mmi`, `cdi`, `alert`, `tsunami`→`tsunami_flag`, `sig`, `felt`).
2. Job: fetch con `fetch` nativo, bbox SPEC §7.5, `minmagnitude` configurable (default 2.5), upsert por `external_id` (no duplicar; actualizar si cambió magnitud/intensidad/estado), escribir `fetch_runs`.
3. Servicio + endpoints con filtros: `from,to,minMagnitude,maxMagnitude,minDepth,maxDepth,source,hasTsunamiFlag,alertLevel,bbox`. Devolver `SeismicEventDTO`, nunca la entidad cruda.
4. `/api/status`: `seismic.recentCount` y `lastUpdatedAt` reales desde el último `fetch_run` exitoso.

**Criterios de verificación:**
- `node --test` del mapper pasa con el fixture (incluye caso `tsunami=1` → `tsunamiFlag:true`, y que NO genera ninguna alerta de tsunami).
- `pnpm --filter @sismicaid/api fetch:usgs` inserta eventos; segunda corrida actualiza, no duplica (contar filas).
- `GET /api/seismic-events?minMagnitude=4` filtra correctamente (curl/httpie).
- `GET /api/seismic-events/:id` devuelve DTO; id inexistente → 404.
- `pnpm typecheck` limpio.

**Riesgos:**
- `tsunami_flag` mal interpretado → el test exige explícitamente que el flag NO crea ni implica alerta.
- Formato USGS cambia / feed caído → `fetch_runs.status=failed` con `error_message`; el endpoint sigue sirviendo lo cacheado en DB.
- Zona horaria VET (UTC-4, sin DST) → fijar offset explícito, con test.

---

## Slice 3 — Tsunami (PTWC) + zonas costeras

**Objetivo:** Estado de tsunami desde fuente oficial, separado del flag sísmico. Zonas costeras base sembradas (geometría estática, SPEC §7.2.5). Usar `add-official-source`.

**Archivos:**
- Crear: `apps/api/src/jobs/fetch-ptwc.ts` (feed Atom/CAP PTWC → `tsunami_alerts`)
- Crear: `apps/api/src/mappers/ptwc.ts` (CAP → fila; estado: information/watch/advisory/warning/canceled/unknown)
- Crear: `apps/api/src/seeds/coastal-zones.ts` (La Guaira, Falcón, Carabobo, Aragua, Miranda, Anzoátegui, Sucre, Nueva Esparta, Zulia, Delta Amacuro — geometría simplificada por estado)
- Crear: `apps/api/src/services/tsunami.ts`
- Modificar: `apps/api/src/routes.ts` (`GET /api/tsunami-alerts/current`, `GET /api/coastal-zones`, `tsunami` en `/api/status`)
- Test: `apps/api/src/mappers/ptwc.test.ts` (fixture CAP real, incluido caso `canceled`)

**Pasos clave:**
1. TDD del mapper PTWC con fixture (incluir un boletín `canceled` y uno `warning`).
2. Seed idempotente de zonas costeras con `risk_level` inicial `none`.
3. Job PTWC: guardar boletines, `effective_at`/`expires_at`, inferir `related_seismic_event_id` si es posible (best-effort), `fetch_runs`.
4. `GET /api/tsunami-alerts/current`: devuelve la alerta vigente más relevante o un estado "sin alerta" honesto; marcar como desactualizado si supera el umbral.
5. `GET /api/coastal-zones`: zonas con su `risk_level`.

**Criterios de verificación:**
- `node --test` PTWC pasa; el caso `canceled` produce `status:"canceled"` y el `current` lo refleja, no lo trata como warning.
- Sin boletines → `current` responde estado vacío honesto (no inventa "sin alerta" como afirmación oficial; texto de SPEC §5.2 "No hay datos de tsunami…").
- `GET /api/coastal-zones` devuelve las 10 zonas.
- `pnpm typecheck` limpio.

**Riesgos:**
- Confundir flag sísmico con alerta → reforzado: este slice es la ÚNICA fuente de "alerta de tsunami" en toda la app.
- Feed PTWC con formato irregular / vacío → estado desactualizado explícito, nunca falso negativo silencioso.
- Geometría costera: usar simplificada y etiquetarla como aproximada; no implica precisión oficial.

---

## Slice 4 — Recomendaciones (seed + endpoint + pantalla)

**Objetivo:** `/recomendaciones` con guías claras por contexto. Contenido curado (no dato oficial dinámico).

**Archivos:**
- Crear: `apps/api/src/seeds/recommendations.ts` (contextos de `enums.ts`: earthquake_before/during/after, tsunami, coast, damaged_building, communications — textos de SPEC §5.6)
- Modificar: `apps/api/src/routes.ts` (`GET /api/recommendations?context=`)
- Crear: `apps/web/src/lib/api.ts` (cliente fetch tipado con `@sismicaid/shared`)
- Crear: `apps/web/src/pages/recomendaciones.astro`
- Crear: `apps/web/src/components/RecommendationCard.svelte`

**Criterios de verificación:**
- `GET /api/recommendations` y `?context=tsunami` filtran.
- Página renderiza tarjetas (título + 2–4 bullets) según `docs/design.md` §RecommendationCard.
- `astro check` limpio. Mobile-first verificable a 360px.

**Riesgos:** bajo. Solo cuidar que los textos no sean alarmistas ni prometan predicción.

---

## Slice 5 — Home + estado general (web) con fallback offline

**Objetivo:** `/` muestra estado general consumiendo `/api/status` + último sismo, con banner offline y datos cacheados.

**Archivos:**
- Crear: `apps/web/src/pages/index.astro` (reemplaza placeholder)
- Crear: `apps/web/src/components/StatusBanner.svelte`, `EventCard.svelte`, `StatusBadge.svelte`, `SourceBadge.svelte`, `LastUpdated.svelte`
- Crear: `apps/web/src/lib/cache.ts` (último payload en `localStorage`/Cache API)
- Crear: `apps/web/src/components/BottomNav.svelte` (Inicio, Sismos, Ayuda, Reportar, Guía)

**Criterios de verificación:**
- Con API arriba: banner correcto (sin alerta / sismo reciente / tsunami).
- Con API caída: muestra último dato cacheado + "Mostrando últimos datos guardados" (SPEC §5.1 estados de error).
- Estado vacío con el copy exacto de SPEC cuando no hay eventos.
- `astro check` limpio; nav inferior fija en móvil.

**Riesgos:** que el cache muestre datos viejos sin avisar → `LastUpdated` con color warning pasado el umbral.

---

## Slice 6 — /sismos (lista primero, mapa opcional)

**Objetivo:** Pantalla sísmica completa: tarjeta tsunami (de Slice 3, no del flag), evento principal, lista filtrable, detalle, y mapa Leaflet diferido. Usar `build-feature-slice`.

**Archivos:**
- Crear: `apps/web/src/pages/sismos.astro`
- Crear: `apps/web/src/components/TsunamiAlertCard.svelte` (lee tsunami-alerts/current)
- Crear: `apps/web/src/components/SeismicList.svelte`, `SeismicFilters.svelte`, `EventDetail.svelte`
- Crear: `apps/web/src/components/SeismicMap.svelte` (Leaflet, `client:visible`, leyenda)
- Modificar: `apps/web/src/lib/api.ts`
- Modificar: `apps/web/package.json` (`leaflet`, `@types/leaflet`)

**Criterios de verificación:**
- Lista funciona y filtra SIN mapa (deshabilitar JS del mapa y sigue usable).
- Filtros de SPEC §5.2 (última hora/6h/24h/7d, magnitud, etc.).
- Tarjeta tsunami refleja `tsunami_alerts`, no `tsunami_flag`; detalle de evento muestra el flag solo como metadato etiquetado.
- Leyendas de mapa presentes (design.md §11). `astro check` limpio.

**Riesgos:**
- Leaflet pesado / bloquea en móvil → carga diferida `client:visible`, altura controlada; lista nunca depende del mapa.
- Tentación de pintar el flag como alerta en el mapa → prohibido; capa de tsunami solo desde `coastal-zones`.

---

## Slice 7 — Reportes ciudadanos (/reportar + POST seguro)

**Objetivo:** Crear reportes en <60s, siempre `pending`, con validación en frontera, rate limit, y guardado offline. Usar `build-feature-slice`.

**Archivos:**
- Crear: `apps/api/src/validation/report.ts` (esquema Zod de `CreateReportInput`)
- Crear: `apps/api/src/services/reports.ts` (insert forzando `verification_status='pending'`)
- Modificar: `apps/api/src/routes.ts` (`POST /api/reports`)
- Modificar: `apps/api/package.json` (`zod`, `@fastify/rate-limit`)
- Crear: `apps/web/src/pages/reportar.astro`
- Crear: `apps/web/src/components/ReportForm.svelte` (máx 4 pasos)
- Crear: `apps/web/src/lib/outbox.ts` (cola local + reenvío al recuperar conexión)
- Test: `apps/api/src/validation/report.test.ts`

**Pasos clave:**
1. TDD Zod: rechaza tipos inválidos, exige `state`/`urgency`/`reportType`/`locationPrecision`; sanitiza/recorta strings; **evidencia solo URL** (no archivo).
2. Servicio: ignora cualquier `verification_status` entrante y fuerza `pending`; nunca devuelve `private_contact` en la respuesta (devuelve `CitizenReportDTO`).
3. Rate limit en `POST /api/reports` (p.ej. 5/min por IP).
4. Form 4 pasos (tipo → ubicación aproximada → urgencia/descr → enviar); guardado en outbox si offline; reintento al volver online.

**Criterios de verificación:**
- `node --test` validación: payload malicioso/incompleto → rechazado; `privateContact` no aparece en el DTO de respuesta.
- `POST /api/reports` válido → 201 con `verification_status:"pending"`; intento de forzar `verified` se ignora.
- Rate limit responde 429 al exceder.
- Offline: el form guarda local y reenvía al reconectar (simular con devtools).
- `astro check` + `pnpm typecheck` limpios.

**Riesgos:**
- Filtración de datos sensibles → DTO seguro + test que verifica ausencia de `private_contact`.
- Spam/abuso → rate limit + `pending` obligatorio.
- EXIF: se evita al no aceptar imágenes en MVP (ver slice diferido).

---

## Slice 8 — Ayuda y necesidades (lectura, datos verificados/manuales)

**Objetivo:** `/ayuda` y `/necesidades` mostrando recursos y necesidades verificados o manuales (sin reportes sin verificar mezclados).

**Archivos:**
- Crear: `apps/api/src/services/resources.ts`, `apps/api/src/services/needs.ts`
- Modificar: `apps/api/src/routes.ts` (`GET /api/resources`, `GET /api/needs`)
- Crear: `apps/web/src/pages/ayuda.astro`, `apps/web/src/pages/necesidades.astro`
- Crear: componentes `ResourceCard.svelte`, `NeedCard.svelte`

**Criterios de verificación:**
- Endpoints devuelven solo DTOs sin coordenadas exactas cuando `location_precision != 'exact'` para datos sensibles.
- No se exponen direcciones privadas ni contacto privado.
- Filtros básicos de SPEC §5.3/§5.4. `astro check` limpio.

**Riesgos:** exponer ubicación privada → DTO degrada precisión; recursos entran solo `verified`/manual en MVP.

---

## Slices diferidos (fuera de MVP, anotados para no perderlos)

- **PWA / Service Worker** completo (offline avanzado, install prompt).
- **Subida de imágenes + stripping EXIF** (SECURITY_AND_PRIVACY.md) — hasta entonces, evidencia = solo URL.
- **/estado/:slug** (página por estado/municipio, SPEC §5.7).
- **/admin** (moderación, SPEC §5.8) + roles.
- **FUNVISIS** como fuente (cuando haya formato estable; mientras, manual/verificable).
- **NOAA_NTWC** además de PTWC.

---

## Self-review (cobertura vs docs)

- API.md: los 9 endpoints quedan cubiertos (status S2, seismic S2, tsunami+coastal S3, recommendations S4, reports S7, resources+needs S8). ✓
- DATABASE.md: 9 tablas en S1; `external_id`/`raw_payload`/`fetch_run` cubiertos en S1–S3. ✓
- SECURITY_AND_PRIVACY.md: DTOs seguros, `pending` forzado, rate limit, sin contacto/dirección privada, EXIF evitado por diseño. ✓
- design.md: tokens (S0), componentes y mobile-first (S4–S8), lista+mapa con leyenda (S6). ✓
- CLAUDE.md reglas: sin datos oficiales inventados (501/fetch real), `tsunami_flag`≠alerta (S2/S3/S6), slices pequeños, sin Tailwind. ✓
```
