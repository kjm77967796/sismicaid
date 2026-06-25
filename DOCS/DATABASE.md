# DATABASE.md

## Tablas iniciales

- `official_sources`
- `seismic_events`
- `tsunami_alerts`
- `coastal_alert_zones`
- `resources`
- `needs`
- `citizen_reports`
- `safety_recommendations`
- `fetch_runs`

## Reglas

- Todo evento externo debe tener `external_id`.
- Todo fetch debe registrar un `fetch_run`.
- Todo payload externo debe guardarse en `raw_payload`.
- Los endpoints públicos no deben devolver entidades internas directamente.
- Los reportes ciudadanos no deben exponer contacto privado.
- Las ubicaciones privadas deben publicarse como aproximadas.