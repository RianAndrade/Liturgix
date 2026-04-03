export interface ScheduleConfig {
  countWeight: number;
  rotationWeight: number;
  intervalWeight: number;
}

export const DEFAULT_CONFIG: ScheduleConfig = {
  countWeight: 0.50,
  rotationWeight: 0.30,
  intervalWeight: 0.20,
};

export type Period = "ALL_DAY" | "MORNING_ONLY" | "NIGHT_ONLY";

export interface Acolyte {
  id: number;
  name: string;
  functionIds: number[];
}

export interface CelebrationSlot {
  celebrationId: number;
  celebrationDate: Date;
  celebrationName: string;
  functionId: number;
  functionName: string;
  quantity: number;
}

export interface UnavailableDate {
  userId: number;
  date: string; // YYYY-MM-DD
  period: Period;
}

export interface ServiceHistory {
  userId: number;
  functionId: number;
  servedAt: string; // YYYY-MM-DD
}

export interface LockedAssignment {
  celebrationId: number;
  functionId: number;
  userId: number;
}

export interface Assignment {
  celebrationId: number;
  functionId: number;
  userId: number | null;
  locked: boolean;
  score: number | null;
  auditData: CandidateAudit[] | null;
}

export interface CandidateAudit {
  userId: number;
  name: string;
  countScore: number;
  rotationScore: number;
  intervalScore: number;
  totalScore: number;
  selected: boolean;
  rejectedReason?: string;
}

export type ConflictType =
  | "NO_CANDIDATES"
  | "INSUFFICIENT_CANDIDATES"
  | "OVERLOAD_SINGLE_CANDIDATE"
  | "ALL_UNAVAILABLE"
  | "TIME_PREFERENCE_EXCLUDED"
  | "QUALIFICATION_GAP";

export interface Conflict {
  celebrationId: number;
  celebrationName: string;
  functionId: number;
  functionName: string;
  type: ConflictType;
  description: string;
  suggestedAction: string;
}

export interface GenerationResult {
  assignments: Assignment[];
  conflicts: Conflict[];
}

export interface GenerationInput {
  slots: CelebrationSlot[];
  acolytes: Acolyte[];
  unavailabilities: UnavailableDate[];
  history: ServiceHistory[];
  lockedAssignments: LockedAssignment[];
  config: ScheduleConfig;
}
