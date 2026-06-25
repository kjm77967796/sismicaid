import type { CitizenReportDTO, CreateReportInput } from "@sismicaid/shared";
import { ApiError, apiPost } from "./api";

// Cola local de reportes para enviar cuando falla la red. Se reintenta al
// recuperar conexión. Un error de validación (4xx) NO se encola: se muestra.

const KEY = "ltt:outbox:reports";

interface QueuedReport {
  id: string;
  input: CreateReportInput;
  queuedAt: number;
}

function read(): QueuedReport[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as QueuedReport[];
  } catch {
    return [];
  }
}

function write(q: QueuedReport[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(q));
  } catch {
    // sin almacenamiento: no es fatal.
  }
}

export function pendingCount(): number {
  return read().length;
}

function enqueue(input: CreateReportInput): void {
  const q = read();
  q.push({ id: crypto.randomUUID(), input, queuedAt: Date.now() });
  write(q);
}

export type SubmitResult = "sent" | "queued";

export async function submitReport(input: CreateReportInput): Promise<SubmitResult> {
  try {
    await apiPost<CitizenReportDTO>("/api/reports", input);
    return "sent";
  } catch (e) {
    // 4xx = problema del reporte (validación/rate limit): propagar para mostrar.
    if (e instanceof ApiError && e.status >= 400 && e.status < 500) throw e;
    // Red caída o 5xx: guardar localmente y reintentar luego.
    enqueue(input);
    return "queued";
  }
}

export async function flushOutbox(): Promise<number> {
  const q = read();
  if (q.length === 0) return 0;
  const remaining: QueuedReport[] = [];
  let sent = 0;
  for (const item of q) {
    try {
      await apiPost<CitizenReportDTO>("/api/reports", item.input);
      sent++;
    } catch (e) {
      // Descarta los rechazados por validación; reintenta los de red/servidor.
      if (e instanceof ApiError && e.status >= 400 && e.status < 500) continue;
      remaining.push(item);
    }
  }
  write(remaining);
  return sent;
}

export function initOutboxAutoFlush(): void {
  if (typeof window === "undefined") return;
  window.addEventListener("online", () => {
    void flushOutbox();
  });
}
