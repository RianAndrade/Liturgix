import type { FastifyRequest, FastifyReply } from "fastify";
import { redis } from "../../shared/lib/redis.js";

export async function authGuard(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();

    // Check JWT blacklist (logout)
    const token = request.headers.authorization?.replace("Bearer ", "");
    if (token) {
      const blacklisted = await redis.get(`bl:${token}`);
      if (blacklisted) {
        return reply.code(401).send({
          statusCode: 401,
          error: "Unauthorized",
          message: "Token invalidado",
        });
      }
    }
  } catch {
    return reply.code(401).send({
      statusCode: 401,
      error: "Unauthorized",
      message: "Token inválido ou ausente",
    });
  }
}
