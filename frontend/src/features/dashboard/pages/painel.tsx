import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "@/shared/lib/api";
import { useAuth, hasMinRole } from "@/features/auth/auth";
import { PageLoading } from "@/shared/components/ui/Spinner";

interface ScheduleSummary {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  assignmentCount: number;
}

interface ServiceRecord {
  id: number;
  servedAt: string;
  celebration: { id: number; name: string };
  function: { id: number; name: string };
}

export default function PainelPage() {
  const { user } = useAuth();
  const [nextSchedule, setNextSchedule] = useState<ScheduleSummary | null>(null);
  const [monthCelebrations, setMonthCelebrations] = useState(0);
  const [recentServices, setRecentServices] = useState<ServiceRecord[]>([]);
  const [draftCount, setDraftCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isCoord = user && hasMinRole(user.role, "COORDINATOR");
    const promises: Promise<any>[] = [
      api<{ data: ScheduleSummary[] }>("/schedules?status=PUBLISHED").catch(() => ({ data: [] })),
      api<{ data: { id: number; date: string }[] }>("/celebrations").catch(() => ({ data: [] })),
    ];

    if (user) {
      promises.push(
        api<{ data: ServiceRecord[] }>(`/servers/${user.id}/history?perPage=5`).catch(() => ({ data: [] })),
      );
    }

    if (isCoord) {
      promises.push(
        api<{ data: ScheduleSummary[] }>("/schedules?status=DRAFT").catch(() => ({ data: [] })),
      );
    }

    Promise.all(promises).then(([schedRes, celRes, histRes, draftsRes]) => {
      const now = new Date();
      const next = schedRes.data
        .filter((s: ScheduleSummary) => new Date(s.startDate) >= now)
        .sort((a: ScheduleSummary, b: ScheduleSummary) => a.startDate.localeCompare(b.startDate))[0] ?? null;
      setNextSchedule(next);

      const monthCels = celRes.data.filter((c: any) => {
        const d = new Date(c.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length;
      setMonthCelebrations(monthCels);

      if (histRes) setRecentServices(histRes.data);
      if (draftsRes) setDraftCount(draftsRes.data.length);

      setLoading(false);
    });
  }, [user]);

  if (loading) return <PageLoading />;

  const isCoord = user && hasMinRole(user.role, "COORDINATOR");

  const summaryCards = [
    {
      label: "Próxima escala",
      value: nextSchedule?.name ?? "—",
      detail: nextSchedule
        ? new Date(nextSchedule.startDate).toLocaleDateString("pt-BR")
        : "Nenhuma agendada",
      borderColor: "#8b1a1a",
      link: nextSchedule ? `/escala/${nextSchedule.id}` : undefined,
    },
    {
      label: "Este mês",
      value: monthCelebrations,
      detail: "celebrações",
      borderColor: "#b8944e",
      link: "/celebracoes",
    },
    {
      label: "Suas funções",
      value: user?.functions?.length ?? 0,
      detail: user?.functions?.map((f: any) => f.name).join(" · ") || "Nenhuma",
      borderColor: "#5c6b4e",
    },
  ];

  if (isCoord) {
    summaryCards.push({
      label: "Rascunhos",
      value: draftCount,
      detail: draftCount === 1 ? "escala pendente" : "escalas pendentes",
      borderColor: "#c99560",
      link: "/coordenacao",
    });
  }

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[3px] text-accent">
        ✦ Painel
      </p>
      <h1 className="mt-1 font-serif text-[22px] font-medium text-foreground">
        Bem-vindo, {user?.name?.split(" ")[0]}
      </h1>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => {
          const content = (
            <>
              <p className="text-[10px] font-medium uppercase tracking-[1px] text-muted-foreground">
                {card.label}
              </p>
              <p className="mt-1 text-xl font-bold text-foreground">{card.value}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{card.detail}</p>
            </>
          );
          return card.link ? (
            <Link
              key={card.label}
              to={card.link}
              className="rounded-lg bg-card p-4 hover:border-accent/40 transition-colors border border-border"
              style={{ borderLeftWidth: 3, borderLeftColor: card.borderColor }}
            >
              {content}
            </Link>
          ) : (
            <div
              key={card.label}
              className="rounded-lg bg-card p-4 border border-border"
              style={{ borderLeftWidth: 3, borderLeftColor: card.borderColor }}
            >
              {content}
            </div>
          );
        })}
      </div>

      {/* Recent service history */}
      {recentServices.length > 0 && (
        <div className="mt-8">
          <p className="text-[10px] font-semibold uppercase tracking-[3px] text-accent">✦ Histórico</p>
          <h2 className="mt-1 mb-3 font-serif text-lg font-medium text-foreground">Serviços Recentes</h2>
          <div className="space-y-2">
            {recentServices.map((s) => (
              <div key={s.id} className="rounded-lg bg-card p-3 border border-border flex items-center justify-between" style={{ borderLeftWidth: 3, borderLeftColor: "#8b1a1a" }}>
                <div>
                  <div className="font-medium text-sm">{s.celebration.name}</div>
                  <div className="text-xs text-muted-foreground">{s.function.name}</div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(s.servedAt).toLocaleDateString("pt-BR")}
                </div>
              </div>
            ))}
          </div>
          <Link to="/meu-historico" className="mt-3 inline-block text-sm text-accent hover:underline">Ver todo histórico</Link>
        </div>
      )}

      {/* Quick links for coordinator */}
      {isCoord && (
        <div className="mt-8">
          <p className="text-[10px] font-semibold uppercase tracking-[3px] text-accent">✦ Ações Rápidas</p>
          <h2 className="mt-1 mb-3 font-serif text-lg font-medium text-foreground">Atalhos</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <Link to="/escala/nova" className="rounded-lg bg-card p-4 border border-border hover:border-accent/40 transition-colors">
              <div className="font-medium">+ Nova Escala</div>
              <div className="text-xs text-muted-foreground">Gerar escala para período</div>
            </Link>
            <Link to="/celebracoes" className="rounded-lg bg-card p-4 border border-border hover:border-accent/40 transition-colors">
              <div className="font-medium">Celebrações</div>
              <div className="text-xs text-muted-foreground">Gerenciar celebrações</div>
            </Link>
            <Link to="/acolitos" className="rounded-lg bg-card p-4 border border-border hover:border-accent/40 transition-colors">
              <div className="font-medium">Acólitos</div>
              <div className="text-xs text-muted-foreground">Ver acólitos e funções</div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
