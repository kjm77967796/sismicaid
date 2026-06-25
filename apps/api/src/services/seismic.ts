import type { AlertLevel, SeismicEventDTO } from "@sismicaid/shared";
import { ALERT_LEVEL } from "@sismicaid/shared";
import { prisma } from "../db";
import { Prisma, type SeismicEvent } from "../generated/prisma";
import { translatePlace } from "../lib/place";

export interface SeismicFilters {
  from?: Date;
  to?: Date;
  minMagnitude?: number;
  maxMagnitude?: number;
  minDepth?: number;
  maxDepth?: number;
  source?: string;
  hasTsunamiFlag?: boolean;
  alertLevel?: AlertLevel;
  bbox?: { minLon: number; minLat: number; maxLon: number; maxLat: number };
  limit?: number;
}

const DEFAULT_LIMIT = 500;

function toDTO(e: SeismicEvent): SeismicEventDTO {
  return {
    id: e.id,
    source: e.sourceName ?? "USGS",
    status: e.status,
    eventType: e.eventType,
    place: translatePlace(e.place) ?? "",
    country: e.country,
    latitude: e.latitude,
    longitude: e.longitude,
    depthKm: e.depthKm,
    magnitude: e.magnitude,
    magnitudeType: e.magnitudeType,
    eventTimeUtc: e.eventTimeUtc.toISOString(),
    // Hora local VET sin sufijo Z (es wall-clock, no UTC).
    eventTimeLocal: e.eventTimeLocal ? e.eventTimeLocal.toISOString().slice(0, 19) : null,
    mmi: e.mmi,
    cdi: e.cdi,
    alertLevel: e.alertLevel,
    tsunamiFlag: e.tsunamiFlag,
    significance: e.significance,
    feltReportsCount: e.feltReportsCount,
    detailUrl: e.detailUrl,
    updatedAt: e.updatedAt.toISOString(),
  };
}

function buildWhere(f: SeismicFilters): Prisma.SeismicEventWhereInput {
  const where: Prisma.SeismicEventWhereInput = { status: { not: "deleted" } };
  if (f.from || f.to) where.eventTimeUtc = { gte: f.from, lte: f.to };
  if (f.minMagnitude != null || f.maxMagnitude != null) where.magnitude = { gte: f.minMagnitude, lte: f.maxMagnitude };
  if (f.minDepth != null || f.maxDepth != null) where.depthKm = { gte: f.minDepth, lte: f.maxDepth };
  if (f.source) where.sourceName = f.source;
  if (f.hasTsunamiFlag) where.tsunamiFlag = true;
  if (f.alertLevel) where.alertLevel = f.alertLevel;
  if (f.bbox) {
    where.latitude = { gte: f.bbox.minLat, lte: f.bbox.maxLat };
    where.longitude = { gte: f.bbox.minLon, lte: f.bbox.maxLon };
  }
  return where;
}

export async function listSeismicEvents(f: SeismicFilters): Promise<SeismicEventDTO[]> {
  const events = await prisma.seismicEvent.findMany({
    where: buildWhere(f),
    orderBy: { eventTimeUtc: "desc" },
    take: f.limit ?? DEFAULT_LIMIT,
  });
  return events.map(toDTO);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getSeismicEvent(id: string): Promise<SeismicEventDTO | null> {
  // El id es UUID; sin esta guarda un id malformado hace que Prisma lance (500).
  if (!UUID_RE.test(id)) return null;
  const e = await prisma.seismicEvent.findUnique({ where: { id } });
  return e ? toDTO(e) : null;
}

// Parsea el querystring (todo strings) a filtros tipados, descartando basura.
export function parseSeismicFilters(query: unknown): SeismicFilters {
  const q = (query ?? {}) as Record<string, string | undefined>;
  const num = (v: string | undefined): number | undefined =>
    v != null && v !== "" && Number.isFinite(Number(v)) ? Number(v) : undefined;
  const date = (v: string | undefined): Date | undefined => {
    if (!v) return undefined;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? undefined : d;
  };

  let bbox: SeismicFilters["bbox"];
  if (q.bbox) {
    const [minLon, minLat, maxLon, maxLat] = q.bbox.split(",").map(Number);
    if ([minLon, minLat, maxLon, maxLat].every((n) => Number.isFinite(n))) {
      bbox = { minLon: minLon!, minLat: minLat!, maxLon: maxLon!, maxLat: maxLat! };
    }
  }

  const alertLevel =
    q.alertLevel && (ALERT_LEVEL as readonly string[]).includes(q.alertLevel) ? (q.alertLevel as AlertLevel) : undefined;

  return {
    from: date(q.from),
    to: date(q.to),
    minMagnitude: num(q.minMagnitude),
    maxMagnitude: num(q.maxMagnitude),
    minDepth: num(q.minDepth),
    maxDepth: num(q.maxDepth),
    source: q.source || undefined,
    hasTsunamiFlag: q.hasTsunamiFlag === "true" ? true : undefined,
    alertLevel,
    bbox,
    limit: num(q.limit),
  };
}
