import type {
  GenerationInput,
  GenerationResult,
  Assignment,
  Conflict,
  CelebrationSlot,
  CandidateAudit,
  Acolyte,
} from "./types.js";
import { calcCountScore, calcRotationScore, calcIntervalScore, calcTotalScore } from "./scoring.js";
import { GenerationState } from "./state.js";
import { detectConflict } from "./conflicts.js";

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Main schedule generation algorithm.
 * Pure function — zero I/O, fully testable.
 */
export function generateSchedule(input: GenerationInput): GenerationResult {
  const { slots, acolytes, unavailabilities, history, lockedAssignments, config } = input;

  const state = new GenerationState(acolytes, history);
  const assignments: Assignment[] = [];
  const conflicts: Conflict[] = [];

  // Build lookup: userId -> (date -> period)
  const unavailMap = new Map<number, Map<string, string>>();
  for (const u of unavailabilities) {
    if (!unavailMap.has(u.userId)) unavailMap.set(u.userId, new Map());
    unavailMap.get(u.userId)!.set(u.date, u.period);
  }

  // Night threshold: celebrations at 18:00 or later are "night"
  const NIGHT_HOUR = 18;

  // Build lookup: functionId -> acolytes qualified
  const qualifiedMap = new Map<number, Acolyte[]>();
  for (const a of acolytes) {
    for (const fId of a.functionIds) {
      if (!qualifiedMap.has(fId)) qualifiedMap.set(fId, []);
      qualifiedMap.get(fId)!.push(a);
    }
  }

  // Build locked lookup
  const lockedSet = new Set(
    lockedAssignments.map((l) => `${l.celebrationId}-${l.functionId}-${l.userId}`),
  );

  // Sort slots: by date, then by restriction level (fewest qualified first)
  const sortedSlots = expandSlots(slots).sort((a, b) => {
    const dateDiff = a.celebrationDate.getTime() - b.celebrationDate.getTime();
    if (dateDiff !== 0) return dateDiff;
    const qualA = qualifiedMap.get(a.functionId)?.length ?? 0;
    const qualB = qualifiedMap.get(b.functionId)?.length ?? 0;
    return qualA - qualB; // most restricted first
  });

  for (const slot of sortedSlots) {
    const dateStr = toDateStr(slot.celebrationDate);

    // Check if this slot is locked
    const lockedUser = lockedAssignments.find(
      (l) => l.celebrationId === slot.celebrationId && l.functionId === slot.functionId,
    );
    if (lockedUser) {
      assignments.push({
        celebrationId: slot.celebrationId,
        functionId: slot.functionId,
        userId: lockedUser.userId,
        locked: true,
        score: null,
        auditData: null,
      });
      state.recordAssignment(lockedUser.userId, slot.functionId, slot.celebrationId, slot.celebrationDate);
      continue;
    }

    // Get qualified candidates
    const qualified = qualifiedMap.get(slot.functionId) ?? [];

    // Filter: available on date+period + not already in this celebration
    const isNight = slot.celebrationDate.getHours() >= NIGHT_HOUR;
    const available = qualified.filter((a) => {
      const periods = unavailMap.get(a.id);
      if (periods) {
        const period = periods.get(dateStr);
        if (period) {
          if (period === "ALL_DAY") return false;
          if (period === "MORNING_ONLY" && isNight) return false;
          if (period === "NIGHT_ONLY" && !isNight) return false;
        }
      }
      if (state.isAssignedInCelebration(slot.celebrationId, a.id)) return false;
      return true;
    });

    // Count candidates excluded only by time preference (not ALL_DAY or other reasons)
    const timeExcludedCount = qualified.filter((a) => {
      const periods = unavailMap.get(a.id);
      if (!periods) return false;
      const period = periods.get(dateStr);
      if (!period || period === "ALL_DAY") return false;
      if (period === "MORNING_ONLY" && isNight) return true;
      if (period === "NIGHT_ONLY" && !isNight) return true;
      return false;
    }).length;

    // Detect conflicts
    const conflict = detectConflict(slot, acolytes, unavailabilities, qualified.length, available.length, timeExcludedCount);
    if (conflict && available.length === 0) {
      conflicts.push(conflict);
      assignments.push({
        celebrationId: slot.celebrationId,
        functionId: slot.functionId,
        userId: null,
        locked: false,
        score: null,
        auditData: null,
      });
      continue;
    }
    if (conflict) {
      conflicts.push(conflict);
    }

    // Score candidates
    const maxCount = state.getMaxCount();
    const scored: CandidateAudit[] = available.map((a) => {
      const myCount = state.serviceCounts.get(a.id) ?? 0;
      const countScore = calcCountScore(myCount, maxCount);

      const fnKey = `${a.id}-${slot.functionId}`;
      const lastFn = state.lastFunctionDate.get(fnKey);
      const daysSinceFunction = state.daysBetween(lastFn, slot.celebrationDate);
      const rotationScore = calcRotationScore(daysSinceFunction);

      const lastAny = state.lastServiceDate.get(a.id);
      const daysSinceAny = state.daysBetween(lastAny, slot.celebrationDate);
      const intervalScore = calcIntervalScore(daysSinceAny);

      const totalScore = calcTotalScore(countScore, rotationScore, intervalScore, config);

      return {
        userId: a.id,
        name: a.name,
        countScore: Math.round(countScore * 100) / 100,
        rotationScore: Math.round(rotationScore * 100) / 100,
        intervalScore: Math.round(intervalScore * 100) / 100,
        totalScore: Math.round(totalScore * 100) / 100,
        selected: false,
      };
    });

    // Sort: highest score first, then tiebreakers
    scored.sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      // Fewer total services wins
      const countA = state.serviceCounts.get(a.userId) ?? 0;
      const countB = state.serviceCounts.get(b.userId) ?? 0;
      if (countA !== countB) return countA - countB;
      // More days since last service wins
      const daysA = state.daysBetween(state.lastServiceDate.get(a.userId), slot.celebrationDate) ?? 999;
      const daysB = state.daysBetween(state.lastServiceDate.get(b.userId), slot.celebrationDate) ?? 999;
      if (daysB !== daysA) return daysB - daysA;
      // Alphabetical (determinism)
      return a.name.localeCompare(b.name);
    });

    if (scored.length > 0) {
      const winner = scored[0];
      winner.selected = true;

      // Mark non-selected with reason
      for (let i = 1; i < scored.length; i++) {
        scored[i].rejectedReason = "Pontuação inferior";
      }

      assignments.push({
        celebrationId: slot.celebrationId,
        functionId: slot.functionId,
        userId: winner.userId,
        locked: false,
        score: winner.totalScore,
        auditData: scored,
      });
      state.recordAssignment(winner.userId, slot.functionId, slot.celebrationId, slot.celebrationDate);
    } else {
      assignments.push({
        celebrationId: slot.celebrationId,
        functionId: slot.functionId,
        userId: null,
        locked: false,
        score: null,
        auditData: null,
      });
    }
  }

  return { assignments, conflicts };
}

/** Expand slots: if quantity > 1, create multiple entries */
function expandSlots(slots: CelebrationSlot[]): CelebrationSlot[] {
  const expanded: CelebrationSlot[] = [];
  for (const slot of slots) {
    for (let i = 0; i < slot.quantity; i++) {
      expanded.push({ ...slot, quantity: 1 });
    }
  }
  return expanded;
}
