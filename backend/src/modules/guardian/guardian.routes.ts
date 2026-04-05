import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { authGuard } from "../auth/auth.guard.js";
import { minRole } from "../../shared/middleware/role.guard.js";

const linkSchema = z.object({
  acolyteId: z.number().int().positive(),
});

export default async function guardianRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authGuard);

  // GET /api/guardians — list all guardians with linked acolytes
  app.get("/api/guardians", { preHandler: [minRole("COORDINATOR")] }, async () => {
    const guardians = await app.prisma.user.findMany({
      where: { role: "GUARDIAN", active: true },
      select: {
        id: true, name: true, email: true, createdAt: true,
        guardianLinks: {
          select: {
            id: true,
            acolyte: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return {
      success: true,
      data: guardians.map((g) => ({
        id: g.id,
        name: g.name,
        email: g.email,
        createdAt: g.createdAt,
        acolytes: g.guardianLinks.map((l) => ({ linkId: l.id, ...l.acolyte })),
      })),
    };
  });

  // GET /api/guardians/:id — guardian detail with linked acolytes
  app.get<{ Params: { id: string } }>("/api/guardians/:id", { preHandler: [minRole("COORDINATOR")] }, async (request, reply) => {
    const id = Number(request.params.id);
    if (isNaN(id)) return reply.code(400).send({ statusCode: 400, error: "Bad Request", message: "ID inválido" });

    const guardian = await app.prisma.user.findUnique({
      where: { id, role: "GUARDIAN", active: true },
      select: {
        id: true, name: true, email: true, createdAt: true,
        guardianLinks: {
          select: {
            id: true,
            acolyte: {
              select: {
                id: true, name: true, email: true,
                userFunctions: { select: { function: { select: { id: true, name: true } } } },
                _count: { select: { serviceRecords: true } },
              },
            },
          },
        },
      },
    });

    if (!guardian) return reply.code(404).send({ statusCode: 404, error: "Not Found", message: "Responsável não encontrado" });

    return {
      success: true,
      data: {
        id: guardian.id,
        name: guardian.name,
        email: guardian.email,
        createdAt: guardian.createdAt,
        acolytes: guardian.guardianLinks.map((l) => ({
          linkId: l.id,
          id: l.acolyte.id,
          name: l.acolyte.name,
          email: l.acolyte.email,
          functions: l.acolyte.userFunctions.map((uf) => uf.function),
          serviceCount: l.acolyte._count.serviceRecords,
        })),
      },
    };
  });

  // POST /api/guardians/:id/link — link acolyte to guardian
  app.post<{ Params: { id: string } }>("/api/guardians/:id/link", { preHandler: [minRole("COORDINATOR")] }, async (request, reply) => {
    const guardianId = Number(request.params.id);
    const parsed = linkSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ statusCode: 400, error: "Validation Error", message: "Dados inválidos" });
    }

    const guardian = await app.prisma.user.findUnique({ where: { id: guardianId, role: "GUARDIAN", active: true } });
    if (!guardian) return reply.code(404).send({ statusCode: 404, error: "Not Found", message: "Responsável não encontrado" });

    const acolyte = await app.prisma.user.findUnique({ where: { id: parsed.data.acolyteId, role: "ACOLYTE", active: true } });
    if (!acolyte) return reply.code(404).send({ statusCode: 404, error: "Not Found", message: "Acólito não encontrado" });

    const existing = await app.prisma.guardianLink.findUnique({
      where: { guardianId_acolyteId: { guardianId, acolyteId: parsed.data.acolyteId } },
    });
    if (existing) {
      return reply.code(409).send({ statusCode: 409, error: "Conflict", message: "Vínculo já existe" });
    }

    const link = await app.prisma.guardianLink.create({
      data: { guardianId, acolyteId: parsed.data.acolyteId },
      include: { acolyte: { select: { id: true, name: true, email: true } } },
    });

    return reply.code(201).send({ success: true, data: link });
  });

  // DELETE /api/guardians/:id/link/:linkId — unlink acolyte from guardian
  app.delete<{ Params: { id: string; linkId: string } }>("/api/guardians/:id/link/:linkId", { preHandler: [minRole("COORDINATOR")] }, async (request, reply) => {
    const linkId = Number(request.params.linkId);
    if (isNaN(linkId)) return reply.code(400).send({ statusCode: 400, error: "Bad Request", message: "ID inválido" });

    const link = await app.prisma.guardianLink.findUnique({ where: { id: linkId } });
    if (!link) return reply.code(404).send({ statusCode: 404, error: "Not Found", message: "Vínculo não encontrado" });

    await app.prisma.guardianLink.delete({ where: { id: linkId } });
    return { success: true, data: null };
  });

  // GET /api/guardians/unlinked-acolytes — acolytes not linked to any guardian
  app.get("/api/guardians/unlinked-acolytes", { preHandler: [minRole("COORDINATOR")] }, async () => {
    const acolytes = await app.prisma.user.findMany({
      where: {
        role: "ACOLYTE",
        active: true,
        acolyteLinks: { none: {} },
      },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    });
    return { success: true, data: acolytes };
  });
}
