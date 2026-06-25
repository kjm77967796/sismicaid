import type { StatusDTO } from "@sismicaid/shared";
import { prisma } from "../db";
import { countActiveTsunamiAlerts } from "./tsunami";

const RECENT_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function getStatus(): Promise<StatusDTO> {
  const since = new Date(Date.now() - RECENT_WINDOW_MS);
  const [recentCount, lastSeismicRun, sources, tsunami] = await Promise.all([
    prisma.seismicEvent.count({ where: { eventTimeUtc: { gte: since }, status: { not: "deleted" } } }),
    prisma.fetchRun.findFirst({
      where: { jobName: { startsWith: "fetch:usgs" }, status: "success" },
      orderBy: { finishedAt: "desc" },
    }),
    prisma.officialSource.findMany({ orderBy: { name: "asc" } }),
    countActiveTsunamiAlerts(),
  ]);

  return {
    seismic: { lastUpdatedAt: lastSeismicRun?.finishedAt?.toISOString() ?? null, recentCount },
    tsunami: { lastUpdatedAt: tsunami.lastUpdatedAt, activeAlerts: tsunami.activeAlerts },
    sources: sources.map((s) => ({
      name: s.name,
      type: s.type,
      status: s.status,
      trustLevel: s.trustLevel,
      lastCheckedAt: s.lastCheckedAt?.toISOString() ?? null,
    })),
    degradedSources: sources.filter((s) => s.status === "degraded").map((s) => s.name),
  };
}
