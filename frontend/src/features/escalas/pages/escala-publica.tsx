import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

interface PublicSchedule {
  name: string;
  startDate: string;
  endDate: string;
  assignments: {
    celebration: { id: number; name: string; date: string; type: string; location: string | null };
    function: { id: number; name: string };
    acolyte: { name: string } | null;
  }[];
}

export default function EscalaPublicaPage() {
  const { token } = useParams();
  const [schedule, setSchedule] = useState<PublicSchedule | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/public/schedules/${token}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setSchedule(d.data); else setError(true); })
      .catch(() => setError(true));
  }, [token]);

  if (error) return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Escala não encontrada.</p>
    </div>
  );

  if (!schedule) return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Carregando...</p>
    </div>
  );

  // Group by celebration
  const byCell = new Map<number, { celebration: PublicSchedule["assignments"][0]["celebration"]; items: PublicSchedule["assignments"] }>();
  for (const a of schedule.assignments) {
    if (!byCell.has(a.celebration.id)) byCell.set(a.celebration.id, { celebration: a.celebration, items: [] });
    byCell.get(a.celebration.id)!.items.push(a);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-center font-serif text-3xl font-bold text-primary">Liturgix</h1>
      <h2 className="mb-1 text-center font-serif text-xl">{schedule.name}</h2>
      <p className="mb-6 text-center text-sm text-muted-foreground">
        {new Date(schedule.startDate).toLocaleDateString("pt-BR")} — {new Date(schedule.endDate).toLocaleDateString("pt-BR")}
      </p>

      {[...byCell.values()].map(({ celebration, items }) => (
        <div key={celebration.id} className="mb-4 rounded-md border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h3 className="font-serif font-semibold">{celebration.name}</h3>
            <p className="text-xs text-muted-foreground">
              {new Date(celebration.date).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
              {celebration.location && ` · ${celebration.location}`}
            </p>
          </div>
          <div className="divide-y divide-border">
            {items.map((a, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2 text-sm">
                <span className="font-medium">{a.function.name}</span>
                <span>{a.acolyte?.name ?? "—"}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
