import { PrismaClient } from "./generated/prisma";

// Singleton: evita abrir múltiples pools con tsx watch / hot-reload en dev.
// ponytail: sin capas de repositorio todavía; los servicios usan `prisma` directo.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
