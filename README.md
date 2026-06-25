# Sismicaid

**PWA de emergencia para Venezuela.** Centraliza información sísmica oficial,
estado de tsunami, recomendaciones de prevención, y ayuda/necesidades
compartidas por la comunidad — rápida, ligera, mobile-first, dark mode y usable
con mala conexión.

> Sismicaid **no predice terremotos**. Muestra eventos registrados por fuentes
> oficiales, alertas oficiales y orientación de autoprotección. Todo dato indica
> su fuente, fecha y estado de verificación.

---

## Características

- **Sismos oficiales** — eventos recientes desde USGS (mapa Leaflet + lista
  siempre disponible), con magnitud, profundidad, intensidad estimada, hora
  local (VET), filtros (tiempo, magnitud, etc.) y detalle por evento.
- **Estado de tsunami** — boletines oficiales NOAA/PTWC (Caribe / CARIBE-EWS).
  Se distingue siempre de la simple *bandera de tsunami* de un sismo, que **no**
  es una alerta activa.
- **Recomendaciones** — guías cortas de qué hacer antes, durante y después de un
  sismo o amenaza de tsunami, por contexto.
- **Reportes ciudadanos** — incidentes (daños, peligros, bloqueos) con
  validación, límite de envíos y guardado offline; se publican como información
  no verificada, claramente etiquetada.
- **Ayuda y necesidades** — refugios, acopios, hospitales y necesidades
  compartidos por la comunidad. **Sin verificación oficial**, etiquetados como
  tales.
- **Offline / PWA** — instalable, con Service Worker; muestra los últimos datos
  guardados cuando no hay conexión.

---

## Stack

**Frontend** — Astro · Svelte · TypeScript estricto · CSS puro (variables) ·
Leaflet + OpenStreetMap · PWA (`@vite-pwa/astro`). Sin Tailwind.

**Backend** — Node.js · Fastify · PostgreSQL · Prisma ORM · Zod · jobs internos
de ingesta · API REST.

**Monorepo** — pnpm workspaces.

---

## Estructura

```text
.
├─ apps/
│  ├─ api/          # Fastify + Prisma: API REST, DTOs seguros, jobs de ingesta
│  │  ├─ prisma/    # schema.prisma, migraciones y seeds
│  │  └─ src/       # rutas, servicios, mappers (USGS/PTWC), validación
│  └─ web/          # Astro + Svelte: PWA, páginas y componentes
│     └─ src/       # pages, components, lib (api, cache, outbox)
├─ packages/
│  └─ shared/       # enums y DTOs compartidos (frontera de tipos api ↔ web)
└─ docs/            # SPEC, DATABASE, API, SECURITY_AND_PRIVACY, DEPLOY, ...
```

Los paquetes usan el scope `@sismicaid/*` (`@sismicaid/api`, `@sismicaid/web`,
`@sismicaid/shared`).

---

## Desarrollo local

**Requisitos:** Node 20+, pnpm 9, PostgreSQL.

```bash
# 1. Dependencias (genera el cliente Prisma vía postinstall)
pnpm install

# 2. Base de datos: levanta Postgres y crea apps/api/.env desde el ejemplo
cp apps/api/.env.example apps/api/.env   # y ajusta DATABASE_URL

# 3. Migraciones + datos base
pnpm --filter @sismicaid/api exec prisma migrate deploy
pnpm --filter @sismicaid/api seed:sources
pnpm --filter @sismicaid/api seed:coastal-zones
pnpm --filter @sismicaid/api seed:recommendations

# 4. Primera ingesta de datos oficiales
pnpm --filter @sismicaid/api fetch:usgs
pnpm --filter @sismicaid/api fetch:ptwc

# 5. Levantar API (:3000) y web (:4321) en paralelo
pnpm dev
```

### Scripts útiles

| Comando | Qué hace |
|---|---|
| `pnpm dev` | API + web en modo desarrollo |
| `pnpm build` | Build de todos los paquetes |
| `pnpm typecheck` | Chequeo de tipos (los 3 paquetes) |
| `pnpm test` | Tests (api) |
| `pnpm --filter @sismicaid/api fetch:usgs` | Ingesta sísmica USGS |
| `pnpm --filter @sismicaid/api fetch:ptwc` | Ingesta de tsunami PTWC |

> La ingesta no es continua: en producción se programa por cron (cada ~10 min,
> ver `docs/DEPLOY.md`). El frontend muestra lo último al cargar o recargar.

---

## Cómo contribuir

1. **Crea una rama** desde la rama por defecto:
   `feat/…`, `fix/…`, `docs/…`, `chore/…`, `refactor/…`.
2. **Conventional Commits** en los mensajes:
   `feat: …`, `fix: …`, `docs: …`, `chore: …`, `refactor: …`, `test: …`.
3. **Antes de abrir el PR**, deja en verde:
   ```bash
   pnpm typecheck
   pnpm --filter @sismicaid/api test
   ```
4. **Respeta las reglas de dominio** (ver `docs/`):
   - No inventar ni simular datos oficiales.
   - `tsunami_flag` de un sismo ≠ alerta activa de tsunami.
   - No confundir magnitud con intensidad.
   - No exponer contacto ni direcciones privadas; reportes entran sin verificar.
   - Mobile-first y dark mode.
5. Implementa por **slices pequeños**; añade tests para lógica no trivial.

Documentos de referencia: producto (`docs/SPEC.md`), diseño
(`docs/design.md`), datos (`docs/DATA_SOURCES.md`, `docs/DATABASE.md`,
`docs/API.md`) y seguridad (`docs/SECURITY_AND_PRIVACY.md`).

---

## Despliegue

Guía completa para VPS (PostgreSQL + Fastify tras nginx + frontend estático +
cron de ingesta + TLS) en **[`docs/DEPLOY.md`](docs/DEPLOY.md)**.

---

## Fuentes de datos

- **USGS** — eventos sísmicos.
- **NOAA / PTWC** — boletines de tsunami del Caribe (CARIBE-EWS).
- **Comunidad** — reportes ciudadanos, ayuda y necesidades (no verificados).

Sismos y tsunami provienen solo de fuentes oficiales; nunca se inventan datos.
