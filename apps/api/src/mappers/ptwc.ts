import type { TsunamiProvider, TsunamiStatus } from "@sismicaid/shared";

// Normaliza una entrada Atom de tsunami.gov (PTWC/NTWC) a tsunami_alerts.
// Función PURA. El estado real viene del campo "Category" dentro del summary
// (Information/Watch/Advisory/Warning/Cancellation), NO del tsunami_flag sísmico.

export interface PtwcEntry {
  id?: string;
  title?: string;
  updated?: string;
  lat?: number | string | null;
  long?: number | string | null;
  summary?: string | null; // xhtml o texto
}

export interface NormalizedTsunamiAlert {
  externalId: string;
  provider: TsunamiProvider;
  status: TsunamiStatus;
  headline: string;
  description: string | null;
  affectedAreaText: string | null;
  effectiveAt: Date | null;
  expiresAt: Date | null;
  eventTimeUtc: Date | null;
  rawPayload: unknown;
}

function stripTags(s: string): string {
  return s
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// "Category: Warning" / "Cancellation" -> TsunamiStatus.
function statusFromText(text: string): TsunamiStatus {
  const m = /Category:\s*([A-Za-z]+)/i.exec(text);
  const word = (m?.[1] ?? "").toLowerCase();
  switch (word) {
    case "information":
      return "information";
    case "watch":
      return "watch";
    case "advisory":
      return "advisory";
    case "warning":
      return "warning";
    case "cancellation":
    case "canceled":
    case "cancelled":
    case "cancel":
      return "canceled";
    default:
      return "unknown";
  }
}

function affectedRegion(text: string, fallback: string): string {
  const m = /Affected Region:\s*(.+?)\s*(?:Note:|Preliminary|Bulletin|$)/i.exec(text);
  return m?.[1]?.trim() || fallback;
}

function parseDate(v: string | undefined): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function mapPtwcEntry(entry: PtwcEntry, provider: TsunamiProvider): NormalizedTsunamiAlert {
  const headline = (entry.title ?? "").trim() || "Mensaje de tsunami";
  const summaryRaw = entry.summary ?? "";
  const text = stripTags(summaryRaw);
  const effectiveAt = parseDate(entry.updated);

  return {
    // CAP/Atom id es único; si falta, derivamos uno estable.
    externalId: entry.id?.trim() || `${provider}:${headline}:${entry.updated ?? ""}`,
    provider,
    status: statusFromText(text),
    headline,
    description: text || null,
    affectedAreaText: affectedRegion(text, headline),
    effectiveAt,
    expiresAt: null, // el feed Atom no expone expiración; queda null.
    eventTimeUtc: effectiveAt,
    rawPayload: entry,
  };
}
