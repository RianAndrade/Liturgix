import { Navigate } from "react-router-dom";
import { useAuth, hasMinRole } from "@/features/auth/auth";
import type { Role } from "@/shared/types";

interface Props {
  minRole?: Role;
  roles?: Role[];
  children: React.ReactNode;
}

export function ProtectedRoute({ minRole, roles, children }: Props) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/painel" replace />;
  }

  if (minRole && !hasMinRole(user.role, minRole)) {
    return <Navigate to="/painel" replace />;
  }

  return <>{children}</>;
}
