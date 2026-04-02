import { Role } from "@prisma/client";

export interface JwtPayload {
  sub: number;
  role: Role;
  email: string;
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}
