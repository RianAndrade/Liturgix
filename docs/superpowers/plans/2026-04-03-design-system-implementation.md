# Design System "Vitral Lateral Terroso" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved "Vitral Lateral Terroso" design system to all existing frontend pages, replacing the generic theme with the cathedral-inspired identity.

**Architecture:** Rewrite CSS tokens in `index.css` with the new hex palette (light + dark via `prefers-color-scheme`). Rewrite Sidebar, AppLayout, Login, Cadastro, Painel, and Admin pages in-place. Extract shared visual elements (vitral border, stained glass overlay, auth layout) into small reusable components.

**Tech Stack:** React 19, Tailwind CSS v4 (`@theme`), Crimson Pro + Inter fonts, Lucide icons.

**Spec:** `docs/design-system.md`

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Rewrite | `frontend/src/index.css` | Tailwind tokens (light + dark), base styles |
| Create | `frontend/src/components/ui/StainedGlass.tsx` | Reusable stained glass overlay + vitral border |
| Create | `frontend/src/components/layout/AuthLayout.tsx` | Shared login/cadastro shell (dark bg, arch, logo, citation) |
| Rewrite | `frontend/src/components/layout/Sidebar.tsx` | Dark sidebar with vitral, new nav styling |
| Modify | `frontend/src/components/layout/AppLayout.tsx` | Sand background, dark-mode vitral overlay |
| Rewrite | `frontend/src/pages/login.tsx` | Dark auth layout with brown card |
| Rewrite | `frontend/src/pages/cadastro.tsx` | Dark auth layout with brown card |
| Rewrite | `frontend/src/pages/painel.tsx` | Summary cards with vitral border, welcome |
| Modify | `frontend/src/pages/admin-funcoes.tsx` | Apply terroso card/table styling |
| Create | `frontend/src/lib/function-colors.ts` | Liturgical function color map |

---

### Task 1: CSS Tokens — Light + Dark Theme

**Files:**
- Rewrite: `frontend/src/index.css`

- [ ] **Step 1: Replace entire index.css with new design system tokens**

```css
@import "tailwindcss";
@import url("https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700&display=swap");

@theme {
  /* Light mode (default) */
  --color-background: #f3ece0;
  --color-foreground: #2d1f14;
  --color-card: #ede6d8;
  --color-card-foreground: #2d1f14;
  --color-card-inner: #f3ece0;
  --color-muted: #ede6d8;
  --color-muted-foreground: #9a8568;
  --color-muted-strong: #7a5c3a;
  --color-primary: #7a2e1a;
  --color-primary-foreground: #f3ece0;
  --color-primary-light: #a0413c;
  --color-accent: #c99560;
  --color-accent-foreground: #2d1f14;
  --color-gold: #b8944e;
  --color-destructive: #a0413c;
  --color-destructive-foreground: #f3ece0;
  --color-success: #2a7a6f;
  --color-success-light: #35958a;
  --color-success-foreground: #f3ece0;
  --color-border: #d9cfbb;
  --color-ring: #c99560;

  /* Sidebar (same in both modes) */
  --color-sidebar: #2d1f14;
  --color-sidebar-dark: #3d2b1f;
  --color-sidebar-text: #b0a08a;
  --color-sidebar-text-active: #f0e6d8;
  --color-sidebar-accent: #c99560;
  --color-sidebar-separator: rgba(255, 255, 255, 0.03);

  /* Login (always dark) */
  --color-login-bg: #2d1f14;
  --color-login-bg-dark: #3d2b1f;
  --color-login-card: #4a3628;
  --color-login-card-border: #5a4636;
  --color-login-input: #3d2b1f;
  --color-login-text: #b0a08a;
  --color-login-label: #c99560;

  /* Muted button */
  --color-muted-btn: #d9cfbb;
  --color-muted-btn-foreground: #7a5c3a;

  --font-serif: "Crimson Pro", Georgia, serif;
  --font-sans: "Inter", system-ui, sans-serif;

  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
}

@media (prefers-color-scheme: dark) {
  @theme {
    --color-background: #1a1210;
    --color-foreground: #f0e6d8;
    --color-card: #2d1f14;
    --color-card-foreground: #f0e6d8;
    --color-card-inner: #1a1210;
    --color-muted: #2d1f14;
    --color-muted-foreground: #7a5c3a;
    --color-muted-strong: #9a8568;
    --color-border: #3d2b1f;
    --color-ring: #c99560;

    --color-muted-btn: #3d2b1f;
    --color-muted-btn-foreground: #9a8568;
  }
}

body {
  font-family: var(--font-sans);
  background-color: var(--color-background);
  color: var(--color-foreground);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-serif);
}
```

