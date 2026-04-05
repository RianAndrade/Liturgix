import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { authGuard } from "../auth/auth.guard.js";
import { minRole } from "../../shared/middleware/role.guard.js";
import { getLiturgicalColor, getLiturgicalColors } from "../../shared/lib/liturgical-calendar.js";

const LITURGICAL_COLORS = ["GREEN", "WHITE", "RED", "PURPLE", "ROSE", "BLACK"] as const;

const celebrationSchema = z.object({
  name: z.string().min(2),
  date: z.string().datetime(),
  type: z.enum(["SUNDAY_MASS", "WEEKDAY_MASS", "HOLY_DAY", "SPECIAL"]),
  liturgicalColor: z.enum(LITURGICAL_COLORS).optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

const requirementsSchema = z.object({
  requirements: z.array(z.object({
    functionId: z.number().int().positive(),
    quantity: z.number().int().positive().default(1),
  })),
});

export default async function celebrationRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authGuard);

  // GET /api/celebrations
  app.get<{ Querystring: { startDate?: string; endDate?: string; type?: string; page?: string; perPage?: string } }>(
    "/api/celebrations",
    async (request) => {
      const { startDate, endDate, type, page: p, perPage: pp } = request.query;
      const page = Number(p) || 1;
      const perPage = Number(pp) || 20;
      const where: any = { active: true };

      if (startDate && endDate) {
        where.date = { gte: new Date(startDate), lte: new Date(endDate) };
      }
      if (type) where.type = type;

      const [celebrations, total] = await Promise.all([
        app.prisma.celebration.findMany({
          where,
          include: {
            functionRequirements: {
              select: { quantity: true, function: { select: { id: true, name: true } } },
            },
          },
          orderBy: { date: "asc" },
          skip: (page - 1) * perPage,
          take: perPage,
        }),
        app.prisma.celebration.count({ where }),
      ]);

      // Enriquece celebrações sem cor manual com a cor da API litúrgica
      const needColor = celebrations.filter((c) => !c.liturgicalColor);
      if (needColor.length > 0) {
        const colors = await getLiturgicalColors(needColor.map((c) => c.date));
        for (const c of needColor) {
          const key = c.date.toISOString().slice(0, 10);
          (c as any).resolvedLiturgicalColor = colors.get(key) ?? null;
        }
      }

      return {
        success: true,
        data: celebrations,
        pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
      };
    },
  );

  // POST /api/celebrations
  app.post("/api/celebrations", { preHandler: [minRole("COORDINATOR")] }, async (request, reply) => {
    const parsed = celebrationSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ statusCode: 400, error: "Validation Error", message: "Dados inválidos" });
    }
    const date = new Date(parsed.data.date);
    let { liturgicalColor } = parsed.data;

    // Auto-resolve cor litúrgica pela API se não foi informada
    if (!liturgicalColor) {
      const resolved = await getLiturgicalColor(date);
      if (resolved) liturgicalColor = resolved;
    }

    const celebration = await app.prisma.celebration.create({
      data: { ...parsed.data, date, liturgicalColor },
    });
    return reply.code(201).send({ success: true, data: celebration });
  });

  // GET /api/celebrations/:id
  app.get<{ Params: { id: string } }>("/api/celebrations/:id", async (request, reply) => {
    const id = Number(request.params.id);
    const celebration = await app.prisma.celebration.findUnique({
      where: { id, active: true },
      include: {
        functionRequirements: {
          select: { id: true, quantity: true, function: { select: { id: true, name: true } } },
        },
      },
    });
    if (!celebration) return reply.code(404).send({ statusCode: 404, error: "Not Found", message: "Celebração não encontrada" });

    // Enriquece com cor da API se não tem override manual
    if (!celebration.liturgicalColor) {
      const resolved = await getLiturgicalColor(celebration.date);
      (celebration as any).resolvedLiturgicalColor = resolved;
    }

    return { success: true, data: celebration };
  });

  // PATCH /api/celebrations/:id
  app.patch<{ Params: { id: string } }>("/api/celebrations/:id", {
    preHandler: [minRole("COORDINATOR")],
  }, async (request, reply) => {
    const id = Number(request.params.id);
    const partial = celebrationSchema.partial().safeParse(request.body);
    if (!partial.success) {
      return reply.code(400).send({ statusCode: 400, error: "Validation Error", message: "Dados inválidos" });
    }
    const data: any = { ...partial.data };
    if (data.date) data.date = new Date(data.date);

    const updated = await app.prisma.celebration.update({ where: { id }, data });
    return { success: true, data: updated };
  });

  // DELETE /api/celebrations/:id — soft delete
  app.delete<{ Params: { id: string } }>("/api/celebrations/:id", {
    preHandler: [minRole("COORDINATOR")],
  }, async (request) => {
    const id = Number(request.params.id);
    await app.prisma.celebration.update({ where: { id }, data: { active: false } });
    return { success: true, data: null };
  });

  // PUT /api/celebrations/:id/requirements
  app.put<{ Params: { id: string } }>("/api/celebrations/:id/requirements", {
    preHandler: [minRole("COORDINATOR")],
  }, async (request, reply) => {
    const id = Number(request.params.id);
    const parsed = requirementsSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ statusCode: 400, error: "Validation Error", message: "Dados inválidos" });
    }

    await app.prisma.$transaction([
      app.prisma.celebrationFunctionRequirement.deleteMany({ where: { celebrationId: id } }),
      ...parsed.data.requirements.map((r) =>
        app.prisma.celebrationFunctionRequirement.create({
          data: { celebrationId: id, functionId: r.functionId, quantity: r.quantity },
        }),
      ),
    ]);

    const reqs = await app.prisma.celebrationFunctionRequirement.findMany({
      where: { celebrationId: id },
      select: { id: true, quantity: true, function: { select: { id: true, name: true } } },
    });
    return { success: true, data: reqs };
  });
}
