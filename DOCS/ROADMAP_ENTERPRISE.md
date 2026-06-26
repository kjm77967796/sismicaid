# Roadmap Enterprise — SismicAid

> Plan de hardening enterprise-grade y funcionalidades esenciales de respuesta a emergencias.
> Estructurado en 6 sprints, cada uno un PR cohesivo y mergeable de forma independiente.
> Cada sprint cierra con verificación empírica antes de avanzar.

## Principios

1. **Verificar primero, nunca asumir.** Ninguna capacidad se da por hecha sin prueba reproducible (smoke test, métrica, log).
2. **Slices pequeños.** Cada sprint puede mergearse y desplegarse de forma independiente, sin breaking changes.
3. **No inventar datos oficiales.** USGS y NOAA/PTWC siguen siendo las únicas fuentes oficiales. Todo lo ciudadano queda explícitamente etiquetado.
4. **Mobile-first, offline-first, low-bandwidth-first.** En sismo M6+ la red móvil se degrada o cae.
5. **Privacidad por defecto.** Ubicación fuzzed server-side, sin nombres, retención acotada.

---

## Sprint 1 — Fundación enterprise (PR #1)

**Objetivo:** capa fundacional sobre la que se construyen los siguientes sprints. Sin nuevas features visibles al usuario; toda la inversión es en confiabilidad, seguridad e integridad de datos.

**Branch:** `feat/sprint-1-enterprise-foundation`

**Entregables:**
- **Audit log con hash chain SHA-256** (append-only, verificable) — fundación para todos los reportes y cambios.
- **Pipeline anti-abuso** para reportes ciudadanos: rate limiting, deduplicación geo-temporal, geofence Venezuela, sistema de reputación por device key.
- **Schema extendido** (Prisma): `audit_log`, `push_subscription`, `safety_check_event`, `reporter_reputation`, `dedup_signature`, `notification_outbox`.
- **CI/CD hardening**: CodeQL, npm audit, secret scanning, Dependabot, branch protection rules documentadas.
- **Documentación operacional**: threat model (STRIDE), SLOs/SLIs, runbook de incident response.
- **Issue/PR templates** para mantener el flujo de slices pequeños.

**Verificación al cierre:**
- `pnpm typecheck` verde.
- Test del hash chain (tampering detectado).
- `npm audit` sin críticas/altas.
- CodeQL scan corriendo en CI.

---

## Sprint 2 — Resiliencia y observabilidad (PR #2)

**Objetivo:** que la app no se caiga cuando más se necesita.

**Branch:** `feat/sprint-2-resilience-observability`

**Entregables:**
- **CDN edge caching** (Cloudflare): cache headers + stale-while-revalidate por endpoint; origen recibe <1% del tráfico en pico.
- **Service Worker offline-first** con IndexedDB outbox: la app abre sin red y muestra último estado conocido; reportes encolan localmente y sincronizan con `backgroundSync`.
- **Degradación progresiva**: detección `effectiveType` (2G/3G/4G) → modo lite sin mapa.
- **Observabilidad**: OpenTelemetry traces (Fastify → Prisma), Prometheus metrics (`/metrics`), structured logs (pino) con correlation ID.
- **Synthetic monitoring**: Checkly o equivalente, 4 probes (homepage, /sismos, /reportar POST, /ayuda) desde Caracas/Maracaibo/Miami.
- **Status page pública** estática: `status.sismicaid.org` (Statuspage-like, hosted en GitHub Pages).
- **SLO dashboard**: Grafana Cloud (free tier) con los 4 SLOs definidos en `docs/SLO.md`.

**Verificación:**
- Lighthouse PWA score ≥95.
- Chaos test: matar API, app sigue mostrando último estado.
- Smoke test offline: reporte se encola y se envía al reconectar.

---

## Sprint 3 — Alerta temprana y notificación geocercada (PR #3)

**Objetivo:** la función que salva vidas. Notificación push en segundos cuando USGS/PTWC emite evento relevante.

**Branch:** `feat/sprint-3-push-alerts-cap`

**Entregables:**
- **Web Push API**: VAPID keys, opt-in UI, endpoint de suscripción con scope geográfico (estado/municipio).
- **Servicio CAP 1.2** (Common Alerting Protocol): builder de envelopes estándar para emitir y consumir alertas oficiales. Federable.
- **Broadcast geocercado**: al ingerir evento USGS M≥4.5, calcular radio de impacto (PGA estimada por ley de atenuación) → suscriptores en radio reciben push en <30s.
- **Throttling de alertas**: deduplicación de eventos USGS (revisiones de magnitud no generan re-push), cap por usuario (max 1/min).
- **Topic feeds**: suscripciones por estado, por tipo (sismo, tsunami, ayuda).
- **Tsunami push** desde PTWC: parsing del boletín, mapeo a zonas costeras del seed `seed:coastal-zones`.

