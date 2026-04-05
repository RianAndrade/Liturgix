import { NavLink } from "react-router-dom";
import { useAuth, hasMinRole } from "@/features/auth/auth";
import { cn } from "@/shared/lib/cn";
import { StainedGlassOverlay } from "@/shared/components/ui/StainedGlass";
import { ThemeToggle } from "@/shared/components/ui/ThemeToggle";
import {
  LayoutDashboard, Calendar, Users, Church,
  ClipboardList, Clock, Shield, Settings, LogOut, UserCheck,
  UserCog, FileText,
} from "lucide-react";
import type { Role } from "@/shared/types";

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
  minRole?: Role;
  roles?: Role[];
  section?: string;
}

const navItems: NavItem[] = [
  { label: "Painel", to: "/painel", icon: <LayoutDashboard size={16} /> },
  { label: "Escalas", to: "/escalas", icon: <ClipboardList size={16} /> },
  { label: "Disponibilidade", to: "/disponibilidade", icon: <Calendar size={16} />, roles: ["ACOLYTE", "GUARDIAN"] },
  { label: "Meu Histórico", to: "/meu-historico", icon: <Clock size={16} />, roles: ["ACOLYTE", "GUARDIAN"] },
  { label: "Acólitos", to: "/acolitos", icon: <Users size={16} />, minRole: "COORDINATOR", section: "Coordenação" },
  { label: "Celebrações", to: "/celebracoes", icon: <Church size={16} />, minRole: "COORDINATOR" },
  { label: "Responsáveis", to: "/responsaveis", icon: <UserCheck size={16} />, minRole: "COORDINATOR" },
  { label: "Coordenação", to: "/coordenacao", icon: <Shield size={16} />, minRole: "COORDINATOR" },
  { label: "Administração", to: "/admin", icon: <Settings size={16} />, minRole: "ADMIN", section: "Admin" },
  { label: "Usuários", to: "/admin/usuarios", icon: <UserCog size={16} />, minRole: "ADMIN" },
  { label: "Auditoria", to: "/admin/auditoria", icon: <FileText size={16} />, minRole: "ADMIN" },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  if (!user) return null;

  const visibleItems = navItems.filter((item) => {
    if (item.roles) return item.roles.includes(user.role);
    if (item.minRole) return hasMinRole(user.role, item.minRole);
    return true;
  });

  let lastSection: string | undefined;

  return (
    <aside
      className="relative flex h-screen w-56 flex-shrink-0 flex-col overflow-hidden"
      style={{ background: "linear-gradient(180deg, #2d1f14, #3d2b1f)" }}
    >
      <StainedGlassOverlay opacity={0.04} />

      {/* Logo */}
      <div className="relative border-b px-4 py-5" style={{ borderColor: "rgba(61, 43, 31, 0.5)" }}>
        <h1 className="font-serif text-lg font-semibold" style={{ color: "#c99560" }}>
          ✦ Liturgix
        </h1>
      </div>

      {/* Nav */}
      <nav className="relative flex-1 overflow-y-auto px-2.5 py-3">
        {visibleItems.map((item) => {
          const showSection = item.section && item.section !== lastSection;
          if (item.section) lastSection = item.section;

          return (
            <div key={item.to}>
              {showSection && (
                <>
                  <div className="mx-2 my-2.5" style={{ borderTop: "1px solid rgba(255,255,255,0.03)" }} />
                  <p
                    className="mb-1 px-3 text-[9px] font-semibold uppercase tracking-[2px]"
                    style={{ color: "rgba(201, 149, 96, 0.38)" }}
                  >
                    {item.section}
                  </p>
                </>
              )}
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "mb-0.5 flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all",
                    isActive
                      ? "font-semibold"
                      : "hover:bg-white/[0.04]",
                  )
                }
                style={({ isActive }) =>
                  isActive
                    ? {
                        borderLeft: "3px solid #c99560",
                        background: "linear-gradient(90deg, rgba(201,149,96,0.18), rgba(201,149,96,0.04))",
                        color: "#f0e6d8",
                        boxShadow: "inset 0 0 12px rgba(201,149,96,0.06)",
                      }
                    : { color: "#b0a08a" }
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            </div>
          );
        })}
      </nav>

      {/* User */}
      <div className="relative border-t px-4 py-3" style={{ borderColor: "rgba(255,255,255,0.03)" }}>
        <div className="mb-2 flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold"
            style={{ background: "#3d5a6e", color: "#f3ece0" }}
          >
            {user.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div>
            <p className="text-xs font-medium" style={{ color: "#f0e6d8" }}>
              {user.name.split(" ")[0]}
            </p>
            <p className="text-[10px]" style={{ color: "#7a5c3a" }}>
              {user.role === "ACOLYTE"
                ? "Acólito"
                : user.role === "GUARDIAN"
                  ? "Responsável"
                  : user.role === "COORDINATOR"
                    ? "Coordenador"
                    : "Admin"}
            </p>
          </div>
        </div>
        <ThemeToggle />
        <button
          onClick={() => logout()}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors hover:opacity-80"
          style={{ color: "#7a5c3a" }}
        >
          <LogOut size={14} />
          Sair
        </button>
      </div>
    </aside>
  );
}
