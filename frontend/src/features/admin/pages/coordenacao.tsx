import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "@/shared/lib/api";

interface Schedule {
  id: number;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  assignmentCount: number;
}

interface Celebration {
  id: number;
  name: string;
  date: string;
  type: string;
}

export default function CoordenacaoPage() {
  const [drafts, setDrafts] = useState<Schedule[]>([]);
  const [upcoming, setUpcoming] = useState<Celebration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api<{ data: Schedule[] }>("/schedules?status=DRAFT"),
      api<{ data: Celebration[] }>("/celebrations"),
    ]).then(([s, c]) => {
      setDrafts(s.data);
      // Show next 5 celebrations
      const now = new Date().toISOString();
      setUpcoming(c.data.filter((cel) => cel.date >= now).slice(0, 5));
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="text-muted-foreground">Carregando...</p>;

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[3px] text-accent">✦ Coordenação</p>
      <h1 className="mt-1 mb-6 font-serif text-[22px] font-medium text-foreground">Painel de Coordenação</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Drafts */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[3px] text-accent">✦ Escalas</p>
          <h2 className="mt-1 mb-3 font-serif text-lg font-medium text-foreground">Escalas em Rascunho</h2>
          {drafts.length === 0 ? (
            <div className="rounded-lg bg-card p-4 border border-border text-center text-sm text-muted-foreground">
              Nenhuma escala pendente.
            </div>
          ) : (
            <div className="space-y-2">
              {drafts.map((d) => (
                <Link key={d.id} to={`/escala/${d.id}`} className="block rounded-lg bg-card p-3 border border-border hover:border-accent/40 transition-colors cursor-pointer" style={{ borderLeftWidth: 3, borderLeftColor: "#b8944e" }}>
                  <div className="font-medium">{d.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(d.startDate).toLocaleDateString("pt-BR")} — {new Date(d.endDate).toLocaleDateString("pt-BR")}
                    {" · "}{d.assignmentCount} atribuições
                  </div>
                </Link>
              ))}
            </div>
          )}
          <Link to="/escala/nova" className="mt-3 inline-block text-sm text-accent hover:underline">+ Nova escala</Link>
        </div>

        {/* Upcoming */}
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
                <div key={c.id} className="rounded-lg bg-card p-3 border border-border" style={{ borderLeftWidth: 3, borderLeftColor: "#8b1a1a" }}>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(c.date).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link to="/celebracoes" className="mt-3 inline-block text-sm text-accent hover:underline">Ver todas</Link>
        </div>
      </div>
    </div>
  );
}
