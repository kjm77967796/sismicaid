import type { ReportType } from "@sismicaid/shared";

// Categorías de reporte. Cada tipo pertenece a UNA sola categoría, así no se
// mezclan registros entre pantallas:
//   - Incidentes  -> /reportar (lista de reportes ciudadanos)
//   - Ayuda       -> /ayuda
//   - Necesidades -> /necesidades
export const INCIDENT_REPORT_TYPES: ReportType[] = [
  "structural_damage",
  "blocked_road",
  "landslide",
  "trapped_person",
  "electrical_risk",
  "gas_leak",
];

export const HELP_REPORT_TYPES: ReportType[] = [
  "available_resource",
  "active_shelter",
  "collection_center",
  "operational_hospital",
];

export const NEED_REPORT_TYPES: ReportType[] = ["urgent_need", "no_water_zone", "no_power_zone", "no_signal_zone"];

export const incidentReportsQuery = `?reportTypes=${INCIDENT_REPORT_TYPES.join(",")}`;
export const helpReportsQuery = `?reportTypes=${HELP_REPORT_TYPES.join(",")}`;
export const needReportsQuery = `?reportTypes=${NEED_REPORT_TYPES.join(",")}`;

// Para agrupar visualmente los tipos en el formulario de reporte.
export interface ReportCategory {
  label: string;
  hint: string;
  types: ReportType[];
}

export const REPORT_CATEGORIES: ReportCategory[] = [
  { label: "Reportar un incidente", hint: "Daños, peligros o bloqueos", types: INCIDENT_REPORT_TYPES },
  { label: "Ofrecer ayuda disponible", hint: "Aparecerá en Ayuda", types: HELP_REPORT_TYPES },
  { label: "Reportar una necesidad", hint: "Aparecerá en Necesidades", types: NEED_REPORT_TYPES },
];
