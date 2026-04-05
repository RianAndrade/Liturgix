import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyCors from "@fastify/cors";
import fastifyCookie from "@fastify/cookie";
import fastifyRateLimit from "@fastify/rate-limit";
import path from "node:path";
import { fileURLToPath } from "node:url";

import prismaPlugin from "./shared/plugins/prisma.js";
import authPlugin from "./shared/plugins/auth.js";
import authRoutes from "./modules/auth/auth.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";
import serverRoutes from "./modules/server/server.routes.js";
import availabilityRoutes from "./modules/availability/availability.routes.js";
import celebrationRoutes from "./modules/celebration/celebration.routes.js";
import scheduleRoutes from "./modules/schedule/schedule.routes.js";
import guardianRoutes from "./modules/guardian/guardian.routes.js";
import publicRoutes from "./modules/public/public.routes.js";
import { redis } from "./shared/lib/redis.js";

import "./shared/types/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = Fastify({ logger: true });

// Plugins
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",")
  : ["http://localhost:5173", "http://localhost:3000"];
await app.register(fastifyCors, { origin: allowedOrigins, credentials: true });
await app.register(fastifyCookie);
await app.register(fastifyRateLimit, { max: 100, timeWindow: "1 minute" });
await app.register(prismaPlugin);
await app.register(authPlugin);

// Serve React frontend em produção
if (process.env.NODE_ENV === "production") {
  await app.register(fastifyStatic, {
    root: path.join(__dirname, "..", "public"),
    prefix: "/",
  });
}

// Health check
app.get("/api/health", async () => {
  const dbResult = await app.prisma.$queryRaw<[{ now: Date }]>`SELECT NOW()`;
  const redisPing = await redis.ping();
  return {
    status: "ok",
    db: dbResult[0].now,
    redis: redisPing,
  };
});

// Routes
await app.register(authRoutes);
await app.register(adminRoutes);
await app.register(serverRoutes);
await app.register(availabilityRoutes);
await app.register(celebrationRoutes);
await app.register(scheduleRoutes);
await app.register(guardianRoutes);
await app.register(publicRoutes);

// SPA fallback
if (process.env.NODE_ENV === "production") {
  app.setNotFoundHandler(async (_request, reply) => {
    return reply.sendFile("index.html");
  });
}

const port = Number(process.env.PORT) || 3000;
await app.listen({ port, host: "0.0.0.0" });
