import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/shared/lib/api";
import { useToast } from "@/shared/components/ui/Toast";
import { PageLoading } from "@/shared/components/ui/Spinner";
import { PageError } from "@/shared/components/ui/PageError";

interface Schedule {
  id: number;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  assignmentCount: number;
  publicToken: string | null;
}

interface Celebration {
  id: number;
  name: string;
  date: string;
  type: string;
}

interface Stats {
  users: Record<string, number>;
  totalCelebrations: number;
  totalSchedules: number;
}

const TYPE_LABEL: Record<string, string> = {
  SUNDAY_MASS: "Missa Dominical",
  WEEKDAY_MASS: "Missa Semanal",
  HOLY_DAY: "Dia Santo",
  SPECIAL: "Especial",
};

export default function CoordenacaoPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [drafts, setDrafts] = useState<Schedule[]>([]);
  const [published, setPublished] = useState<Schedule[]>([]);
  const [upcoming, setUpcoming] = useState<Celebration[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [publishing, setPublishing] = useState<number | null>(null);

  const fetchData = () => {
    setLoading(true);
    setError(false);
    Promise.all([
      api<{ data: Schedule[] }>("/schedules"),
      api<{ data: Celebration[] }>("/celebrations"),
      api<{ data: Stats }>("/admin/stats").catch(() => null),
    ])
      .then(([sched, cel, st]) => {
        setDrafts(sched.data.filter((s) => s.status === "DRAFT"));
        setPublished(sched.data.filter((s) => s.status === "PUBLISHED").slice(0, 3));
        const now = new Date().toISOString();
        setUpcoming(cel.data.filter((c) => c.date >= now).slice(0, 5));
        if (st) setStats(st.data);
        setLoading(false);
      })
      .catch(() => { setError(true); setLoading(false); });
  };

  useEffect(() => { fetchData(); }, []);

  const handlePublish = async (id: number) => {
    setPublishing(id);
    try {
      await api(`/schedules/${id}/publish`, { method: "POST" });
      toast("Escala publicada com sucesso", "success");
      await fetchData();
    } catch {
      toast("Erro ao publicar escala", "error");
    } finally {
      setPublishing(null);
    }
  };

  const handleArchive = async (id: number) => {
    try {
      await api(`/schedules/${id}`, { method: "PATCH", body: JSON.stringify({ status: "ARCHIVED" }) });
      toast("Escala arquivada", "success");
      fetchData();
    } catch {
      toast("Erro ao arquivar escala", "error");
    }
  };

  if (loading) return <PageLoading />;
  if (error) return <PageError onRetry={fetchData} />;

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[3px] text-accent">✦ Coordenação</p>
      <h1 className="mt-1 mb-6 font-serif text-[22px] font-medium text-foreground">Painel de Coordenação</h1>

      {/* Quick stats */}
      {stats && (
        <div className="mb-6 grid gap-3 sm:grid-cols-4">
          <div className="rounded-lg bg-card p-3 border border-border" style={{ borderLeftWidth: 3, borderLeftColor: "#8b1a1a" }}>
            <div className="text-lg font-bold text-foreground">{stats.users["ACOLYTE"] ?? 0}</div>
            <div className="text-xs text-muted-foreground">Acólitos</div>
          </div>
          <div className="rounded-lg bg-card p-3 border border-border" style={{ borderLeftWidth: 3, borderLeftColor: "#a67c52" }}>
            <div className="text-lg font-bold text-foreground">{stats.users["GUARDIAN"] ?? 0}</div>
            <div className="text-xs text-muted-foreground">Responsáveis</div>
          </div>
          <div className="rounded-lg bg-card p-3 border border-border" style={{ borderLeftWidth: 3, borderLeftColor: "#c99560" }}>
            <div className="text-lg font-bold text-foreground">{stats.totalCelebrations}</div>
            <div className="text-xs text-muted-foreground">Celebrações</div>
          </div>
          <div className="rounded-lg bg-card p-3 border border-border" style={{ borderLeftWidth: 3, borderLeftColor: "#b8944e" }}>
            <div className="text-lg font-bold text-foreground">{stats.totalSchedules}</div>
            <div className="text-xs text-muted-foreground">Escalas</div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Drafts */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[3px] text-accent">✦ Rascunhos</p>
          <h2 className="mt-1 mb-3 font-serif text-lg font-medium text-foreground">Escalas em Rascunho</h2>
          {drafts.length === 0 ? (
            <div className="rounded-lg bg-card p-4 border border-border text-center text-sm text-muted-foreground">
              Nenhuma escala pendente.
            </div>
          ) : (
            <div className="space-y-2">
              {drafts.map((d) => (
                <div key={d.id} className="rounded-lg bg-card border border-border overflow-hidden" style={{ borderLeftWidth: 3, borderLeftColor: "#b8944e" }}>
                  <Link to={`/escala/${d.id}`} className="block p-3 hover:bg-muted/30 transition-colors">
                    <div className="font-medium">{d.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(d.startDate).toLocaleDateString("pt-BR")} — {new Date(d.endDate).toLocaleDateString("pt-BR")}
                      {" · "}{d.assignmentCount} atribuições
                    </div>
                  </Link>
                  <div className="flex gap-2 border-t border-border px-3 py-2 bg-muted/20">
                    <button
                      onClick={() => handlePublish(d.id)}
                      disabled={publishing === d.id}
                      className="rounded px-3 py-1 text-xs font-medium text-white bg-success hover:bg-success/90 disabled:opacity-50"
                    >
                      {publishing === d.id ? "Publicando..." : "Publicar"}
                    </button>
                    <button
                      onClick={() => navigate(`/escala/${d.id}`)}
                      className="rounded px-3 py-1 text-xs font-medium border border-border hover:bg-muted"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleArchive(d.id)}
                      className="rounded px-3 py-1 text-xs text-destructive hover:underline"
                    >
                      Arquivar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link to="/escala/nova" className="mt-3 inline-block rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90">
            + Nova Escala
          </Link>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Published */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[3px] text-accent">✦ Publicadas</p>
            <h2 className="mt-1 mb-3 font-serif text-lg font-medium text-foreground">Escalas Recentes</h2>
            {published.length === 0 ? (
              <div className="rounded-lg bg-card p-4 border border-border text-center text-sm text-muted-foreground">
                Nenhuma escala publicada.
              </div>
            ) : (
              <div className="space-y-2">
                {published.map((s) => (
                  <div key={s.id} className="rounded-lg bg-card p-3 border border-border flex items-center justify-between" style={{ borderLeftWidth: 3, borderLeftColor: "#5c6b4e" }}>
                    <Link to={`/escala/${s.id}`} className="hover:underline">
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.assignmentCount} atribuições</div>
                    </Link>
                    <div className="flex gap-2">
                      {s.publicToken && (
                        <button
                          onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/p/${s.publicToken}`); toast("Link copiado!", "success"); }}
                          className="text-xs text-accent hover:underline"
                        >
                          Copiar link
                        </button>
                      )}
                      <button onClick={() => handleArchive(s.id)} className="text-xs text-muted-foreground hover:underline">
                        Arquivar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming celebrations */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[3px] text-accent">✦ Celebrações</p>
            <h2 className="mt-1 mb-3 font-serif text-lg font-medium text-foreground">Próximas Celebrações</h2>
            {upcoming.length === 0 ? (
              <div className="rounded-lg bg-card p-4 border border-border text-center text-sm text-muted-foreground">
                Nenhuma celebração agendada.
              </div>
            ) : (
              <div className="space-y-2">
                {upcoming.map((c) => (
                  <Link key={c.id} to="/celebracoes" className="block rounded-lg bg-card p-3 border border-border hover:border-accent/40 transition-colors" style={{ borderLeftWidth: 3, borderLeftColor: "#8b1a1a" }}>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(c.date).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                      {" · "}{TYPE_LABEL[c.type] ?? c.type}
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <Link to="/celebracoes" className="mt-3 inline-block text-sm text-accent hover:underline">Ver todas</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
