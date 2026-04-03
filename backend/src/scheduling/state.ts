import type { Acolyte, ServiceHistory } from "./types.js";

/** Mutable state tracked during generation. */
export class GenerationState {
  /** userId -> total service count (history + newly assigned) */
  serviceCounts: Map<number, number> = new Map();
  /** userId -> last service date (any function) */
  lastServiceDate: Map<number, Date> = new Map();
  /** `${userId}-${functionId}` -> last date in that specific function */
  lastFunctionDate: Map<string, Date> = new Map();
  /** `${celebrationId}-${userId}` -> already assigned in this celebration */
  celebrationAssigned: Set<string> = new Set();

  constructor(acolytes: Acolyte[], history: ServiceHistory[]) {
    // Initialize counts to 0
    for (const a of acolytes) {
      this.serviceCounts.set(a.id, 0);
    }

    // Load history
    for (const h of history) {
      const date = new Date(h.servedAt);
      const count = (this.serviceCounts.get(h.userId) ?? 0) + 1;
      this.serviceCounts.set(h.userId, count);

      const prev = this.lastServiceDate.get(h.userId);
      if (!prev || date > prev) this.lastServiceDate.set(h.userId, date);

      const fnKey = `${h.userId}-${h.functionId}`;
      const prevFn = this.lastFunctionDate.get(fnKey);
      if (!prevFn || date > prevFn) this.lastFunctionDate.set(fnKey, date);
    }
  }

  getMaxCount(): number {
    let max = 0;
    for (const c of this.serviceCounts.values()) {
      if (c > max) max = c;
    }
    return max;
  }

  recordAssignment(userId: number, functionId: number, celebrationId: number, date: Date) {
    this.serviceCounts.set(userId, (this.serviceCounts.get(userId) ?? 0) + 1);
    this.lastServiceDate.set(userId, date);
    this.lastFunctionDate.set(`${userId}-${functionId}`, date);
    this.celebrationAssigned.add(`${celebrationId}-${userId}`);
  }

  isAssignedInCelebration(celebrationId: number, userId: number): boolean {
    return this.celebrationAssigned.has(`${celebrationId}-${userId}`);
  }

  daysBetween(from: Date | undefined, to: Date): number | null {
    if (!from) return null;
    return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
  }
}
