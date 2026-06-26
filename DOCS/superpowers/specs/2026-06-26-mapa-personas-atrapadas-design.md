# Diseño — Mapa de personas atrapadas (rescate)

Fecha: 2026-06-26
Estado: aprobado (pendiente de revisión final del autor)

## 1. Contexto y decisión de alcance

El SPEC (§3.3) descarta deliberadamente construir un registro buscable de
personas desaparecidas: *"Para desaparecidos, se enlazarán plataformas
existentes verificadas… Esta app se enfoca en situación territorial, recursos,
necesidades, reportes y prevención."* SECURITY_AND_PRIVACY prohíbe publicar
nombres de víctimas, datos de menores y direcciones privadas exactas.

Por eso **no** se construye un buscador por nombre. En su lugar se aprovecha el
enfoque **territorial** ya existente: los reportes ciudadanos de tipo
`trapped_person` ("persona atrapada") se muestran en un mapa de rescate, como
zonas aproximadas, para que voluntarios y rescatistas sepan **dónde** hay
personas atrapadas, sin exponer **quién** ni la dirección exacta.

Esta decisión convierte una funcionalidad de alto riesgo (registro de personas)
en una de bajo riesgo y alta utilidad (mapa territorial de rescate), reutilizando
piezas que ya existen.

## 2. Objetivo

Permitir que cualquiera vea, en un mapa y en lista, dónde se han reportado
personas atrapadas tras un sismo, con ubicación aproximada y sin datos
sensibles, para coordinar rescate. Y permitir marcar una zona como "rescatada"
para no enviar ayuda a sitios ya despejados.

## 3. Piezas reutilizadas (no se construye desde cero)

- Tipo de reporte `trapped_person`: ya existe en `/reportar` y en el enum
  `REPORT_TYPE` (`packages/shared/src/enums.ts`).
- Tabla `citizen_reports`: ya almacena estos reportes con `latitude`,
  `longitude`, `urgency`, `verification_status`, `public_safe_summary`.
- Flujo de moderación: todo reporte entra como `pending` y se modera después.
- Patrón Leaflet + fallback a lista de `SeismicMap.svelte` / `SeismicList.svelte`.
- Caché de último dato (`apps/web/src/lib/cache.ts`) para funcionamiento offline.

## 4. Regla de privacidad (diferencia clave frente a epicentros)

Un epicentro es un evento natural público y se pinta con coordenadas exactas.
Una persona atrapada está en una ubicación real privada y **nunca** se publica
con coordenadas exactas.

- El servidor calcula un punto **aproximado** redondeando la coordenada real a
  una rejilla de **~0.01°** (≈ 1 km). El redondeo es **determinista**: el mismo
  reporte siempre cae en la misma zona (no "salta" entre peticiones).
- El endpoint público solo expone ese punto aproximado, nunca el exacto.
- El DTO público actual de reportes (`CitizenReportDTO`) **ya** oculta
  coordenadas (`apps/api/src/services/reports.ts`). No se rompe esa garantía: se
  crea un DTO separado y específico de mapa.
- El mapa dibuja un **círculo de ~1 km de radio**, no un pin, para comunicar
  visualmente que es una zona aproximada.
- Nunca se publican nombres ni descripción libre: solo `publicSafeSummary`,
  urgencia y estado.

## 5. Modelo de datos

Única adición de esquema:

- `citizen_reports.resolved_at` — `TIMESTAMP NULL`. Marca cuándo se confirmó el
  rescate/cierre de la zona. `NULL` = activo.

Migración Prisma correspondiente. No se añaden tablas nuevas.

## 6. API

### `GET /api/trapped-persons`

Devuelve los reportes `trapped_person` no rechazados como marcadores de mapa.

DTO nuevo `TrappedPersonMarkerDTO` (en `packages/shared`):

```ts
interface TrappedPersonMarkerDTO {
  id: string;
  approxLat: number;          // redondeada a rejilla ~0.01°
  approxLng: number;          // redondeada a rejilla ~0.01°
  municipality: string | null;
  urgency: Urgency;
  verificationStatus: ReportVerificationStatus;
  resolved: boolean;          // derivado de resolved_at != null
  createdAt: string;
}
```

