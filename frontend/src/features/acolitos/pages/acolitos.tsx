import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "@/shared/lib/api";
import { getFunctionColor } from "@/shared/lib/function-colors";

interface Server {
  id: number;
  name: string;
  email: string;
  functions: { id: number; name: string }[];
  serviceCount: number;
}

export default function AcolitosPage() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ data: Server[] }>("/servers").then((r) => { setServers(r.data); setLoading(false); });
  }, []);

  if (loading) return <p className="text-muted-foreground">Carregando...</p>;

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[3px] text-accent">✦ Acólitos</p>
      <h1 className="mt-1 mb-4 font-serif text-[22px] font-medium text-foreground">Servidores Cadastrados</h1>
      {servers.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum acólito cadastrado.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {servers.map((s) => (
            <Link key={s.id} to={`/acolito/${s.id}`} className="rounded-lg bg-card p-4 border border-border hover:border-accent/40 transition-colors cursor-pointer">
              <div className="font-medium">{s.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">{s.email}</div>
              <div className="mt-2 flex flex-wrap gap-1">
                {s.functions.map((f) => (
                  <span
                    key={f.id}
                    className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                    style={{ background: getFunctionColor(f.name) + "18", color: getFunctionColor(f.name) }}
                  >
                    {f.name}
                  </span>
                ))}
                {s.functions.length === 0 && <span className="text-xs italic text-muted-foreground">Sem funções</span>}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                {s.serviceCount} serviço(s)
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
