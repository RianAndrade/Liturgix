import type { ScheduleConfig } from "./types.js";

/**
 * countScore: inverse linear of total service count.
 * Fewer services = higher score (more priority).
 */
export function calcCountScore(myCount: number, maxCount: number): number {
  if (maxCount <= 0) return 100;
  return 100 - (myCount / maxCount) * 100;
}

/**
 * rotationScore: days since last time in THIS specific function.
 * Cap at 28 days. Never performed = 100.
 */
export function calcRotationScore(daysSinceLastInFunction: number | null): number {
  if (daysSinceLastInFunction === null) return 100; // never performed
  return Math.min(daysSinceLastInFunction, 28) / 28 * 100;
}

/**
 * intervalScore: days since last service in ANY function.
 * Cap at 14 days. Never served = 100.
 */
export function calcIntervalScore(daysSinceLastService: number | null): number {
  if (daysSinceLastService === null) return 100; // never served
  return Math.min(daysSinceLastService, 14) / 14 * 100;
}

/**
 * Combined weighted score.
 */
export function calcTotalScore(
  countScore: number,
  rotationScore: number,
  intervalScore: number,
  config: ScheduleConfig,
): number {
  return (
    config.countWeight * countScore +
    config.rotationWeight * rotationScore +
    config.intervalWeight * intervalScore
  );
}
