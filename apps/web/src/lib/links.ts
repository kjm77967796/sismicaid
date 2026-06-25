// Prefija una ruta interna con el base path de Astro (import.meta.env.BASE_URL),
// para que la app funcione tanto en la raíz como bajo un subpath (p. ej. /sismicaid).
// BASE_URL puede venir con o sin barra final según el base; lo normalizamos.
const RAW = import.meta.env.BASE_URL;
const BASE = RAW.endsWith("/") ? RAW : `${RAW}/`;

export function link(path: string): string {
  return BASE + (path.startsWith("/") ? path.slice(1) : path);
}
