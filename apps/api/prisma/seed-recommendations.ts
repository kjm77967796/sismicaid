import { PrismaClient } from "../src/generated/prisma";

// Recomendaciones preventivas curadas desde guía oficial (SPEC §5.6 / §5.2).
// Contenido estático: el seed REEMPLAZA el set completo (no inventa datos
// oficiales dinámicos; es orientación de autoprotección).
// `body`: una viñeta por línea.
const prisma = new PrismaClient();

const RECS = [
  {
    context: "earthquake_during",
    title: "Durante un sismo",
    priority: 1,
    body: [
      "Agáchate, cúbrete y sujétate.",
      "Aléjate de ventanas y objetos que puedan caer.",
      "No corras hacia las escaleras durante la sacudida.",
      "Si estás afuera, aléjate de postes, cables, fachadas y árboles.",
      "Si vas manejando, detente en un lugar seguro y espera.",
    ].join("\n"),
  },
  {
    context: "tsunami",
    title: "Amenaza de tsunami",
    priority: 2,
    body: [
      "Aléjate de la costa de inmediato.",
      "Busca terreno alto o muévete tierra adentro.",
      "Si estás en la costa y sentiste un sismo fuerte o largo, no esperes confirmación.",
      "No regreses hasta que una autoridad confirme que es seguro.",
      "Evita playas, puertos, malecones y desembocaduras.",
    ].join("\n"),
  },
  {
    context: "coast",
    title: "Si estás en la costa",
    priority: 3,
    body: [
      "Aléjate del mar tras un sismo fuerte o largo.",
      "Busca terreno alto o muévete tierra adentro.",
      "No vayas a la playa a observar.",
      "Espera información oficial antes de volver.",
    ].join("\n"),
  },
  {
    context: "earthquake_after",
    title: "Después de un sismo",
    priority: 4,
    body: [
      "Prepárate para réplicas.",
      "No uses ascensores; usa escaleras con cuidado.",
      "Revisa si hay heridos y presta primeros auxilios.",
      "Revisa fugas de gas; no enciendas fuego si hueles gas.",
      "Usa SMS o mensajería para no saturar las líneas.",
    ].join("\n"),
  },
  {
    context: "damaged_building",
    title: "Edificios dañados",
    priority: 5,
    body: [
      "Mantente fuera de estructuras dañadas.",
      "Revisa grietas, cables caídos y fugas de gas.",
      "No uses ascensores.",
      "Sal con calma por rutas seguras.",
    ].join("\n"),
  },
  {
    context: "earthquake_before",
    title: "Kit básico de emergencia",
    priority: 6,
    body: [
      "Agua y alimentos no perecederos.",
      "Linterna, radio, pilas y powerbank.",
      "Documentos, medicinas y botiquín.",
      "Silbato y copia de contactos importantes.",
    ].join("\n"),
  },
  {
    context: "communications",
    title: "Comunicación en emergencia",
    priority: 7,
    body: [
      "Acuerda un punto de encuentro familiar.",
      "Define un contacto fuera de la zona afectada.",
      "Ten un mensaje corto predefinido.",
      "Evita llamadas salvo emergencia; prefiere SMS o mensajería.",
    ].join("\n"),
  },
] as const;

async function main(): Promise<void> {
  await prisma.$transaction([
    prisma.safetyRecommendation.deleteMany({}),
    prisma.safetyRecommendation.createMany({ data: RECS.map((r) => ({ ...r })) }),
  ]);
  const count = await prisma.safetyRecommendation.count();
  console.log(`safety_recommendations: ${count} filas`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