Reglas del servicio:

- Filtra `verification_status NOT IN ('rejected','duplicate')`.
- Solo `report_type = 'trapped_person'`.
- Requiere `latitude`/`longitude` no nulos (sin coordenadas no hay marcador;
  esos reportes siguen visibles solo en lista por estado/municipio si aplica).
- Calcula `approxLat`/`approxLng` redondeando a 2 decimales (~1.1 km). Función
  pura y testeable.
- Por defecto incluye resueltos; el cliente decide si los oculta. (Mantiene el
  servidor simple; el filtrado de "rescatado" es de presentación.)

### Marcar rescatado (moderación)

`PATCH /api/reports/:id/resolve` (o equivalente en el panel de moderación) que
fija `resolved_at = now()`. Reutiliza la autorización de moderación existente.
Si aún no hay panel de moderación con auth, se entrega como acción de moderación
mínima protegida y se documenta como dependencia.

## 7. Frontend

### Ruta `/rescate`

Nombre elegido para no sugerir un registro de desaparecidos. Título visible:
"Personas atrapadas — rescate".

Composición (reutiliza el patrón de `/sismos`):

- **Banner honesto** fijo arriba: "Reportes ciudadanos sin verificar.
  Ubicación aproximada por seguridad. No incluye nombres."
- **Mapa** (Leaflet): un círculo (~1 km) por marcador.
  - Color = urgencia (paleta de severidad existente en `lib/severity.ts`).
  - Sin verificar = borde punteado + badge "SIN VERIFICAR".
  - Resueltos: ocultos por defecto; visibles con filtro, atenuados.
- **Lista paralela** (siempre, regla del SPEC: nunca solo mapa): cada item con
  municipio, urgencia, estado de verificación, antigüedad.
- **Filtros**: urgencia, estado de verificación (incluye "solo verificados"),
  mostrar/ocultar rescatados.
- **Offline**: usa `fetchWithCache` para mostrar el último dato guardado y un
  aviso de "datos posiblemente desactualizados".
- **Acceso desde la home**: enlace/acceso rápido cuando existan reportes activos.

### Reuso del mapa

Se factoriza el patrón Leaflet de `SeismicMap.svelte` lo mínimo necesario para
soportar círculos por zona. No se reescribe el mapa sísmico; si comparten poco,
se crea un componente hermano `RescueMap.svelte` siguiendo el mismo patrón.

## 8. Estados de UI

- Cargando: skeleton/"Cargando últimos datos…".
- Vacío: "No hay reportes de personas atrapadas según la última actualización."
- Error con caché: muestra datos guardados + aviso de desactualización.
- Error sin caché: mensaje claro, sin pantalla en blanco.

## 9. Fuera de alcance (YAGNI)

No se implementa, y se añadirá solo si se justifica después:

- Nombres, fotos o identificación de personas.
- Registro buscable por nombre / verificación de identidad de quien busca.
- Tiempo real / websockets.
- Clustering de marcadores.
- Selector de ubicación en mapa dentro del formulario de reporte.
- Notificaciones push.

## 10. Pruebas mínimas

- Unidad: función de redondeo a rejilla (determinismo + que nunca devuelve la
  coordenada exacta de entrada cuando difiere del centro de celda).
- Unidad: servicio `trapped-persons` filtra rechazados/duplicados y mapea a DTO
  sin filtrar coordenadas exactas.
- Verificación de DTO: `TrappedPersonMarkerDTO` no contiene `latitude`/
  `longitude` exactas ni campos privados.

## 11. Reglas de dominio/seguridad respetadas

- No nombres de víctimas ni datos de menores.
- Ubicación siempre aproximada (`location_precision` no `exact` en público).
- Reportes ciudadanos claramente etiquetados como no verificados.
- DTO público nunca expone `private_contact`, descripción ni coordenadas exactas.
- Siempre existe alternativa en lista al mapa.
