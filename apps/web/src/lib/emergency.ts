// Números de emergencia para llamada directa (tap-to-call) desde la pantalla
// de emergencia. Contenido estático: viaja en el bundle y funciona SIN conexión
// ni backend.
//
// IMPORTANTE (CLAUDE.md: "no inventes datos oficiales"): aquí solo va el número
// nacional confirmado de Venezuela (171 / VEN911, línea única de emergencias).
// Los números regionales de Protección Civil/Bomberos varían por estado y deben
// añadirse SOLO cuando estén verificados. No agregar números sin confirmar.
export interface EmergencyNumber {
  label: string;
  phone: string; // formato marcable, sin espacios
  note?: string;
}

export const EMERGENCY_NUMBERS: EmergencyNumber[] = [
  {
    label: "Emergencias (VEN911)",
    phone: "171",
    note: "Línea única nacional: policía, bomberos y ambulancia.",
  },
  // Añadir aquí números regionales verificados (Protección Civil, Bomberos del
  // estado, etc.) cuando se confirmen. Ejemplo de forma:
  // { label: "Protección Civil — La Guaira", phone: "0212XXXXXXX" },
];
