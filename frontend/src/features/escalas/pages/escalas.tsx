import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/shared/lib/api";
import { useAuth, hasMinRole } from "@/features/auth/auth";
import { PageLoading } from "@/shared/components/ui/Spinner";
import { PageError } from "@/shared/components/ui/PageError";

interface Schedule {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  publicToken: string | null;
  generatedAt: string;
  assignmentCount: number;
  createdBy: { id: number; name: string };
}

const STATUS_LABEL: Record<string, string> = { DRAFT: "Rascunho", PUBLISHED: "Publicada", ARCHIVED: "Arquivada" };
const STATUS_COLOR: Record<string, string> = {
  DRAFT: "bg-accent/20 text-accent-foreground",
  PUBLISHED: "bg-success/10 text-success",
  ARCHIVED: "bg-muted text-muted-foreground",
};
const STATUS_BORDER: Record<string, string> = {
  DRAFT: "#b8944e",
  PUBLISHED: "#2a7a6f",
  ARCHIVED: "#9a8568",
};

export default function EscalasPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetch_ = () => {
    setLoading(true);
    setError(false);
    api<{ data: Schedule[] }>("/schedules")
      .then((r) => { setSchedules(r.data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  };

  useEffect(() => { fetch_(); }, []);

  if (loading) return <PageLoading />;
  if (error) return <PageError onRetry={fetch_} />;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[3px] text-accent">✦ Escalas</p>
          <h1 className="mt-1 font-serif text-[22px] font-medium text-foreground">Escalas Litúrgicas</h1>
        </div>
        {user && hasMinRole(user.role, "COORDINATOR") && (
          <Link
            to="/escala/nova"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-[#f3ece0]"
            style={{ background: "linear-gradient(135deg, #7a2e1a, #a0413c)" }}
          >
            Nova Escala
          </Link>
        )}
      </div>

      {schedules.length === 0 ? (
        <div className="rounded-lg bg-card p-6 border border-border text-center">
          <p className="text-sm text-muted-foreground">Nenhuma escala encontrada.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {schedules.map((s) => (
            <div
              key={s.id}
              onClick={() => navigate(`/escala/${s.id}`)}
              className="rounded-lg bg-card p-4 border border-border hover:border-accent/40 transition-colors cursor-pointer"
              style={{ borderLeft: `3px solid ${STATUS_BORDER[s.status] ?? "#9a8568"}` }}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground">{s.name}</span>
                    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[s.status] ?? ""}`}>
                      {STATUS_LABEL[s.status] ?? s.status}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      {new Date(s.startDate).toLocaleDateString("pt-BR")} — {new Date(s.endDate).toLocaleDateString("pt-BR")}
                    </span>
                    <span>{s.assignmentCount} atribuição(ões)</span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">Ver &rarr;</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
