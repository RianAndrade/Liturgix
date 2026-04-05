import type { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import { registerSchema, loginSchema } from "./auth.schema.js";
import { authGuard } from "./auth.guard.js";
import { redis } from "../../shared/lib/redis.js";
import type { JwtPayload } from "../../shared/types/index.js";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === "true",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 7 * 24 * 60 * 60, // 7 days (same as JWT)
};

export default async function authRoutes(app: FastifyInstance) {
  // POST /api/auth/register
  app.post("/api/auth/register", { config: { rateLimit: { max: 5, timeWindow: "1 minute" } } }, async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        statusCode: 400,
        error: "Validation Error",
        message: "Dados inválidos",
      });
    }

    const { name, email, password, role } = parsed.data;

    const existing = await app.prisma.user.findUnique({ where: { email } });
    if (existing) {
      return reply.code(409).send({
        statusCode: 409,
        error: "Conflict",
        message: "Email já cadastrado",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await app.prisma.user.create({
      data: { name, email, passwordHash, role },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    const payload: JwtPayload = { sub: user.id, role: user.role, email: user.email };
    const token = app.jwt.sign(payload);

    return reply
      .setCookie("token", token, COOKIE_OPTIONS)
      .code(201)
      .send({ success: true, data: { user } });
  });

  // POST /api/auth/login
  app.post("/api/auth/login", { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } }, async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        statusCode: 400,
        error: "Validation Error",
        message: "Dados inválidos",
      });
    }

    const { email, password } = parsed.data;

    const user = await app.prisma.user.findUnique({
      where: { email, active: true },
      select: { id: true, name: true, email: true, role: true, passwordHash: true, createdAt: true },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return reply.code(401).send({
        statusCode: 401,
        error: "Unauthorized",
        message: "Credenciais inválidas",
      });
    }

    const { passwordHash: _, ...userData } = user;
    const payload: JwtPayload = { sub: user.id, role: user.role, email: user.email };
    const token = app.jwt.sign(payload);

    return reply
      .setCookie("token", token, COOKIE_OPTIONS)
      .send({ success: true, data: { user: userData } });
  });

  // POST /api/auth/logout
  app.post("/api/auth/logout", { preHandler: [authGuard] }, async (request, reply) => {
    const token = request.cookies.token;
    if (token) {
      await redis.set(`bl:${token}`, "1", "EX", 7 * 24 * 60 * 60);
    }

    return reply
      .clearCookie("token", { path: "/" })
      .send({ success: true, data: null });
  });

  // GET /api/auth/me
  app.get("/api/auth/me", { preHandler: [authGuard] }, async (request) => {
    const user = await app.prisma.user.findUnique({
      where: { id: request.user.sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        userFunctions: {
          select: {
            function: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!user || !user.active) {
      return { statusCode: 404, error: "Not Found", message: "Usuário não encontrado" };
    }

    return {
      success: true,
      data: {
        ...user,
        functions: user.userFunctions.map((uf) => uf.function),
        userFunctions: undefined,
      },
    };
  });
}
