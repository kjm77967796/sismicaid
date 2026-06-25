import type { ResourceDTO, ResourceType } from "@sismicaid/shared";
import { RESOURCE_TYPE } from "@sismicaid/shared";
import { prisma } from "../db";
import type { Resource } from "../generated/prisma";

export function isResourceType(v: string): v is ResourceType {
  return (RESOURCE_TYPE as readonly string[]).includes(v);
}

export interface ResourceFilters {
  state?: string;
  type?: ResourceType;
}

// Privacidad (SECURITY_AND_PRIVACY.md): solo se publican coordenadas cuando la
// ubicación es exacta y pública. Para approximate/area se ocultan; la UI usa
// estado/municipio. Nunca exponemos un punto preciso de una ubicación sensible.
function toDTO(r: Resource): ResourceDTO {
  const exact = r.locationPrecision === "exact";
  return {
    id: r.id,
    type: r.type,
    name: r.name,
    state: r.state,
    municipality: r.municipality,
    parish: r.parish,
    latitude: exact ? r.latitude : null,
    longitude: exact ? r.longitude : null,
    locationPrecision: r.locationPrecision,
    status: r.status,
    capacityStatus: r.capacityStatus,
    description: r.description,
    publicContact: r.publicContact,
    verificationStatus: r.verificationStatus,
    source: null,
    lastVerifiedAt: r.lastVerifiedAt?.toISOString() ?? null,
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function listResources(f: ResourceFilters): Promise<ResourceDTO[]> {
  const resources = await prisma.resource.findMany({
    // Comunidad: se muestran entradas sin verificar (excepto las rechazadas).
    // La UI las etiqueta claramente como no verificadas / no oficiales.
    where: {
      verificationStatus: { not: "rejected" },
      ...(f.state ? { state: f.state } : {}),
      ...(f.type ? { type: f.type } : {}),
    },
    orderBy: { updatedAt: "desc" },
  });
  return resources.map(toDTO);
}
