import type { NeedDTO } from "@sismicaid/shared";
import { prisma } from "../db";
import type { Need } from "../generated/prisma";

export interface NeedFilters {
  state?: string;
  category?: string;
}

// NeedDTO no expone coordenadas por diseño (las necesidades pueden estar cerca
// de viviendas privadas): solo estado/municipio/parroquia.
function toDTO(n: Need): NeedDTO {
  return {
    id: n.id,
    category: n.category,
    title: n.title,
    description: n.description,
    state: n.state,
    municipality: n.municipality,
    parish: n.parish,
    locationPrecision: n.locationPrecision,
    urgency: n.urgency,
    quantity: n.quantity,
    status: n.status,
    verificationStatus: n.verificationStatus,
    source: null,
    lastVerifiedAt: n.lastVerifiedAt?.toISOString() ?? null,
    updatedAt: n.updatedAt.toISOString(),
  };
}

export async function listNeeds(f: NeedFilters): Promise<NeedDTO[]> {
  const needs = await prisma.need.findMany({
    // Comunidad: se muestran necesidades sin verificar (excepto las rechazadas).
    where: {
      verificationStatus: { not: "rejected" },
      ...(f.state ? { state: f.state } : {}),
      ...(f.category ? { category: f.category } : {}),
    },
    orderBy: [{ urgency: "desc" }, { updatedAt: "desc" }],
  });
  return needs.map(toDTO);
}
