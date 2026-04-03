export type Role = "ACOLYTE" | "GUARDIAN" | "COORDINATOR" | "ADMIN";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: string;
  functions?: { id: number; name: string }[];
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
}

export interface MeResponse {
  success: boolean;
  data: User;
}

export type Period = "ALL_DAY" | "MORNING_ONLY" | "NIGHT_ONLY";
