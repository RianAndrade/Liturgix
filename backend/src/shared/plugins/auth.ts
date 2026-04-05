import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import type { FastifyInstance } from "fastify";

export default fp(async (app: FastifyInstance) => {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET é obrigatório em produção");
  }

  await app.register(fastifyJwt, {
    secret: secret ?? "dev-secret-change-in-production",
    sign: { expiresIn: "7d" },
    cookie: { cookieName: "token", signed: false },
  });
});
