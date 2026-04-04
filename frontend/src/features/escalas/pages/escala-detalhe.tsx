import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/shared/lib/api";
import { useAuth, hasMinRole } from "@/features/auth/auth";

interface Assignment {
  id: number;
  locked: boolean;
  score: number | null;
  celebration: { id: number; name: string; date: string; type: string };
  function: { id: number; name: string };
  user: { id: number; name: string } | null;
}

interface Schedule {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  publicToken: string | null;
  assignments: Assignment[];
  createdBy: { id: number; name: string };
}

const TYPE_LABEL: Record<string, string> = {
  SUNDAY_MASS: "Missa Dominical",
  WEEKDAY_MASS: "Missa Semanal",
  HOLY_DAY: "Dia Santo",
  SPECIAL: "Especial",
};

function CelebrationPeriodBadge({ date }: { date: string }) {
  const hour = new Date(date).getHours();
  const isNight = hour >= 18;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        isNight
          ? "bg-[#3b5998]/15 text-[#3b5998]"
          : "bg-[#f5c542]/20 text-[#b8960a]"
      }`}
    >
      {isNight ? "Noturna" : "Diurna"}
    </span>
  );
}

export default function EscalaDetalhePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSchedule = async () => {
    const res = await api<{ data: Schedule }>(`/schedules/${id}`);
    setSchedule(res.data);
    setLoading(false);
  };

  useEffect(() => { fetchSchedule(); }, [id]);

  const handlePublish = async () => {
    await api(`/schedules/${id}/publish`, { method: "POST" });
    await fetchSchedule();
  };

  const handleArchive = async () => {
    await api(`/schedules/${id}`, { method: "PATCH", body: JSON.stringify({ status: "ARCHIVED" }) });
    await fetchSchedule();
  };

  const handleToggleLock = async (assignmentId: number, currentLocked: boolean) => {
    await api(`/schedules/${id}/assignments/${assignmentId}`, {
      method: "PATCH",
      body: JSON.stringify({ locked: !currentLocked }),
    });
    await fetchSchedule();
  };

  const handleRemoveAssignment = async (assignmentId: number) => {
    await api(`/schedules/${id}/assignments/${assignmentId}`, { method: "DELETE" });
    await fetchSchedule();
  };

  if (loading) return <p className="text-muted-foreground">Carregando...</p>;
  if (!schedule) return <p className="text-destructive">Escala não encontrada.</p>;

  // Group assignments by celebration
  const byCelebration = new Map<number, { celebration: Assignment["celebration"]; assignments: Assignment[] }>();
  for (const a of schedule.assignments) {
    if (!byCelebration.has(a.celebration.id)) {
      byCelebration.set(a.celebration.id, { celebration: a.celebration, assignments: [] });
    }
    byCelebration.get(a.celebration.id)!.assignments.push(a);
  }

  const isCoord = user && hasMinRole(user.role, "COORDINATOR");
  const isDraft = schedule.status === "DRAFT";

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <Link to="/escalas" className="text-sm text-muted-foreground hover:underline">&larr; Escalas</Link>
          <h1 className="font-serif text-2xl font-bold">{schedule.name}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(schedule.startDate).toLocaleDateString("pt-BR")} — {new Date(schedule.endDate).toLocaleDateString("pt-BR")}
            <span className={`ml-2 rounded px-2 py-0.5 text-xs font-medium ${schedule.status === "PUBLISHED" ? "bg-success/10 text-success" : schedule.status === "DRAFT" ? "bg-accent/20 text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
              {schedule.status === "DRAFT" ? "Rascunho" : schedule.status === "PUBLISHED" ? "Publicada" : "Arquivada"}
            </span>
          </p>
        </div>
        {isCoord && (
          <div className="flex gap-2">
            {isDraft && (
              <button onClick={handlePublish} className="rounded-md bg-success px-4 py-2 text-sm font-medium text-white hover:bg-success/90">
                Publicar
              </button>
            )}
            {schedule.status === "PUBLISHED" && (
              <button onClick={handleArchive} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">
                Arquivar
              </button>
            )}
          </div>
        )}
      </div>

      {schedule.publicToken && (
        <div className="mb-4 rounded-md border border-border bg-muted/50 px-4 py-2 text-sm">
          Link público: <code className="rounded bg-muted px-1">/p/{schedule.publicToken}</code>
        </div>
      )}

      {[...byCelebration.values()].map(({ celebration, assignments }) => (
        <div key={celebration.id} className="mb-4 rounded-md border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h3 className="font-serif font-semibold flex items-center gap-2">
              {celebration.name}
              <CelebrationPeriodBadge date={celebration.date} />
            </h3>
            <p className="text-xs text-muted-foreground">
              {new Date(celebration.date).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
              {" · "}{TYPE_LABEL[celebration.type] ?? celebration.type}
            </p>
          </div>
          <div className="divide-y divide-border">
            {assignments.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-4 py-2">
                <div className="flex items-center gap-3">
                  <span className="w-36 text-sm font-medium">{a.function.name}</span>
                  {a.user ? (
                    <span className="text-sm">{a.user.name}</span>
                  ) : (
                    <span className="text-sm italic text-destructive">Vago</span>
                  )}
                  {a.locked && <span className="text-xs text-muted-foreground">🔒</span>}
                  {a.score !== null && (
                    <span className="text-xs text-muted-foreground">({a.score.toFixed(1)})</span>
                  )}
                </div>
                {isCoord && isDraft && (
                  <div className="flex gap-2">
                    <button onClick={() => handleToggleLock(a.id, a.locked)} className="text-xs text-muted-foreground hover:underline">
                      {a.locked ? "Destravar" : "Travar"}
                    </button>
                    <button onClick={() => handleRemoveAssignment(a.id)} className="text-xs text-destructive hover:underline">
                      Remover
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
