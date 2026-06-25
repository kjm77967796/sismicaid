# Sismicaid

[Español](README.md) · **English**

**Emergency PWA for Venezuela.** Centralizes official seismic information,
tsunami status, prevention guidance, and community-shared help/needs — fast,
lightweight, mobile-first, dark mode, and usable on poor connections.

> Sismicaid **does not predict earthquakes**. It shows events recorded by
> official sources, official alerts, and self-protection guidance. Every data
> point shows its source, date, and verification status.

---

## Features

- **Official earthquakes** — recent events from USGS (Leaflet map + an
  always-available list), with magnitude, depth, estimated intensity, local time
  (VET), filters (time, magnitude, etc.) and per-event detail.
- **Tsunami status** — official NOAA/PTWC bulletins (Caribbean / CARIBE-EWS).
  Always kept distinct from an earthquake's *tsunami flag*, which is **not** an
  active alert.
- **Recommendations** — short guides on what to do before, during and after an
  earthquake or tsunami threat, by context.
- **Citizen reports** — incidents (damage, hazards, blockages) with validation,
  submission rate limiting and offline saving; published as unverified
  information, clearly labeled.
- **Help and needs** — shelters, collection centers, hospitals and needs shared
  by the community. **Not officially verified**, and labeled as such.
- **Offline / PWA** — installable, with a Service Worker; shows the last saved
  data when there is no connection.

---

## Stack

**Frontend** — Astro · Svelte · strict TypeScript · plain CSS (variables) ·
Leaflet + OpenStreetMap · PWA (`@vite-pwa/astro`). No Tailwind.

**Backend** — Node.js · Fastify · PostgreSQL · Prisma ORM · Zod · internal
ingestion jobs · REST API.

**Monorepo** — pnpm workspaces.

---

## Structure

```text
.
├─ apps/
│  ├─ api/          # Fastify + Prisma: REST API, safe DTOs, ingestion jobs
│  │  ├─ prisma/    # schema.prisma, migrations and seeds
│  │  └─ src/       # routes, services, mappers (USGS/PTWC), validation
│  └─ web/          # Astro + Svelte: PWA, pages and components
│     └─ src/       # pages, components, lib (api, cache, outbox)
├─ packages/
│  └─ shared/       # shared enums and DTOs (api ↔ web type boundary)
└─ docs/            # SPEC, DATABASE, API, SECURITY_AND_PRIVACY, DEPLOY, ...
```

Packages use the `@sismicaid/*` scope (`@sismicaid/api`, `@sismicaid/web`,
`@sismicaid/shared`).

---

## Local development

**Requirements:** Node 20+, pnpm 9, PostgreSQL.

```bash
# 1. Dependencies (generates the Prisma client via postinstall)
pnpm install

# 2. Database: start Postgres and create apps/api/.env from the example
cp apps/api/.env.example apps/api/.env   # then adjust DATABASE_URL

# 3. Migrations + base data
pnpm --filter @sismicaid/api exec prisma migrate deploy
pnpm --filter @sismicaid/api seed:sources
pnpm --filter @sismicaid/api seed:coastal-zones
pnpm --filter @sismicaid/api seed:recommendations

# 4. First ingestion of official data
pnpm --filter @sismicaid/api fetch:usgs
pnpm --filter @sismicaid/api fetch:ptwc

# 5. Run API (:3000) and web (:4321) in parallel
pnpm dev
```

### Useful scripts

| Command | What it does |
|---|---|
| `pnpm dev` | API + web in development mode |
| `pnpm build` | Build all packages |
| `pnpm typecheck` | Type-check (all 3 packages) |
| `pnpm test` | Tests (api) |
| `pnpm --filter @sismicaid/api fetch:usgs` | USGS seismic ingestion |
| `pnpm --filter @sismicaid/api fetch:ptwc` | PTWC tsunami ingestion |

> Ingestion is not continuous: in production it is scheduled via cron
> (every ~10 min, see `docs/DEPLOY.md`). The frontend shows the latest data on
> load or refresh.

---

## How to contribute

1. **Create a branch** from the default branch:
   `feat/…`, `fix/…`, `docs/…`, `chore/…`, `refactor/…`.
2. **Conventional Commits** for messages:
   `feat: …`, `fix: …`, `docs: …`, `chore: …`, `refactor: …`, `test: …`.
3. **Before opening the PR**, keep these green:
   ```bash
   pnpm typecheck
   pnpm --filter @sismicaid/api test
   ```
4. **Respect the domain rules** (see `docs/`):
   - Never invent or simulate official data.
   - An earthquake's `tsunami_flag` ≠ an active tsunami alert.
   - Do not confuse magnitude with intensity.
   - Never expose private contact or exact addresses; reports enter unverified.
   - Mobile-first and dark mode.
5. Build in **small slices**; add tests for non-trivial logic.

Reference docs: product (`docs/SPEC.md`), design (`docs/design.md`), data
(`docs/DATA_SOURCES.md`, `docs/DATABASE.md`, `docs/API.md`) and security
(`docs/SECURITY_AND_PRIVACY.md`).

---

## Deployment

Full VPS guide (PostgreSQL + Fastify behind nginx + static frontend + ingestion
cron + TLS) in **[`docs/DEPLOY.md`](docs/DEPLOY.md)**.

---

## Data sources

- **USGS** — seismic events.
- **NOAA / PTWC** — Caribbean tsunami bulletins (CARIBE-EWS).
- **Community** — citizen reports, help and needs (unverified).

Earthquakes and tsunami data come only from official sources; data is never
invented.
