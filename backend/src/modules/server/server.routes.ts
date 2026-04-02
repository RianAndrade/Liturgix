import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { authGuard } from "../auth/auth.guard.js";
import { minRole } from "../../shared/middleware/role.guard.js";

const setFunctionsSchema = z.object({
  functionIds: z.array(z.number().int().positive()),
});

export default async function serverRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authGuard);

  // GET /api/servers — list acolytes
  app.get("/api/servers", async (request) => {
    const user = request.user;
    const where: any = { active: true, role: "ACOLYTE" };

    // GUARDIAN only sees linked acolytes
    if (user.role === "GUARDIAN") {
      const links = await app.prisma.guardianLink.findMany({
        where: { guardianId: user.sub },
        select: { acolyteId: true },
      });
      where.id = { in: links.map((l) => l.acolyteId) };
    } else if (user.role === "ACOLYTE") {
      where.id = user.sub;
    }

    const servers = await app.prisma.user.findMany({
      where,
      select: {
        id: true, name: true, email: true, role: true, active: true, createdAt: true,
        userFunctions: { select: { function: { select: { id: true, name: true } } } },
        _count: { select: { serviceRecords: true } },
      },
      orderBy: { name: "asc" },
    });

    return {
      success: true,
      data: servers.map((s) => ({
        ...s,
        functions: s.userFunctions.map((uf) => uf.function),
        serviceCount: s._count.serviceRecords,
        userFunctions: undefined,
        _count: undefined,
      })),
    };
  });

  // GET /api/servers/:id — acolyte detail
  app.get<{ Params: { id: string } }>("/api/servers/:id", async (request, reply) => {
    const id = Number(request.params.id);
    const user = request.user;

    // ACOLYTE can only see self
    if (user.role === "ACOLYTE" && user.sub !== id) {
      return reply.code(403).send({ statusCode: 403, error: "Forbidden", message: "Permissão insuficiente" });
    }

    const server = await app.prisma.user.findUnique({
      where: { id, active: true },
      select: {
        id: true, name: true, email: true, role: true, active: true, createdAt: true,
        userFunctions: { select: { function: { select: { id: true, name: true } } } },
        _count: { select: { serviceRecords: true } },
      },
    });

    if (!server) return reply.code(404).send({ statusCode: 404, error: "Not Found", message: "Acólito não encontrado" });

    return {
      success: true,
      data: {
        ...server,
        functions: server.userFunctions.map((uf) => uf.function),
        serviceCount: server._count.serviceRecords,
        userFunctions: undefined,
        _count: undefined,
      },
    };
  });

  // GET /api/servers/:id/functions — get functions
  app.get<{ Params: { id: string } }>("/api/servers/:id/functions", async (request, reply) => {
    const id = Number(request.params.id);
    const fns = await app.prisma.userFunction.findMany({
      where: { userId: id },
      select: { function: { select: { id: true, name: true, displayOrder: true } } },
      orderBy: { function: { displayOrder: "asc" } },
    });
    return { success: true, data: fns.map((f) => f.function) };
  });

  // GET /api/functions — list active functions (any authenticated user)
  app.get("/api/functions", async () => {
    const functions = await app.prisma.liturgicalFunction.findMany({
      where: { active: true },
      orderBy: { displayOrder: "asc" },
      select: { id: true, name: true, displayOrder: true },
    });
    return { success: true, data: functions };
  });

  // PUT /api/servers/:id/functions — set functions (self or COORDINATOR+)
  app.put<{ Params: { id: string } }>("/api/servers/:id/functions", async (request, reply) => {
    const id = Number(request.params.id);
    const caller = request.user;

    // Acolyte can only update own functions
    const isSelf = caller.sub === id;
    const isCoord = ["COORDINATOR", "ADMIN"].includes(caller.role);
    if (!isSelf && !isCoord) {
      return reply.code(403).send({ statusCode: 403, error: "Forbidden", message: "Permissão insuficiente" });
    }

    const parsed = setFunctionsSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ statusCode: 400, error: "Validation Error", message: "Dados inválidos" });
    }

    const target = await app.prisma.user.findUnique({ where: { id, active: true } });
    if (!target) return reply.code(404).send({ statusCode: 404, error: "Not Found", message: "Acólito não encontrado" });

    // Replace all functions
    await app.prisma.$transaction([
      app.prisma.userFunction.deleteMany({ where: { userId: id } }),
      ...parsed.data.functionIds.map((functionId) =>
        app.prisma.userFunction.create({ data: { userId: id, functionId } }),
      ),
    ]);

    const fns = await app.prisma.userFunction.findMany({
      where: { userId: id },
      select: { function: { select: { id: true, name: true } } },
    });
    return { success: true, data: fns.map((f) => f.function) };
  });

  // GET /api/servers/:id/history — service history
  app.get<{ Params: { id: string }; Querystring: { page?: string; perPage?: string } }>(
    "/api/servers/:id/history",
    async (request) => {
      const id = Number(request.params.id);
      const page = Number(request.query.page) || 1;
      const perPage = Number(request.query.perPage) || 20;

      const [records, total] = await Promise.all([
        app.prisma.serviceRecord.findMany({
          where: { userId: id },
          select: {
            id: true, servedAt: true,
            celebration: { select: { id: true, name: true } },
            function: { select: { id: true, name: true } },
          },
          orderBy: { servedAt: "desc" },
          skip: (page - 1) * perPage,
          take: perPage,
        }),
        app.prisma.serviceRecord.count({ where: { userId: id } }),
      ]);

      return {
        success: true,
        data: records,
        pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
      };
    },
  );
}
