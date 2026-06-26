// Números de emergencia para llamada directa (tap-to-call) desde la pantalla
// de emergencia. Contenido estático: viaja en el bundle y funciona SIN conexión
// ni backend.
//
// IMPORTANTE (CLAUDE.md: "no inventes datos oficiales"): el código de emergencia
// nacional (VEN911) se marca distinto según el operador. Aquí van los códigos
// confirmados por operador. Los números regionales de Protección Civil/Bomberos
// varían por estado y deben añadirse SOLO cuando estén verificados.
export interface EmergencyNumber {
  label: string;
  phone: string; // formato marcable (puede incluir * para códigos cortos)
  note?: string;
}

export const EMERGENCY_NUMBERS: EmergencyNumber[] = [
  { label: "Emergencias", phone: "171", note: "Desde un fijo Cantv" },
  { label: "Emergencias", phone: "*1", note: "Desde Movilnet" },
  { label: "Emergencias", phone: "112", note: "Desde Digitel" },
  { label: "Emergencias", phone: "911", note: "Desde Movistar" },
  // Añadir aquí números regionales verificados (Protección Civil, Bomberos del
  // estado, etc.) cuando se confirmen. Ejemplo de forma:
  // { label: "Protección Civil — La Guaira", phone: "0212XXXXXXX" },
];
