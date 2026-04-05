import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { authGuard } from "../auth/auth.guard.js";
import { minRole } from "../../shared/middleware/role.guard.js";

const functionSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  displayOrder: z.number().int().positive(),
});

const functionUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  displayOrder: z.number().int().positive().optional(),
  active: z.boolean().optional(),
});

const userUpdateSchema = z.object({
  role: z.enum(["ACOLYTE", "GUARDIAN", "COORDINATOR", "ADMIN"]).optional(),
  active: z.boolean().optional(),
});

export default async function adminRoutes(app: FastifyInstance) {
  // All admin routes require ADMIN role
  app.addHook("preHandler", authGuard);
  app.addHook("preHandler", minRole("ADMIN"));

  // GET /api/admin/functions — list all functions (including inactive)
  app.get("/api/admin/functions", async () => {
    const functions = await app.prisma.liturgicalFunction.findMany({
      orderBy: { displayOrder: "asc" },
    });
    return { success: true, data: functions };
  });

  // POST /api/admin/functions — create function
  app.post("/api/admin/functions", async (request, reply) => {
    const parsed = functionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        statusCode: 400,
        error: "Validation Error",
        message: "Dados inválidos",
      });
    }

    const existing = await app.prisma.liturgicalFunction.findUnique({
      where: { name: parsed.data.name },
    });
    if (existing) {
      return reply.code(409).send({
        statusCode: 409,
        error: "Conflict",
        message: "Já existe uma função com este nome",
      });
    }

    const fn = await app.prisma.liturgicalFunction.create({ data: parsed.data });
    return reply.code(201).send({ success: true, data: fn });
  });

  // PATCH /api/admin/functions/:id — update function
  app.patch<{ Params: { id: string } }>("/api/admin/functions/:id", async (request, reply) => {
    const id = Number(request.params.id);
    if (isNaN(id)) return reply.code(400).send({ statusCode: 400, error: "Bad Request", message: "ID inválido" });

    const parsed = functionUpdateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        statusCode: 400,
        error: "Validation Error",
        message: "Dados inválidos",
      });
    }

    const fn = await app.prisma.liturgicalFunction.findUnique({ where: { id } });
    if (!fn) {
      return reply.code(404).send({ statusCode: 404, error: "Not Found", message: "Função não encontrada" });
    }

    if (parsed.data.name && parsed.data.name !== fn.name) {
      const dup = await app.prisma.liturgicalFunction.findUnique({ where: { name: parsed.data.name } });
      if (dup) {
        return reply.code(409).send({ statusCode: 409, error: "Conflict", message: "Já existe uma função com este nome" });
      }
    }

    const updated = await app.prisma.liturgicalFunction.update({
      where: { id },
      data: parsed.data,
    });

    return { success: true, data: updated };
  });

  // GET /api/admin/users — list all users
  app.get<{ Querystring: { role?: string; active?: string; page?: string; perPage?: string } }>(
    "/api/admin/users",
    async (request) => {
      const page = Number(request.query.page) || 1;
      const perPage = Number(request.query.perPage) || 50;
      const where: any = {};

      if (request.query.role) where.role = request.query.role;
      if (request.query.active !== undefined) where.active = request.query.active === "true";

      const [users, total] = await Promise.all([
        app.prisma.user.findMany({
          where,
          select: {
            id: true, name: true, email: true, role: true, active: true, createdAt: true,
            _count: { select: { serviceRecords: true, guardianLinks: true, acolyteLinks: true } },
          },
          orderBy: { name: "asc" },
          skip: (page - 1) * perPage,
          take: perPage,
        }),
        app.prisma.user.count({ where }),
      ]);

      return {
        success: true,
        data: users.map((u) => ({
          ...u,
          serviceCount: u._count.serviceRecords,
          guardianLinkCount: u._count.guardianLinks,
          acolyteLinkCount: u._count.acolyteLinks,
          _count: undefined,
        })),
        pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
      };
    },
  );

  // PATCH /api/admin/users/:id — update user role/active
  app.patch<{ Params: { id: string } }>("/api/admin/users/:id", async (request, reply) => {
    const id = Number(request.params.id);
    if (isNaN(id)) return reply.code(400).send({ statusCode: 400, error: "Bad Request", message: "ID inválido" });

    const parsed = userUpdateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ statusCode: 400, error: "Validation Error", message: "Dados inválidos", details: parsed.error.flatten().fieldErrors });
    }

    const user = await app.prisma.user.findUnique({ where: { id } });
    if (!user) return reply.code(404).send({ statusCode: 404, error: "Not Found", message: "Usuário não encontrado" });

    // Prevent admin from demoting themselves
    if (id === request.user.sub && parsed.data.role && parsed.data.role !== "ADMIN") {
      return reply.code(400).send({ statusCode: 400, error: "Bad Request", message: "Não é possível alterar seu próprio papel" });
    }

    const updated = await app.prisma.user.update({ where: { id }, data: parsed.data });
    return {
      success: true,
      data: { id: updated.id, name: updated.name, email: updated.email, role: updated.role, active: updated.active },
    };
  });

  // GET /api/admin/audit-log — global audit log
  app.get<{ Querystring: { page?: string; perPage?: string; action?: string } }>(
    "/api/admin/audit-log",
    async (request) => {
      const page = Number(request.query.page) || 1;
      const perPage = Number(request.query.perPage) || 50;
      const where: any = {};
      if (request.query.action) where.action = request.query.action;

      const [logs, total] = await Promise.all([
        app.prisma.scheduleAuditLog.findMany({
          where,
          include: {
            schedule: { select: { id: true, name: true } },
            performedBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * perPage,
          take: perPage,
        }),
        app.prisma.scheduleAuditLog.count({ where }),
      ]);

      return {
        success: true,
        data: logs,
        pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
      };
    },
  );

  // GET /api/admin/stats — basic stats
  app.get("/api/admin/stats", async () => {
    const [usersByRole, totalCelebrations, totalSchedules] = await Promise.all([
      app.prisma.user.groupBy({ by: ["role"], _count: true, where: { active: true } }),
      app.prisma.celebration.count({ where: { active: true } }),
      app.prisma.schedule.count(),
    ]);

    return {
      success: true,
      data: {
        users: Object.fromEntries(usersByRole.map((r) => [r.role, r._count])),
        totalCelebrations,
        totalSchedules,
      },
    };
  });
}
