import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { registerRoutes } from "./routes";
import { prisma } from "./db";

const app = Fastify({ logger: true });

// CORS: en producción define CORS_ORIGIN (lista separada por comas). Sin definir
// refleja el origen (cómodo en dev).
const corsEnv = process.env.CORS_ORIGIN;
await app.register(cors, {
  origin: corsEnv ? corsEnv.split(",").map((o) => o.trim()) : true,
});

// Rate limit global (anti-abuso de los GET públicos). POST /api/reports lo
// endurece a 5/min mediante su propia config de ruta.
await app.register(rateLimit, { global: true, max: 300, timeWindow: "1 minute" });

// No filtrar detalles internos en errores 500 (SECURITY_AND_PRIVACY.md).
app.setErrorHandler((err, req, reply) => {
  const status = err.statusCode ?? 500;
  if (status >= 500) {
    req.log.error(err);
    return reply.code(500).send({ error: "internal_error" });
  }
  return reply.code(status).send({ error: err.code ?? "error", message: err.message });
});

app.get("/health", async () => ({ ok: true }));

await registerRoutes(app);

const port = Number(process.env.PORT ?? 3000);
// Detrás de un reverse proxy (nginx) usa HOST=127.0.0.1.
const host = process.env.HOST ?? "0.0.0.0";

try {
  await app.listen({ port, host });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

// Apagado limpio: cierra Fastify y la conexión a la DB.
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    void (async () => {
      await app.close();
      await prisma.$disconnect();
      process.exit(0);
    })();
  });
}
