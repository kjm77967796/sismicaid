import { fileURLToPath } from "node:url";
import { prisma } from "../db";
import { Prisma } from "../generated/prisma";
import { mapUsgsFeature, type UsgsFeature } from "../mappers/usgs";

// Ingesta de sismos recientes desde USGS. Bbox Venezuela/Caribe (SPEC §7.5).
// Upsert por (sourceId, externalId): no duplica, actualiza si cambió.
// Registra siempre un fetch_run. Nunca inventa datos.

const SOURCE_NAME = "USGS Earthquake Catalog";
const JOB_NAME = "fetch:usgs-recent-earthquakes";
const BBOX = { minlatitude: 0, maxlatitude: 15, minlongitude: -75, maxlongitude: -55 };
const MIN_MAGNITUDE = Number(process.env.USGS_MIN_MAGNITUDE ?? 2.5);
const WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function buildUrl(): string {
  const starttime = new Date(Date.now() - WINDOW_MS).toISOString();
  const params = new URLSearchParams({
    format: "geojson",
    starttime,
    minlatitude: String(BBOX.minlatitude),
    maxlatitude: String(BBOX.maxlatitude),
    minlongitude: String(BBOX.minlongitude),
    maxlongitude: String(BBOX.maxlongitude),
    minmagnitude: String(MIN_MAGNITUDE),
    orderby: "time",
  });
  return `https://earthquake.usgs.gov/fdsnws/event/1/query?${params.toString()}`;
}

export async function runUsgsFetch(): Promise<void> {
  const source = await prisma.officialSource.findUnique({ where: { name: SOURCE_NAME } });
  if (!source) throw new Error(`Falta la fuente '${SOURCE_NAME}'. Corre seed:sources primero.`);

  const startedAt = new Date();
  let itemsFound = 0;
  let created = 0;
  let updated = 0;
  let errorMessage: string | null = null;
  let status: "success" | "partial" | "failed" = "success";

  try {
    const res = await fetch(buildUrl());
    if (!res.ok) throw new Error(`USGS respondió HTTP ${res.status}`);
    const data = (await res.json()) as { features?: UsgsFeature[] };
    const features = data.features ?? [];
    itemsFound = features.length;

    const ids = features.map((f) => f.id);
    const existing = await prisma.seismicEvent.findMany({
      where: { sourceId: source.id, externalId: { in: ids } },
      select: { externalId: true },
    });
    const existingSet = new Set(existing.map((e) => e.externalId));

    for (const feature of features) {
      try {
        const { externalId, rawPayload, ...rest } = mapUsgsFeature(feature);
        const payload = rawPayload as Prisma.InputJsonValue;
        await prisma.seismicEvent.upsert({
          where: { sourceId_externalId: { sourceId: source.id, externalId } },
          create: { ...rest, externalId, sourceId: source.id, rawPayload: payload },
          update: { ...rest, rawPayload: payload },
        });
        if (existingSet.has(externalId)) updated++;
        else created++;
      } catch (e) {
        status = "partial";
        errorMessage = `${errorMessage ?? ""}\n${feature.id}: ${(e as Error).message}`.trim();
      }
    }
  } catch (e) {
    status = "failed";
    errorMessage = (e as Error).message;
  }

  await prisma.fetchRun.create({
    data: {
      sourceId: source.id,
      jobName: JOB_NAME,
      status,
      startedAt,
      finishedAt: new Date(),
      itemsFound,
      itemsCreated: created,
      itemsUpdated: updated,
      errorMessage,
    },
  });
  await prisma.officialSource.update({
    where: { id: source.id },
    data: { lastCheckedAt: new Date(), status: status === "failed" ? "degraded" : "active" },
  });

  console.log(
    `USGS fetch: ${status} — encontrados ${itemsFound}, creados ${created}, actualizados ${updated}` +
      (errorMessage ? ` (error: ${errorMessage})` : ""),
  );
}

// Ejecutable directo: `tsx src/jobs/fetch-usgs.ts`.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runUsgsFetch()
    .catch((e) => {
      console.error(e);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
