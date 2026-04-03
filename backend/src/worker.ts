import { Worker } from "bullmq";
import { prisma } from "./shared/lib/db.js";
import { generateSchedule } from "./scheduling/generator.js";
import { DEFAULT_CONFIG } from "./scheduling/types.js";
import type { GenerationInput, CelebrationSlot, Acolyte, UnavailableDate, ServiceHistory, LockedAssignment } from "./scheduling/types.js";

const connection = {
  host: new URL(process.env.REDIS_URL ?? "redis://localhost:6379/0").hostname,
  port: Number(new URL(process.env.REDIS_URL ?? "redis://localhost:6379/0").port) || 6379,
};

const worker = new Worker(
  "schedule-generation",
  async (job) => {
    const { scheduleId } = job.data as { scheduleId: number };
    console.log(`[worker] Generating schedule ${scheduleId}...`);

    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        assignments: { where: { locked: true } },
      },
    });

    if (!schedule) throw new Error(`Schedule ${scheduleId} not found`);

    // Load celebrations in period
    const celebrations = await prisma.celebration.findMany({
      where: {
        active: true,
        date: { gte: schedule.startDate, lte: schedule.endDate },
      },
      include: {
        functionRequirements: {
          include: { function: true },
        },
      },
      orderBy: { date: "asc" },
    });

    // Build slots
    const slots: CelebrationSlot[] = [];
    for (const cel of celebrations) {
      for (const req of cel.functionRequirements) {
        slots.push({
          celebrationId: cel.id,
          celebrationDate: cel.date,
          celebrationName: cel.name,
          functionId: req.functionId,
          functionName: req.function.name,
          quantity: req.quantity,
        });
      }
    }

    // Load active acolytes with functions
    const users = await prisma.user.findMany({
      where: { active: true, role: "ACOLYTE" },
      include: {
        userFunctions: { select: { functionId: true } },
      },
    });

    const acolytes: Acolyte[] = users.map((u) => ({
      id: u.id,
      name: u.name,
      functionIds: u.userFunctions.map((uf) => uf.functionId),
    }));

    // Load unavailabilities in period
    const rawUnavail = await prisma.unavailability.findMany({
      where: {
        date: { gte: schedule.startDate, lte: schedule.endDate },
        userId: { in: acolytes.map((a) => a.id) },
      },
    });

    const unavailabilities: UnavailableDate[] = rawUnavail.map((u) => ({
      userId: u.userId,
      date: u.date.toISOString().slice(0, 10),
      period: u.period,
    }));

    // Load service history
    const rawHistory = await prisma.serviceRecord.findMany({
      where: { userId: { in: acolytes.map((a) => a.id) } },
    });

    const history: ServiceHistory[] = rawHistory.map((h) => ({
      userId: h.userId,
      functionId: h.functionId,
      servedAt: h.servedAt.toISOString().slice(0, 10),
    }));

    // Locked assignments
    const lockedAssignments: LockedAssignment[] = schedule.assignments
      .filter((a) => a.locked && a.userId !== null)
      .map((a) => ({
        celebrationId: a.celebrationId,
        functionId: a.functionId,
        userId: a.userId!,
      }));

    const input: GenerationInput = {
      slots,
      acolytes,
      unavailabilities,
      history,
      lockedAssignments,
      config: DEFAULT_CONFIG,
    };

    // Run algorithm
    const result = generateSchedule(input);

    // Write results to DB
    await prisma.$transaction(async (tx) => {
      // Delete non-locked assignments
      await tx.scheduleAssignment.deleteMany({
        where: { scheduleId, locked: false },
      });

      // Create new assignments
      for (const a of result.assignments) {
        if (a.locked) continue; // already exists
        await tx.scheduleAssignment.create({
          data: {
            scheduleId,
            celebrationId: a.celebrationId,
            functionId: a.functionId,
            userId: a.userId,
            locked: a.locked,
            score: a.score,
            auditData: a.auditData as any,
          },
        });
      }

      // Update schedule metadata
      await tx.schedule.update({
        where: { id: scheduleId },
        data: { generatedAt: new Date() },
      });
    });

    console.log(
      `[worker] Schedule ${scheduleId} done: ${result.assignments.length} assignments, ${result.conflicts.length} conflicts`,
    );

    return {
      assignmentCount: result.assignments.length,
      conflictCount: result.conflicts.length,
      conflicts: result.conflicts,
    };
  },
  { connection, concurrency: 2 },
);

worker.on("completed", (job) => {
  console.log(`[worker] Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`[worker] Job ${job?.id} failed:`, err.message);
});

console.log("[worker] Schedule generation worker started");
