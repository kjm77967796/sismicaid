import { fileURLToPath } from "node:url";
import { XMLParser } from "fast-xml-parser";
import { prisma } from "../db";
import { Prisma } from "../generated/prisma";
import { mapPtwcEntry, type PtwcEntry } from "../mappers/ptwc";

// Ingesta de boletines de tsunami desde tsunami.gov (PTWC).
// Cuando el feed no trae <entry> = sin alerta vigente (estado honesto, 0 items).
// IMPORTANTE: esto es la ÚNICA fuente de "alerta de tsunami"; nada que ver con
// el tsunami_flag de un sismo.

const SOURCE_NAME = "NOAA PTWC";
const JOB_NAME = "fetch:tsunami-ptwc";
// PTWC (Honolulu) cubre Pacífico y Caribe. Configurable por si se confirma un
// producto específico del Caribe. ponytail: un feed por ahora.
const FEED_URL = process.env.TSUNAMI_FEED_URL ?? "https://www.tsunami.gov/events/xml/PHEBAtom.xml";

function toArray<T>(v: T | T[] | undefined): T[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

// fast-xml-parser puede devolver nodos como objeto {"#text": "..."} o string.
function asText(v: unknown): string | undefined {
  if (v == null) return undefined;
  if (typeof v === "string") return v;
  if (typeof v === "object" && "#text" in (v as Record<string, unknown>)) {
    return String((v as Record<string, unknown>)["#text"]);
  }
  return String(v);
}

// Parsea el feed Atom a entradas normalizadas. Exportado para test de regresión.
export function parsePtwcFeed(xml: string): PtwcEntry[] {
  // stopNodes: el <summary> es xhtml anidado; lo conservamos como texto crudo
  // para que el mapper pueda extraer "Category:" del HTML.
  const parser = new XMLParser({ ignoreAttributes: true, removeNSPrefix: true, stopNodes: ["*.summary"] });
  const doc = parser.parse(xml) as { feed?: { entry?: unknown } };
  const entries = toArray(doc.feed?.entry) as Array<Record<string, unknown>>;
  return entries.map((raw) => ({
    id: asText(raw.id),
    title: asText(raw.title),
    updated: asText(raw.updated),
    lat: asText(raw.lat),
    long: asText(raw.long),
    summary: asText(raw.summary),
  }));
}

export async function runPtwcFetch(): Promise<void> {
  const source = await prisma.officialSource.findUnique({ where: { name: SOURCE_NAME } });
  const startedAt = new Date();
  let itemsFound = 0;
  let created = 0;
  let updated = 0;
  let errorMessage: string | null = null;
  let status: "success" | "partial" | "failed" = "success";

  try {
    const res = await fetch(FEED_URL);
    if (!res.ok) throw new Error(`PTWC respondió HTTP ${res.status}`);
    const xml = await res.text();
    const entries = parsePtwcFeed(xml);
    itemsFound = entries.length;

    for (const entry of entries) {
      try {
        const { externalId, rawPayload, ...rest } = mapPtwcEntry(entry, "NOAA_PTWC");
        const payload = rawPayload as Prisma.InputJsonValue;
        const existing = await prisma.tsunamiAlert.findUnique({ where: { externalId }, select: { id: true } });
        await prisma.tsunamiAlert.upsert({
          where: { externalId },
          create: { ...rest, externalId, sourceId: source?.id ?? null, rawPayload: payload },
          update: { ...rest, rawPayload: payload },
        });
        if (existing) updated++;
        else created++;
      } catch (e) {
        status = "partial";
        errorMessage = `${errorMessage ?? ""}\n${entry.id ?? "?"}: ${(e as Error).message}`.trim();
      }
    }
  } catch (e) {
    status = "failed";
    errorMessage = (e as Error).message;
  }

  await prisma.fetchRun.create({
    data: {
      sourceId: source?.id ?? null,
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
  if (source) {
    await prisma.officialSource.update({
      where: { id: source.id },
      data: { lastCheckedAt: new Date(), status: status === "failed" ? "degraded" : "active" },
    });
  }

  console.log(
    `PTWC fetch: ${status} — encontrados ${itemsFound}, creados ${created}, actualizados ${updated}` +
      (itemsFound === 0 ? " (sin alerta vigente)" : "") +
      (errorMessage ? ` (error: ${errorMessage})` : ""),
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runPtwcFetch()
    .catch((e) => {
      console.error(e);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
