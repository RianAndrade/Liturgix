import type { FastifyRequest, FastifyReply } from "fastify";
import { Role } from "@prisma/client";

const ROLE_HIERARCHY: Record<Role, number> = {
  ACOLYTE: 0,
  GUARDIAN: 1,
  COORDINATOR: 2,
  ADMIN: 3,
};

export function roleGuard(...allowedRoles: Role[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const userRole = request.user.role;
    if (!allowedRoles.includes(userRole)) {
      return reply.code(403).send({
        statusCode: 403,
        error: "Forbidden",
        message: "Permissão insuficiente",
      });
    }
  };
}

export function minRole(minRole: Role) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const userLevel = ROLE_HIERARCHY[request.user.role] ?? -1;
    const requiredLevel = ROLE_HIERARCHY[minRole];
    if (userLevel < requiredLevel) {
      return reply.code(403).send({
        statusCode: 403,
        error: "Forbidden",
        message: "Permissão insuficiente",
      });
    }
  };
}
