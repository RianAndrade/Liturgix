import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { Queue } from "bullmq";
import { authGuard } from "../auth/auth.guard.js";
import { minRole } from "../../shared/middleware/role.guard.js";
import { nanoid } from "nanoid";

const generateSchema = z.object({
  name: z.string().min(2),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

let queue: Queue;

export default async function scheduleRoutes(app: FastifyInstance) {
  const redisUrl = new URL(process.env.REDIS_URL ?? "redis://localhost:6379/0");
  queue = new Queue("schedule-generation", {
    connection: { host: redisUrl.hostname, port: Number(redisUrl.port) || 6379 },
  });

  app.addHook("preHandler", authGuard);

  // GET /api/schedules
  app.get<{ Querystring: { status?: string; page?: string; perPage?: string } }>(
    "/api/schedules",
    async (request) => {
      const user = request.user;
      const page = Number(request.query.page) || 1;
      const perPage = Number(request.query.perPage) || 20;
      const where: any = {};

      if (request.query.status) where.status = request.query.status;
      // ACOLYTE/GUARDIAN only see PUBLISHED
      if (user.role === "ACOLYTE" || user.role === "GUARDIAN") {
        where.status = "PUBLISHED";
      }

      const [schedules, total] = await Promise.all([
        app.prisma.schedule.findMany({
          where,
          select: {
            id: true, name: true, startDate: true, endDate: true,
            status: true, publicToken: true, generatedAt: true, publishedAt: true,
            createdBy: { select: { id: true, name: true } },
            _count: { select: { assignments: true } },
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * perPage,
          take: perPage,
        }),
        app.prisma.schedule.count({ where }),
      ]);

      return {
        success: true,
        data: schedules.map((s) => ({ ...s, assignmentCount: s._count.assignments, _count: undefined })),
        pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
      };
    },
  );

  // POST /api/schedules/generate
  app.post("/api/schedules/generate", { preHandler: [minRole("COORDINATOR")] }, async (request, reply) => {
    const parsed = generateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ statusCode: 400, error: "Validation Error", message: "Dados inválidos" });
    }

    const { name, startDate, endDate } = parsed.data;

    // Create schedule in DRAFT
    const schedule = await app.prisma.schedule.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: "DRAFT",
        createdById: request.user.sub,
      },
    });

    // Enqueue generation job
    const job = await queue.add("generate", { scheduleId: schedule.id });

    return reply.code(202).send({
      success: true,
      data: { scheduleId: schedule.id, jobId: job.id },
    });
  });

  // GET /api/schedules/:id
  app.get<{ Params: { id: string } }>("/api/schedules/:id", async (request, reply) => {
    const id = Number(request.params.id);
    const schedule = await app.prisma.schedule.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true } },
        assignments: {
          include: {
            celebration: { select: { id: true, name: true, date: true, type: true } },
            function: { select: { id: true, name: true } },
            user: { select: { id: true, name: true } },
          },
          orderBy: [{ celebration: { date: "asc" } }, { function: { displayOrder: "asc" } }],
        },
      },
    });

    if (!schedule) return reply.code(404).send({ statusCode: 404, error: "Not Found", message: "Escala não encontrada" });

    // ACOLYTE/GUARDIAN can only see PUBLISHED
    if ((request.user.role === "ACOLYTE" || request.user.role === "GUARDIAN") && schedule.status !== "PUBLISHED") {
      return reply.code(403).send({ statusCode: 403, error: "Forbidden", message: "Escala não publicada" });
    }

    return { success: true, data: schedule };
  });

  // POST /api/schedules/:id/publish
  app.post<{ Params: { id: string } }>("/api/schedules/:id/publish", {
    preHandler: [minRole("COORDINATOR")],
  }, async (request, reply) => {
    const id = Number(request.params.id);
    const schedule = await app.prisma.schedule.findUnique({ where: { id } });
    if (!schedule) return reply.code(404).send({ statusCode: 404, error: "Not Found", message: "Escala não encontrada" });
    if (schedule.status !== "DRAFT") {
      return reply.code(400).send({ statusCode: 400, error: "Bad Request", message: "Apenas escalas em rascunho podem ser publicadas" });
    }

    const updated = await app.prisma.schedule.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        publicToken: nanoid(12),
        publishedAt: new Date(),
      },
    });

    return { success: true, data: updated };
  });

  // PATCH /api/schedules/:id — edit metadata/status
  app.patch<{ Params: { id: string } }>("/api/schedules/:id", {
    preHandler: [minRole("COORDINATOR")],
  }, async (request, reply) => {
    const id = Number(request.params.id);
    const body = request.body as any;
    const data: any = {};

    if (body.name) data.name = body.name;
    if (body.status === "ARCHIVED") data.status = "ARCHIVED";

    const updated = await app.prisma.schedule.update({ where: { id }, data });
    return { success: true, data: updated };
  });

  // POST /api/schedules/:id/assignments — manual assignment
  app.post<{ Params: { id: string } }>("/api/schedules/:id/assignments", {
    preHandler: [minRole("COORDINATOR")],
  }, async (request, reply) => {
    const scheduleId = Number(request.params.id);
    const { celebrationId, functionId, userId } = request.body as any;

    const assignment = await app.prisma.scheduleAssignment.create({
      data: { scheduleId, celebrationId, functionId, userId, locked: true },
    });
    return reply.code(201).send({ success: true, data: assignment });
  });

  // PATCH /api/schedules/:id/assignments/:assignmentId
  app.patch<{ Params: { id: string; assignmentId: string } }>(
    "/api/schedules/:id/assignments/:assignmentId",
    { preHandler: [minRole("COORDINATOR")] },
    async (request) => {
      const assignmentId = Number(request.params.assignmentId);
      const body = request.body as any;
      const data: any = {};
      if (body.userId !== undefined) data.userId = body.userId;
      if (body.locked !== undefined) data.locked = body.locked;

      const updated = await app.prisma.scheduleAssignment.update({
        where: { id: assignmentId },
        data,
      });
      return { success: true, data: updated };
    },
  );

  // DELETE /api/schedules/:id/assignments/:assignmentId
  app.delete<{ Params: { id: string; assignmentId: string } }>(
    "/api/schedules/:id/assignments/:assignmentId",
    { preHandler: [minRole("COORDINATOR")] },
    async (request) => {
      const assignmentId = Number(request.params.assignmentId);
      await app.prisma.scheduleAssignment.delete({ where: { id: assignmentId } });
      return { success: true, data: null };
    },
  );

  // GET /api/schedules/:id/audit
  app.get<{ Params: { id: string } }>("/api/schedules/:id/audit", {
    preHandler: [minRole("COORDINATOR")],
  }, async (request) => {
    const scheduleId = Number(request.params.id);
    const logs = await app.prisma.scheduleAuditLog.findMany({
      where: { scheduleId },
      include: { performedBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: logs };
  });
}
