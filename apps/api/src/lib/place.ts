// Traduce la descripción de lugar de USGS (en inglés) a español, conservando
// los nombres propios. Ej: "5 km NE of Guatire, Venezuela" ->
// "5 km al NE de Guatire, Venezuela". Es localización, no alteración del dato:
// el evento mantiene su URL y payload oficial.

const DIR_ES: Record<string, string> = {
  N: "N",
  S: "S",
  E: "E",
  W: "O",
  NE: "NE",
  NW: "NO",
  SE: "SE",
  SW: "SO",
  NNE: "NNE",
  ENE: "ENE",
  ESE: "ESE",
  SSE: "SSE",
  SSW: "SSO",
  WSW: "OSO",
  WNW: "ONO",
  NNW: "NNO",
};

export function translatePlace(place: string | null): string | null {
  if (!place) return place;
  let p = place;
  // "5 km NE of Guatire, Venezuela" -> "5 km al NE de Guatire, Venezuela"
  p = p.replace(/^(\d+(?:\.\d+)?)\s*km\s+([NSEW]{1,3})\s+of\s+/i, (_m, dist: string, dir: string) => {
    const d = DIR_ES[dir.toUpperCase()] ?? dir.toUpperCase();
    return `${dist} km al ${d} de `;
  });
  // Frases genéricas comunes de los feeds USGS.
  p = p
    .replace(/^near the coast of\s+/i, "cerca de la costa de ")
    .replace(/^offshore\s+/i, "frente a la costa de ")
    .replace(/\bregion\b/gi, "región")
    .replace(/\s+of\s+/gi, " de ");
  return p;
}
