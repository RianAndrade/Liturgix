import { Redis } from "ioredis";

if (!process.env.REDIS_URL && process.env.NODE_ENV === "production") {
  throw new Error("REDIS_URL é obrigatório em produção");
}

export const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379/0");
