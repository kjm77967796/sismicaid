// Etiquetas en español para enums de dominio (presentación).
import type {
  CapacityStatus,
  NeedStatus,
  ReportType,
  ResourceStatus,
  ResourceType,
  Urgency,
  VerificationStatus,
} from "@sismicaid/shared";

export const VERIFICATION_LABEL: Record<VerificationStatus, string> = {
  pending: "Sin verificar",
  verified: "Verificado",
  rejected: "Rechazado",
  outdated: "Desactualizado",
};

export const VERIFICATION_VARIANT: Record<VerificationStatus, "verified" | "warning" | "danger" | "neutral"> = {
  pending: "warning",
  verified: "verified",
  rejected: "danger",
  outdated: "neutral",
};

export const RESOURCE_TYPE_LABEL: Record<ResourceType, string> = {
  shelter: "Refugio",
  hospital: "Hospital",
  collection_center: "Centro de acopio",
  water: "Punto de agua",
  food: "Punto de comida",
  charging_point: "Punto de carga",
  communication: "Comunicación",
  transport: "Transporte",
  volunteer_center: "Voluntariado",
};

export const RESOURCE_STATUS_LABEL: Record<ResourceStatus, string> = {
  active: "Activo",
  saturated: "Saturado",
  closed: "Cerrado",
  unknown: "Sin confirmar",
};

export const CAPACITY_LABEL: Record<CapacityStatus, string> = {
  available: "Con cupo",
  limited: "Cupo limitado",
  full: "Lleno",
  unknown: "Cupo sin confirmar",
};

export const URGENCY_LABEL: Record<Urgency, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  critical: "Crítica",
};

export const NEED_STATUS_LABEL: Record<NeedStatus, string> = {
  open: "Pendiente",
  in_progress: "En proceso",
  partially_covered: "Cubierto parcial",
  covered: "Cubierto",
  outdated: "Desactualizado",
};

export const REPORT_TYPE_LABEL: Record<ReportType, string> = {
  structural_damage: "Daño estructural",
  blocked_road: "Vía bloqueada",
  landslide: "Derrumbe",
  trapped_person: "Persona atrapada",
  urgent_need: "Necesidad urgente",
  available_resource: "Recurso disponible",
  active_shelter: "Refugio activo",
  collection_center: "Centro de acopio",
  operational_hospital: "Hospital operativo",
  electrical_risk: "Riesgo eléctrico",
  gas_leak: "Fuga de gas",
  no_signal_zone: "Zona sin señal",
  no_water_zone: "Zona sin agua",
  no_power_zone: "Zona sin luz",
};
