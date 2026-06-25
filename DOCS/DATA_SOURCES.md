# DATA_SOURCES.md

## Principio

El backend debe alimentarse de fuentes oficiales o verificables. No se deben inventar datos ni presentar reportes ciudadanos como oficiales.

## Fuentes iniciales

### USGS Earthquake Catalog

Uso:

- Eventos sísmicos recientes.
- Magnitud.
- Profundidad.
- Coordenadas.
- Hora.
- MMI/CDI si está disponible.
- Alert level.
- Tsunami flag.

Reglas:

- Guardar `external_id`.
- Guardar `raw_payload`.
- Actualizar evento si ya existe.
- Mostrar fuente y fecha.

### NOAA / Tsunami.gov / PTWC

Uso:

- Boletines de tsunami.
- Estado de alerta.
- Áreas afectadas.
- Cancelaciones.
- Hora de emisión.

Reglas:

- No tratar `tsunami_flag` como alerta activa.
- Mostrar estado y fuente.
- Mostrar si los datos están desactualizados.

### FUNVISIS

Uso:

- Fuente venezolana oficial de sismos y recomendaciones.

Reglas:

- Integrar cuando se confirme formato estable.
- Si no hay API estable, tratar como fuente manual/verificable hasta tener adaptador confiable.

## Estados de fuente

- `active`
- `degraded`
- `disabled`

## Niveles de confianza

- `official`
- `verified`
- `community_pending`
- `outdated`
- `rejected`