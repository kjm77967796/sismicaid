import type { AlertLevel, EventType, SeismicStatus } from "@sismicaid/shared";

// Normaliza un feature GeoJSON de USGS (FDSN event API) a las columnas de
// seismic_events. Función PURA: sin red ni DB. El sourceId lo añade el job.
//
// IMPORTANTE: `tsunami` de USGS es solo una bandera del evento (tsunamiFlag).
// NO es una alerta activa de tsunami — eso vive en tsunami_alerts (Slice 3).

export interface UsgsFeature {
  id: string;
  properties: {
    mag: number | null;
    place: string | null;
    time: number; // epoch ms UTC
    updated: number | null;
    url: string | null;
    felt: number | null;
    cdi: number | null;
    mmi: number | null;
    alert: string | null;
    status: string | null;
    tsunami: number | null;
    sig: number | null;
    magType: string | null;
    type: string | null;
  };
  geometry: { coordinates: number[] } | null;
}

export interface NormalizedSeismicEvent {
  externalId: string;
  sourceName: string;
  status: SeismicStatus;
  eventType: EventType;
  place: string | null;
  latitude: number;
  longitude: number;
  depthKm: number | null;
  magnitude: number | null;
  magnitudeType: string | null;
  eventTimeUtc: Date;
  eventTimeLocal: Date;
  updatedAtSource: Date | null;
  mmi: number | null;
  cdi: number | null;
  alertLevel: AlertLevel;
  tsunamiFlag: boolean;
  significance: number | null;
  feltReportsCount: number | null;
  detailUrl: string | null;
  rawPayload: unknown;
}

// VET es fijo UTC-4 (Venezuela no usa horario de verano desde 2016).
// ponytail: offset constante; si algún día vuelve el DST, usar Intl/TZ database.
const VET_OFFSET_MS = 4 * 60 * 60 * 1000;

function mapStatus(s: string | null): SeismicStatus {
  return s === "reviewed" || s === "deleted" ? s : "automatic";
}

function mapEventType(t: string | null): EventType {
  if (t === "earthquake") return "earthquake";
  if (t === "quarry blast" || t === "quarry_blast") return "quarry_blast";
  return "other";
}

function mapAlert(a: string | null): AlertLevel {
  return a === "green" || a === "yellow" || a === "orange" || a === "red" ? a : "unknown";
}

export function mapUsgsFeature(f: UsgsFeature): NormalizedSeismicEvent {
  const coords = f.geometry?.coordinates ?? [];
  const longitude = coords[0];
  const latitude = coords[1];
  const depth = coords[2];
  if (longitude == null || latitude == null) {
    throw new Error(`evento ${f.id} sin coordenadas`);
  }

  const p = f.properties;
  return {
    externalId: f.id,
    sourceName: "USGS",
    status: mapStatus(p.status),
    eventType: mapEventType(p.type),
    place: p.place,
    latitude,
    longitude,
    depthKm: depth ?? null,
    magnitude: p.mag,
    magnitudeType: p.magType,
    eventTimeUtc: new Date(p.time),
    eventTimeLocal: new Date(p.time - VET_OFFSET_MS),
    updatedAtSource: p.updated != null ? new Date(p.updated) : null,
    mmi: p.mmi,
    cdi: p.cdi,
    alertLevel: mapAlert(p.alert),
    tsunamiFlag: p.tsunami === 1,
    significance: p.sig,
    feltReportsCount: p.felt,
    detailUrl: p.url,
    rawPayload: f,
  };
}
