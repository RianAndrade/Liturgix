import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "@/shared/lib/api";
import { PageLoading } from "@/shared/components/ui/Spinner";
import { PageError } from "@/shared/components/ui/PageError";

interface Stats {
  users: Record<string, number>;
  totalCelebrations: number;
  totalSchedules: number;
}

const ROLE_LABEL: Record<string, string> = { ACOLYTE: "Acólitos", GUARDIAN: "Responsáveis", COORDINATOR: "Coordenadoras", ADMIN: "Administradores" };
const ROLE_COLOR: Record<string, string> = { ACOLYTE: "#8b1a1a", GUARDIAN: "#a67c52", COORDINATOR: "#3d5a6e", ADMIN: "#6e3044" };

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetch_ = () => {
    setLoading(true);
    setError(false);
    api<{ data: Stats }>("/admin/stats")
      .then((r) => { setStats(r.data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  };

  useEffect(() => { fetch_(); }, []);

  if (loading) return <PageLoading />;
  if (error || !stats) return <PageError onRetry={fetch_} />;

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[3px] text-accent">✦ Administração</p>
      <h1 className="mt-1 font-serif text-[22px] font-medium text-foreground">Painel Administrativo</h1>

      <div className="mt-6 mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(ROLE_LABEL).map(([role, label]) => (
          <div key={role} className="rounded-lg bg-card p-4 border border-border" style={{ borderLeftWidth: 3, borderLeftColor: ROLE_COLOR[role] }}>
            <div className="text-2xl font-bold text-foreground">{stats.users[role] ?? 0}</div>
            <div className="text-sm text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg bg-card p-4 border border-border" style={{ borderLeftWidth: 3, borderLeftColor: "#c99560" }}>
          <div className="text-2xl font-bold text-foreground">{stats.totalCelebrations}</div>
          <div className="text-sm text-muted-foreground">Celebrações ativas</div>
        </div>
        <div className="rounded-lg bg-card p-4 border border-border" style={{ borderLeftWidth: 3, borderLeftColor: "#b8944e" }}>
          <div className="text-2xl font-bold text-foreground">{stats.totalSchedules}</div>
          <div className="text-sm text-muted-foreground">Escalas geradas</div>
        </div>
      </div>

      <p className="text-[10px] font-semibold uppercase tracking-[3px] text-accent">✦ Gestão</p>
      <h2 className="mt-1 mb-3 font-serif text-[22px] font-medium text-foreground">Módulos</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <Link to="/admin/funcoes" className="rounded-lg bg-card p-4 border border-border hover:border-accent/40 transition-colors cursor-pointer">
          <div className="font-medium">Funções Litúrgicas</div>
          <div className="text-xs text-muted-foreground">Criar, editar e desativar funções</div>
        </Link>
        <Link to="/admin/usuarios" className="rounded-lg bg-card p-4 border border-border hover:border-accent/40 transition-colors cursor-pointer">
          <div className="font-medium">Usuários</div>
          <div className="text-xs text-muted-foreground">Gerenciar papéis e status de usuários</div>
        </Link>
        <Link to="/admin/auditoria" className="rounded-lg bg-card p-4 border border-border hover:border-accent/40 transition-colors cursor-pointer">
          <div className="font-medium">Auditoria</div>
          <div className="text-xs text-muted-foreground">Histórico de ações no sistema</div>
        </Link>
        <Link to="/acolitos" className="rounded-lg bg-card p-4 border border-border hover:border-accent/40 transition-colors cursor-pointer">
          <div className="font-medium">Acólitos</div>
          <div className="text-xs text-muted-foreground">Gerenciar acólitos e qualificações</div>
        </Link>
        <Link to="/celebracoes" className="rounded-lg bg-card p-4 border border-border hover:border-accent/40 transition-colors cursor-pointer">
          <div className="font-medium">Celebrações</div>
          <div className="text-xs text-muted-foreground">Gerenciar celebrações e requisitos</div>
        </Link>
        <Link to="/responsaveis" className="rounded-lg bg-card p-4 border border-border hover:border-accent/40 transition-colors cursor-pointer">
          <div className="font-medium">Responsáveis</div>
          <div className="text-xs text-muted-foreground">Vínculos guardiões e acólitos</div>
        </Link>
      </div>
    </div>
  );
}
