# CLAUDE.md

## Proyecto

Estás trabajando en **Sismicaid**, una PWA de emergencia para Venezuela enfocada en:

- Eventos sísmicos oficiales.
- Alertas y boletines de tsunami.
- Recursos disponibles.
- Necesidades ciudadanas.
- Reportes ciudadanos moderados.
- Recomendaciones de prevención.

## Documentos obligatorios

Antes de implementar cualquier funcionalidad, lee los documentos relevantes:

- Producto y pantallas: @docs/SPEC.md
- Diseño responsive y dark mode: @docs/design.md
- Fuentes oficiales: @docs/DATA_SOURCES.md
- Base de datos: @docs/DATABASE.md
- API: @docs/API.md
- Seguridad y privacidad: @docs/SECURITY_AND_PRIVACY.md
- Plan MVP: @docs/MVP_PLAN.md

## Stack

Frontend:

- Astro
- Svelte
- TypeScript estricto
- CSS puro con variables CSS
- Leaflet + OpenStreetMap
- PWA
- Sin Tailwind
- Sin librerías UI pesadas

Backend:

- Node.js
- Fastify o Hono
- PostgreSQL
- Drizzle ORM o Prisma
- TypeScript estricto
- Jobs internos de ingesta
- API REST

Monorepo:

- `apps/web`
- `apps/api`
- `packages/shared`

## Reglas generales

- No refactorices desde cero.
- Implementa por slices pequeños.
- No uses `any`.
- No inventes datos oficiales.
- No simules fuentes oficiales como si fueran reales.
- No expongas datos sensibles.
- No publiques direcciones privadas exactas.
- Todo dato crítico debe mostrar fuente, fecha y estado de verificación.
- Todo reporte ciudadano entra como pendiente.
- La app no predice terremotos.
- No confundas magnitud con intensidad.
- El `tsunami_flag` de un evento sísmico no equivale a alerta activa de tsunami.
- Siempre debe existir alternativa en lista cuando haya mapa.
- La UI debe ser mobile-first y dark mode only.

## Comandos esperados

Cuando existan los scripts en `package.json`, usa:

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test