- [ ] **Step 2: Verify Vite dev server compiles without errors**

Run: `cd frontend && npx vite build --mode development 2>&1 | head -20`
Expected: No CSS parsing errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/index.css
git commit -m "style: replace CSS tokens with Vitral Lateral Terroso design system"
```

---

### Task 2: Function Colors Map + Stained Glass Component

**Files:**
- Create: `frontend/src/lib/function-colors.ts`
- Create: `frontend/src/components/ui/StainedGlass.tsx`

- [ ] **Step 1: Create function color map**

```ts
// frontend/src/lib/function-colors.ts
export const FUNCTION_COLORS: Record<string, string> = {
  "Cruciferário": "#8b1a1a",
  "Ceroferário": "#c99560",
  "Turiferário": "#7a5c3a",
  "Naveteiro": "#a67c52",
  "Acólito do Missal": "#6b4226",
  "Acólito das Galhetas": "#6e3044",
  "Acólito da Credência": "#5c6b4e",
  "Acólito da Patena": "#b8944e",
  "Cerimoniário": "#3d5a6e",
};

export function getFunctionColor(name: string): string {
  return FUNCTION_COLORS[name] ?? "#9a8568";
}
```

- [ ] **Step 2: Create StainedGlass component**

```tsx
// frontend/src/components/ui/StainedGlass.tsx
interface StainedGlassOverlayProps {
  opacity?: number;
}

export function StainedGlassOverlay({ opacity = 0.04 }: StainedGlassOverlayProps) {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        opacity,
        background: [
          "radial-gradient(ellipse at 30% 20%, #8b1a1a 0%, transparent 50%)",
          "radial-gradient(ellipse at 70% 50%, #3d5a6e 0%, transparent 50%)",
          "radial-gradient(ellipse at 40% 80%, #c99560 0%, transparent 50%)",
        ].join(", "),
      }}
    />
  );
}

