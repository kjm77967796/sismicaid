import type { CoastalZoneDTO, CurrentTsunamiDTO, TsunamiAlertDTO } from "@sismicaid/shared";
import { prisma } from "../db";
import type { CoastalAlertZone, TsunamiAlert } from "../generated/prisma";

// Una alerta se considera "vigente" si su emisión es reciente. Incluye
// cancelaciones recientes para poder mostrar el mensaje "alerta cancelada".
const RELEVANT_WINDOW_MS = 24 * 60 * 60 * 1000;
// Umbral para marcar los datos como desactualizados.
const STALE_MS = 30 * 60 * 1000;

function toAlertDTO(a: TsunamiAlert): TsunamiAlertDTO {
  return {
    id: a.id,
    source: a.provider,
    provider: a.provider,
    status: a.status,
    headline: a.headline,
    description: a.description,
    affectedAreaText: a.affectedAreaText,
    effectiveAt: a.effectiveAt?.toISOString() ?? null,
    expiresAt: a.expiresAt?.toISOString() ?? null,
    relatedSeismicEventId: a.relatedSeismicEventId,
    updatedAt: a.updatedAt.toISOString(),
  };
}

export async function getCurrentTsunami(): Promise<CurrentTsunamiDTO> {
  const now = Date.now();
  const since = new Date(now - RELEVANT_WINDOW_MS);

  const [lastRun, alert] = await Promise.all([
    prisma.fetchRun.findFirst({
      where: { jobName: "fetch:tsunami-ptwc", status: "success" },
      orderBy: { finishedAt: "desc" },
    }),
    // Boletín más reciente y aún no expirado dentro de la ventana relevante.
    prisma.tsunamiAlert.findFirst({
      where: {
        effectiveAt: { gte: since },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date(now) } }],
      },
      orderBy: { effectiveAt: "desc" },
    }),
  ]);

  const lastCheckedAt = lastRun?.finishedAt ?? null;
  const stale = lastCheckedAt == null || now - lastCheckedAt.getTime() > STALE_MS;

  return {
    alert: alert ? toAlertDTO(alert) : null,
    lastCheckedAt: lastCheckedAt?.toISOString() ?? null,
    stale,
  };
}

function toZoneDTO(z: CoastalAlertZone): CoastalZoneDTO {
  return {
    id: z.id,
    name: z.name,
    state: z.state,
    municipality: z.municipality,
    riskLevel: z.riskLevel,
    updatedAt: z.updatedAt.toISOString(),
  };
}

export async function listCoastalZones(): Promise<CoastalZoneDTO[]> {
  const zones = await prisma.coastalAlertZone.findMany({ orderBy: { name: "asc" } });
  return zones.map(toZoneDTO);
}

// Alertas "activas" para el contador de /api/status (no cuenta information ni canceled).
export async function countActiveTsunamiAlerts(): Promise<{ activeAlerts: number; lastUpdatedAt: string | null }> {
  const since = new Date(Date.now() - RELEVANT_WINDOW_MS);
  const [activeAlerts, lastRun] = await Promise.all([
    prisma.tsunamiAlert.count({
      where: { effectiveAt: { gte: since }, status: { in: ["watch", "advisory", "warning"] } },
    }),
    prisma.fetchRun.findFirst({
      where: { jobName: "fetch:tsunami-ptwc", status: "success" },
      orderBy: { finishedAt: "desc" },
    }),
  ]);
  return { activeAlerts, lastUpdatedAt: lastRun?.finishedAt?.toISOString() ?? null };
}
