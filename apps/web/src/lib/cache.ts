// Caché de último dato válido para funcionar offline / con backend caído.
// Guarda el último payload exitoso en localStorage y lo devuelve como respaldo.

export interface Cached<T> {
  data: T;
  fromCache: boolean; // true si se sirvió desde el respaldo local
  savedAt: number | null; // epoch ms del dato servido
}

const PREFIX = "ltt:cache:";

export async function fetchWithCache<T>(key: string, fetcher: () => Promise<T>): Promise<Cached<T>> {
  try {
    const data = await fetcher();
    const savedAt = Date.now();
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify({ data, savedAt }));
    } catch {
      // localStorage lleno o no disponible: no es fatal.
    }
    return { data, fromCache: false, savedAt };
  } catch (err) {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(PREFIX + key) : null;
    if (raw) {
      const parsed = JSON.parse(raw) as { data: T; savedAt: number };
      return { data: parsed.data, fromCache: true, savedAt: parsed.savedAt };
    }
    throw err;
  }
}
