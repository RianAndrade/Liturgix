import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/features/auth/auth";
import { Sidebar } from "./Sidebar";

export function AppLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="font-serif text-lg" style={{ color: "#c99560" }}>✦</p>
          <p className="mt-1 text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
