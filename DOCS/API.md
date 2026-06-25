# API.md

## Endpoints públicos iniciales

### GET /api/status

Devuelve:

- estado general
- última actualización sísmica
- última actualización tsunami
- cantidad de eventos recientes
- alertas activas
- fuentes degradadas

### GET /api/seismic-events

Filtros:

- `from`
- `to`
- `minMagnitude`
- `maxMagnitude`
- `minDepth`
- `maxDepth`
- `source`
- `hasTsunamiFlag`
- `alertLevel`
- `bbox`

### GET /api/seismic-events/:id

Devuelve detalle normalizado del evento.

### GET /api/tsunami-alerts/current

Devuelve estado actual de tsunami.

### GET /api/coastal-zones

Devuelve zonas costeras y estado de alerta.

### GET /api/resources

Devuelve recursos disponibles.

### GET /api/needs

Devuelve necesidades activas.

### POST /api/reports

Crea reporte ciudadano pendiente.

### GET /api/recommendations

Devuelve recomendaciones por contexto.