export function VitralBorder({ className = "" }: { className?: string }) {
  return (
    <div
      className={`absolute left-0 top-0 bottom-0 w-1 rounded-l ${className}`}
      style={{
        background: "linear-gradient(180deg, #8b1a1a, #c99560, #5c6b4e, #3d5a6e, #6e3044)",
      }}
    />
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/function-colors.ts frontend/src/components/ui/StainedGlass.tsx
git commit -m "feat: add function color map and stained glass UI components"
```

---

### Task 3: Auth Layout Shell (Login/Cadastro shared wrapper)

**Files:**
- Create: `frontend/src/components/layout/AuthLayout.tsx`

- [ ] **Step 1: Create AuthLayout component**

```tsx
// frontend/src/components/layout/AuthLayout.tsx
import { StainedGlassOverlay } from "@/components/ui/StainedGlass";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4"
      style={{ background: "linear-gradient(135deg, #2d1f14, #3d2b1f)" }}>
      <StainedGlassOverlay opacity={0.06} />
      {/* Arch */}
      <div
        className="pointer-events-none absolute"
        style={{
          top: "12%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 220,
          height: 110,
          border: "1px solid rgba(201, 149, 96, 0.08)",
          borderRadius: "50% 50% 0 0",
          borderBottom: "none",
        }}
      />
      <div className="relative w-full max-w-[300px]">
        {/* Logo */}
        <div className="mb-5 text-center">
          <h1 className="font-serif text-[28px] font-semibold" style={{ color: "#c99560" }}>
            ✦ Liturgix
          </h1>
          <p className="mt-1 text-[11px] tracking-[2px]" style={{ color: "#7a5c3a" }}>
            ESCALAS LITÚRGICAS
          </p>
          <p className="mt-2.5 font-serif text-xs italic" style={{ color: "rgba(154, 133, 104, 0.38)" }}>
            "Servi ao Senhor com alegria" — Sl 100,2
          </p>
        </div>
        {/* Card */}
        <div
          className="rounded-xl p-[22px]"
          style={{
            background: "#4a3628",
            border: "1px solid #5a4636",
            boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/layout/AuthLayout.tsx
git commit -m "feat: add AuthLayout shell for login/cadastro pages"
```

---

### Task 4: Rewrite Login Page

**Files:**
- Rewrite: `frontend/src/pages/login.tsx`

- [ ] **Step 1: Rewrite login.tsx with design system**

```tsx
// frontend/src/pages/login.tsx
import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { AuthLayout } from "@/components/layout/AuthLayout";

export default function LoginPage() {
  const { user, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/painel" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch {
      setError("Credenciais inválidas");
    } finally {
      setLoading(false);
    }
  };

  const labelClass = "mb-1.5 block text-[11px] font-semibold uppercase tracking-[1.5px]";
  const inputClass = "w-full rounded-lg px-3 py-2.5 text-[13px] outline-none";

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <p className="rounded-lg px-3 py-2 text-sm" style={{ background: "#a0413c20", color: "#a0413c" }}>
            {error}
          </p>
        )}

        <div>
          <label className={labelClass} style={{ color: "#c99560" }}>E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="seu@email.com"
            className={inputClass}
            style={{ background: "#3d2b1f", border: "1px solid #5a4636", color: "#f0e6d8" }}
          />
        </div>

        <div>
          <label className={labelClass} style={{ color: "#c99560" }}>Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className={inputClass}
            style={{ background: "#3d2b1f", border: "1px solid #5a4636", color: "#f0e6d8" }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #7a2e1a, #a0413c)", color: "#f3ece0" }}
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="mt-3 text-center text-xs" style={{ color: "#9a8568" }}>
        Não tem conta?{" "}
        <Link to="/cadastro" className="font-medium" style={{ color: "#c99560" }}>
          Cadastre-se
        </Link>
      </p>
    </AuthLayout>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/login.tsx
git commit -m "style: rewrite login page with dark auth layout"
```

---

### Task 5: Rewrite Cadastro Page

**Files:**
- Rewrite: `frontend/src/pages/cadastro.tsx`

- [ ] **Step 1: Rewrite cadastro.tsx with design system (same AuthLayout, more fields)**

```tsx
// frontend/src/pages/cadastro.tsx
import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { AuthLayout } from "@/components/layout/AuthLayout";

export default function CadastroPage() {
  const { user, register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ACOLYTE" | "GUARDIAN">("ACOLYTE");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/painel" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(name, email, password, role);
    } catch (err: any) {
      setError(err?.message || "Erro ao cadastrar");
    } finally {
      setLoading(false);
    }
  };

  const labelClass = "mb-1.5 block text-[11px] font-semibold uppercase tracking-[1.5px]";
  const inputClass = "w-full rounded-lg px-3 py-2.5 text-[13px] outline-none";
  const inputStyle = { background: "#3d2b1f", border: "1px solid #5a4636", color: "#f0e6d8" };

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <p className="rounded-lg px-3 py-2 text-sm" style={{ background: "#a0413c20", color: "#a0413c" }}>
            {error}
          </p>
        )}

        <div>
          <label className={labelClass} style={{ color: "#c99560" }}>Nome</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            required minLength={2} placeholder="Seu nome" className={inputClass} style={inputStyle} />
        </div>

        <div>
          <label className={labelClass} style={{ color: "#c99560" }}>E-mail</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            required placeholder="seu@email.com" className={inputClass} style={inputStyle} />
        </div>

        <div>
          <label className={labelClass} style={{ color: "#c99560" }}>Senha</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            required minLength={6} placeholder="••••••••" className={inputClass} style={inputStyle} />
        </div>

        <div>
          <label className={labelClass} style={{ color: "#c99560" }}>Eu sou</label>
          <select value={role} onChange={(e) => setRole(e.target.value as "ACOLYTE" | "GUARDIAN")}
            className={inputClass} style={inputStyle}>
            <option value="ACOLYTE">Acólito</option>
            <option value="GUARDIAN">Responsável</option>
          </select>
        </div>

        <button type="submit" disabled={loading}
          className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #7a2e1a, #a0413c)", color: "#f3ece0" }}>
          {loading ? "Cadastrando..." : "Cadastrar"}
        </button>
      </form>

      <p className="mt-3 text-center text-xs" style={{ color: "#9a8568" }}>
        Já tem conta?{" "}
        <Link to="/login" className="font-medium" style={{ color: "#c99560" }}>Entrar</Link>
      </p>
    </AuthLayout>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/cadastro.tsx
git commit -m "style: rewrite cadastro page with dark auth layout"
```

---

### Task 6: Rewrite Sidebar

**Files:**
- Rewrite: `frontend/src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Rewrite Sidebar with dark vitral design**

```tsx
// frontend/src/components/layout/Sidebar.tsx
import { NavLink } from "react-router-dom";
import { useAuth, hasMinRole } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { StainedGlassOverlay } from "@/components/ui/StainedGlass";
import {
  LayoutDashboard, Calendar, Users, Church,
  ClipboardList, Clock, Shield, Settings, LogOut, UserCheck,
} from "lucide-react";
import type { Role } from "@/types";

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
                  <p className="mb-1 px-3 text-[9px] font-semibold uppercase tracking-[2px]"
                    style={{ color: "rgba(201, 149, 96, 0.38)" }}>
                    {item.section}
                  </p>
                </>
              )}
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "mb-0.5 flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-colors",
                    isActive ? "font-medium" : "",
                  )
                }
                style={({ isActive }) =>
                  isActive
                    ? {
                        borderLeft: "2px solid #c99560",
                        background: "linear-gradient(90deg, rgba(201,149,96,0.12), rgba(201,149,96,0.03))",
                        color: "#f0e6d8",
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
            {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-xs font-medium" style={{ color: "#f0e6d8" }}>
              {user.name.split(" ")[0]}
            </p>
            <p className="text-[10px]" style={{ color: "#7a5c3a" }}>
              {user.role === "ACOLYTE" ? "Acólito" : user.role === "GUARDIAN" ? "Responsável" : user.role === "COORDINATOR" ? "Coordenador" : "Admin"}
            </p>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors"
          style={{ color: "#7a5c3a" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#b0a08a")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#7a5c3a")}
        >
          <LogOut size={14} />
          Sair
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/layout/Sidebar.tsx
git commit -m "style: rewrite sidebar with dark vitral design"
```

---

### Task 7: Update AppLayout

**Files:**
- Modify: `frontend/src/components/layout/AppLayout.tsx`

- [ ] **Step 1: Update AppLayout with sand background and dark-mode overlay**

```tsx
// frontend/src/components/layout/AppLayout.tsx
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
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
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/layout/AppLayout.tsx
git commit -m "style: update AppLayout with design system loading state"
```

---

### Task 8: Rewrite Painel Page

**Files:**
- Rewrite: `frontend/src/pages/painel.tsx`

- [ ] **Step 1: Rewrite painel.tsx with summary cards**

```tsx
// frontend/src/pages/painel.tsx
import { useAuth } from "@/lib/auth";

export default function PainelPage() {
  const { user } = useAuth();

  const summaryCards = [
    {
      label: "Próxima escala",
      value: "—",
      detail: "Nenhuma agendada",
      borderColor: "#8b1a1a",
    },
    {
      label: "Este mês",
      value: "0",
      detail: "celebrações",
      borderColor: "#b8944e",
    },
    {
      label: "Suas funções",
      value: user?.functions?.length ?? 0,
      detail: user?.functions?.map((f: any) => f.name).join(" · ") || "Nenhuma",
      borderColor: "#5c6b4e",
    },
  ];

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[3px] text-accent">
        ✦ Painel
      </p>
      <h1 className="mt-1 font-serif text-[22px] font-medium text-foreground">
        Bem-vindo, {user?.name?.split(" ")[0]}
      </h1>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-lg bg-card p-4"
            style={{ borderLeft: `3px solid ${card.borderColor}` }}
          >
            <p className="text-[10px] font-medium uppercase tracking-[1px] text-muted-foreground">
              {card.label}
            </p>
            <p className="mt-1 text-xl font-bold text-foreground">{card.value}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{card.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/painel.tsx
git commit -m "style: rewrite painel page with summary cards"
```

---

### Task 9: Restyle Admin Funções Page

**Files:**
- Modify: `frontend/src/pages/admin-funcoes.tsx`

- [ ] **Step 1: Rewrite admin-funcoes.tsx with terroso styling**

```tsx
// frontend/src/pages/admin-funcoes.tsx
import { useState, useEffect, type FormEvent } from "react";
import { api } from "@/lib/api";
import { getFunctionColor } from "@/lib/function-colors";

interface LiturgicalFunction {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  displayOrder: number;
}

export default function AdminFuncoesPage() {
  const [functions, setFunctions] = useState<LiturgicalFunction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [displayOrder, setDisplayOrder] = useState(1);
  const [error, setError] = useState("");

  const fetchFunctions = async () => {
    const res = await api<{ data: LiturgicalFunction[] }>("/admin/functions");
    setFunctions(res.data);
    setLoading(false);
  };

  useEffect(() => { fetchFunctions(); }, []);

  const resetForm = () => {
    setName(""); setDescription(""); setDisplayOrder(functions.length + 1);
    setEditingId(null); setShowForm(false); setError("");
  };

  const startEdit = (fn: LiturgicalFunction) => {
    setName(fn.name); setDescription(fn.description ?? "");
    setDisplayOrder(fn.displayOrder); setEditingId(fn.id);
    setShowForm(true); setError("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (editingId) {
        await api(`/admin/functions/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify({ name, description: description || undefined, displayOrder }),
        });
      } else {
        await api("/admin/functions", {
          method: "POST",
          body: JSON.stringify({ name, description: description || undefined, displayOrder }),
        });
      }
      resetForm();
      await fetchFunctions();
    } catch (err: any) {
      setError(err?.message || "Erro ao salvar");
    }
  };

  const toggleActive = async (fn: LiturgicalFunction) => {
    await api(`/admin/functions/${fn.id}`, {
      method: "PATCH",
      body: JSON.stringify({ active: !fn.active }),
    });
    await fetchFunctions();
  };

  if (loading) {
    return <p className="text-muted-foreground">Carregando...</p>;
  }

  const labelClass = "mb-1 block text-[11px] font-semibold uppercase tracking-[1.5px] text-accent";
  const inputClass = "w-full rounded-lg border border-border bg-card-inner px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[3px] text-accent">✦ Administração</p>
          <h1 className="mt-1 font-serif text-[22px] font-medium text-foreground">Funções Litúrgicas</h1>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); setDisplayOrder(functions.length + 1); }}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground"
          style={{ background: "linear-gradient(135deg, #7a2e1a, #a0413c)" }}
        >
          Nova Função
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-lg border border-border bg-card p-5">
          <h2 className="mb-3 font-serif text-lg font-semibold text-foreground">
            {editingId ? "Editar Função" : "Nova Função"}
          </h2>
          {error && (
            <p className="mb-3 rounded-lg px-3 py-2 text-sm" style={{ background: "#a0413c20", color: "#a0413c" }}>
              {error}
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className={labelClass}>Nome</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Descrição</label>
              <input value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Ordem</label>
              <input type="number" value={displayOrder} onChange={(e) => setDisplayOrder(Number(e.target.value))}
                min={1} className={inputClass} />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" className="rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground"
              style={{ background: "linear-gradient(135deg, #7a2e1a, #a0413c)" }}>
              Salvar
            </button>
            <button type="button" onClick={resetForm}
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {functions.map((fn) => (
          <div key={fn.id}
            className="flex items-center gap-3 rounded-lg bg-card p-3"
            style={{ borderLeft: `3px solid ${getFunctionColor(fn.name)}` }}>
            <div
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold"
              style={{ background: getFunctionColor(fn.name), color: "#f3ece0" }}>
              {fn.displayOrder}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{fn.name}</p>
              <p className="text-[11px] text-muted-foreground">{fn.description || "Sem descrição"}</p>
            </div>
            <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
              fn.active
                ? "text-success"
                : "text-muted-foreground"
            }`}
              style={fn.active ? { background: "rgba(42,122,111,0.12)" } : { background: "rgba(154,133,104,0.12)" }}>
              {fn.active ? "Ativa" : "Inativa"}
            </span>
            <button onClick={() => startEdit(fn)} className="text-xs font-medium text-accent hover:underline">
              Editar
            </button>
            <button onClick={() => toggleActive(fn)} className="text-xs text-muted-foreground hover:underline">
              {fn.active ? "Desativar" : "Ativar"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/admin-funcoes.tsx
git commit -m "style: restyle admin funções with function colors and card layout"
```

---

### Task 10: Build + Smoke Test

**Files:** None (verification only)

- [ ] **Step 1: Run frontend build**

Run: `cd /home/rian/Projects/Liturgix/frontend && npx vite build 2>&1`
Expected: Build succeeds with no errors

- [ ] **Step 2: Rebuild Docker and test**

Run: `cd /home/rian/Projects/Liturgix && docker compose up --build -d 2>&1`
Expected: All 4 containers start healthy

- [ ] **Step 3: Test health endpoint**

Run: `curl -s http://localhost:3000/api/health`
Expected: `{"status":"ok",...}`

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "style: complete Vitral Lateral Terroso design system implementation"
```