**Verificación:**
- Test end-to-end: evento mock USGS M5.2 en Caracas → suscriptor de prueba recibe push en <30s.
- Validación CAP 1.2 contra schema oficial.

---

## Sprint 4 — Safety Check + reunificación familiar (PR #4)

**Objetivo:** "estoy bien / necesito ayuda" tras un evento mayor.

**Branch:** `feat/sprint-4-safety-check-reunification`

**Entregables:**
- **Safety Check trigger**: al detectar evento M≥5 con epicentro en Venezuela, activar prompt en app a usuarios en radio.
- **Estado por usuario**: `safe` / `need_help` / `not_set`; expira en 72h.
- **Mapa de calor agregado** (privacidad-preserving): grid H3 nivel 7, conteo `safe`/`need_help` por celda, mínimo k=5 personas por celda para mostrar.
- **Triage médico START** opcional para `need_help`: consciente/respira/sangrado → color rojo/amarillo/verde/negro. Priorización para rescate.
- **Reunificación familiar** (modelo Google Person Finder): búsqueda autenticada por familiares, sin nombres en público, match por datos parciales.
- **Routing a refugio más cercano** (en Ayuda): integración Leaflet Routing Machine + capa de bloqueos reportados.

**Verificación:**
- Test de k-anonymity en mapa de calor (rechaza celdas con <5).
- Test de expiración 72h.

---

## Sprint 5 — Capas oficiales y matching oferta-demanda (PR #5)

**Objetivo:** datos densos, no solo pins.

**Branch:** `feat/sprint-5-layers-resource-matching`

**Entregables:**
- **Capa USGS ShakeMap** (intensidad estimada por celda) sobre Leaflet.
- **Capa de fallas geológicas**: Boconó, San Sebastián, El Pilar (GeoJSON de FUNVISIS si disponible, fallback a USGS Quaternary Faults).
- **Capa de infraestructura crítica**: hospitales, bomberos, refugios oficiales de Protección Civil (dataset estático versionado en `apps/api/data/critical-infra.geojson`).
- **Capa tsunami**: zonas de inundación modeladas para costa caribeña venezolana (datos PTWC + DEM SRTM 30m).
- **Matching oferta-demanda**: cuando alguien crea oferta de recurso, sistema sugiere necesidades a <2km en últimas 24h con score. Notificación a coordinadores (no usuarios).
- **Inventario de recursos** estructurado: tipo, cantidad, unidad, perecedero, disponibilidad temporal.

**Verificación:**
- Test del algoritmo de matching con dataset sintético.
- Validación visual de las 4 capas en mapa.

---

## Sprint 6 — Federación, multi-canal y accesibilidad (PR #6)

**Objetivo:** llegar a quienes la PWA no alcanza, y abrir el ecosistema.

**Branch:** `feat/sprint-6-federation-multichannel-a11y`

**Entregables:**
- **API CAP federada**: feed público de alertas en formato CAP 1.2 consumible por otras apps y medios.
- **Mesh / offline P2P**: integración Bridgefy SDK (o protocolo propio basado en WebBluetooth + WiFi Direct si presupuesto cero) para propagar reportes sin red.
- **Webhook con Protección Civil / Cruz Roja / 171**: bridge a tickets en sistemas oficiales (skeleton + spec; integración real requiere acuerdo institucional).
- **WhatsApp Business API chatbot** para reportes desde feature phones.
- **SMS gateway** (Twilio o equivalente regional) para alertas push a usuarios sin smartphone.
- **A11y WCAG 2.2 AA**: auditoría completa, soporte screen reader ES/PT, targets táctiles ≥44px, modo alto contraste, modo de una sola mano.
- **i18n**: estructura para añadir warao y wayuunaiki (comunidades costeras indígenas) post-MVP.

**Verificación:**
- Pa11y / axe-core sin violaciones AA.
- Test del feed CAP contra validador oficial.

---

## Trazabilidad post-sprint

Cada sprint cierra con un commit `docs(roadmap): close sprint N` que actualiza este documento con:
- Fecha real de merge.
- Commit SHA de cierre.
- Métricas de verificación obtenidas.
- Tech debt residual y backlog que se mueve al siguiente sprint.
