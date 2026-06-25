import { z } from "zod";
import { LOCATION_PRECISION, REPORT_SOURCE_TYPE, REPORT_TYPE, URGENCY } from "@sismicaid/shared";

// z.enum a partir de los arrays runtime de @sismicaid/shared, preservando el tipo unión.
function zEnum<T extends readonly [string, ...string[]]>(vals: T) {
  return z.enum(vals as unknown as [T[number], ...T[number][]]);
}

// Validación en la frontera de confianza (SECURITY_AND_PRIVACY.md):
// - .strict() rechaza campos extra -> un cliente NO puede colar verificationStatus.
// - Evidencia solo como URL (sin subida de imágenes en MVP -> sin riesgo EXIF).
// - Strings recortadas y acotadas (sanitización básica).
export const createReportSchema = z
  .object({
    reportType: zEnum(REPORT_TYPE),
    title: z.string().trim().min(3).max(140),
    description: z.string().trim().max(2000).optional(),
    state: z.string().trim().min(2).max(80),
    municipality: z.string().trim().max(80).optional(),
    parish: z.string().trim().max(80).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    locationPrecision: zEnum(LOCATION_PRECISION),
    urgency: zEnum(URGENCY),
    evidenceUrl: z.string().trim().url().max(500).optional(),
    reportSourceType: zEnum(REPORT_SOURCE_TYPE),
    privateContact: z.string().trim().max(200).optional(),
  })
  .strict();

export type CreateReportParsed = z.infer<typeof createReportSchema>;
