import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { api } from "@/shared/lib/api";
import type { User, AuthResponse, MeResponse, Role } from "@/shared/types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: "ACOLYTE" | "GUARDIAN") => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const res = await api<MeResponse>("/auth/me", { skipAuthRedirect: true });
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = async (email: string, password: string) => {
    const res = await api<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      skipAuthRedirect: true,
    });
    setUser(res.data.user);
  };

  const register = async (name: string, email: string, password: string, role: "ACOLYTE" | "GUARDIAN") => {
    const res = await api<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, role }),
      skipAuthRedirect: true,
    });
    setUser(res.data.user);
  };

  const logout = async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function hasMinRole(userRole: Role, minRole: Role): boolean {
  const hierarchy: Record<Role, number> = { ACOLYTE: 0, GUARDIAN: 1, COORDINATOR: 2, ADMIN: 3 };
  return hierarchy[userRole] >= hierarchy[minRole];
}
