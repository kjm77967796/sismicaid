import { PrismaClient } from "../src/generated/prisma";

// Zonas costeras base de Venezuela (SPEC §7.2.5). Geometría APROXIMADA (un punto
// representativo por estado); no implica precisión oficial. risk_level inicial
// "none" — el riesgo real lo actualiza el flujo de alertas (Slice 3+).
const prisma = new PrismaClient();

const ZONES = [
  { name: "La Guaira", state: "La Guaira", lat: 10.6, lon: -66.93 },
  { name: "Falcón", state: "Falcón", lat: 11.4, lon: -69.68 },
  { name: "Carabobo", state: "Carabobo", lat: 10.48, lon: -68.07 },
  { name: "Aragua", state: "Aragua", lat: 10.5, lon: -67.75 },
  { name: "Miranda", state: "Miranda", lat: 10.58, lon: -66.1 },
  { name: "Anzoátegui", state: "Anzoátegui", lat: 10.2, lon: -64.63 },
  { name: "Sucre", state: "Sucre", lat: 10.45, lon: -64.18 },
  { name: "Nueva Esparta", state: "Nueva Esparta", lat: 11.0, lon: -63.85 },
  { name: "Zulia", state: "Zulia", lat: 11.0, lon: -71.6 },
  { name: "Delta Amacuro", state: "Delta Amacuro", lat: 9.5, lon: -60.8 },
] as const;

async function main(): Promise<void> {
  for (const z of ZONES) {
    const geo = { type: "Point", coordinates: [z.lon, z.lat] };
    await prisma.coastalAlertZone.upsert({
      where: { name: z.name },
      update: { state: z.state, coastlineGeojson: geo },
      create: { name: z.name, state: z.state, coastlineGeojson: geo, riskLevel: "none" },
    });
  }
  const count = await prisma.coastalAlertZone.count();
  console.log(`coastal_alert_zones: ${count} filas`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
