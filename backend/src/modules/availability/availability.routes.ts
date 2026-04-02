import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { authGuard } from "../auth/auth.guard.js";

const dateEntry = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  period: z.enum(["ALL_DAY", "MORNING_ONLY", "NIGHT_ONLY"]).default("ALL_DAY"),
});

const setAvailabilitySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dates: z.array(dateEntry),
});

export default async function availabilityRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authGuard);

  // GET /api/servers/:id/availability?startDate=&endDate=
  app.get<{ Params: { id: string }; Querystring: { startDate?: string; endDate?: string } }>(
    "/api/servers/:id/availability",
    async (request) => {
      const id = Number(request.params.id);
      const where: any = { userId: id };

      if (request.query.startDate && request.query.endDate) {
        where.date = {
          gte: new Date(request.query.startDate),
          lte: new Date(request.query.endDate),
        };
      }

      const unavailabilities = await app.prisma.unavailability.findMany({
        where,
        select: { id: true, date: true, reason: true, period: true },
        orderBy: { date: "asc" },
      });

      return { success: true, data: unavailabilities };
    },
  );

  // PUT /api/servers/:id/availability — replace availability for period
  app.put<{ Params: { id: string } }>("/api/servers/:id/availability", async (request, reply) => {
    const id = Number(request.params.id);
    const user = request.user;

    // ACOLYTE can only edit own, GUARDIAN can edit linked
    if (user.role === "ACOLYTE" && user.sub !== id) {
      return reply.code(403).send({ statusCode: 403, error: "Forbidden", message: "Permissão insuficiente" });
    }
    if (user.role === "GUARDIAN") {
      const link = await app.prisma.guardianLink.findFirst({
        where: { guardianId: user.sub, acolyteId: id },
      });
      if (!link) return reply.code(403).send({ statusCode: 403, error: "Forbidden", message: "Acólito não vinculado" });
    }

    const parsed = setAvailabilitySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ statusCode: 400, error: "Validation Error", message: "Dados inválidos" });
    }

    const { startDate, endDate, dates } = parsed.data;

    await app.prisma.$transaction([
      // Delete existing in period
      app.prisma.unavailability.deleteMany({
        where: {
          userId: id,
          date: { gte: new Date(startDate), lte: new Date(endDate) },
        },
      }),
      // Create new
      ...dates.map((d) =>
        app.prisma.unavailability.create({
          data: { userId: id, date: new Date(d.date), period: d.period },
        }),
      ),
    ]);

    const updated = await app.prisma.unavailability.findMany({
      where: { userId: id, date: { gte: new Date(startDate), lte: new Date(endDate) } },
      select: { id: true, date: true, reason: true, period: true },
      orderBy: { date: "asc" },
    });

    return { success: true, data: updated };
  });
}
