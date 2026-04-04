import { useState, useEffect } from "react";
import { api } from "@/shared/lib/api";
import { useAuth } from "@/features/auth/auth";
import { getFunctionColor } from "@/shared/lib/function-colors";

interface Record {
  id: number;
  servedAt: string;
  celebration: { id: number; name: string };
  function: { id: number; name: string };
}

export default function MeuHistoricoPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!user) return;
    api<{ data: Record[]; pagination: { total: number } }>(`/servers/${user.id}/history`).then((r) => {
      setRecords(r.data);
      setTotal(r.pagination.total);
      setLoading(false);
    });
  }, [user]);

  if (loading) return <p className="text-muted-foreground">Carregando...</p>;

  return (
    <div>
      <div className="mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[3px] text-accent">✦ Meu Histórico</p>
        <h1 className="mt-1 font-serif text-[22px] font-medium text-foreground">Histórico de Serviços</h1>
        <p className="mt-1 text-sm text-muted-foreground">{total} serviço(s) registrado(s)</p>
      </div>

      {records.length === 0 ? (
        <div className="rounded-lg bg-card p-6 border border-border text-center">
          <p className="text-sm text-muted-foreground">Nenhum serviço registrado ainda.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {records.map((r) => (
            <div
              key={r.id}
              className="rounded-lg bg-card p-4 border border-border hover:border-accent/40 transition-colors"
              style={{ borderLeft: `3px solid ${getFunctionColor(r.function.name)}` }}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium text-foreground">{r.celebration.name}</span>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{new Date(r.servedAt).toLocaleDateString("pt-BR")}</span>
                    <span
                      className="rounded-md px-2 py-0.5 font-medium"
                      style={{ backgroundColor: `${getFunctionColor(r.function.name)}20`, color: getFunctionColor(r.function.name) }}
                    >
                      {r.function.name}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
