import type { FastifyInstance } from "fastify";

export default async function publicRoutes(app: FastifyInstance) {
  // GET /api/public/schedules/:token — public schedule (no auth)
  app.get<{ Params: { token: string } }>("/api/public/schedules/:token", async (request, reply) => {
    const { token } = request.params;
    const schedule = await app.prisma.schedule.findUnique({
      where: { publicToken: token },
      include: {
        assignments: {
          where: { userId: { not: null } },
          include: {
            celebration: { select: { id: true, name: true, date: true, type: true, location: true } },
            function: { select: { id: true, name: true } },
            user: { select: { name: true } },
          },
          orderBy: [{ celebration: { date: "asc" } }, { function: { displayOrder: "asc" } }],
        },
      },
    });

    if (!schedule || schedule.status !== "PUBLISHED") {
      return reply.code(404).send({ statusCode: 404, error: "Not Found", message: "Escala não encontrada" });
    }

    // Only first name for privacy
    const data = {
      name: schedule.name,
      startDate: schedule.startDate,
      endDate: schedule.endDate,
      assignments: schedule.assignments.map((a) => ({
        celebration: a.celebration,
        function: a.function,
        acolyte: a.user ? { name: a.user.name.split(" ")[0] } : null,
      })),
    };

    return { success: true, data };
  });
}
