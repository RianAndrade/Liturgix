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
        details: parsed.error.flatten().fieldErrors,
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
        details: parsed.error.flatten().fieldErrors,
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
