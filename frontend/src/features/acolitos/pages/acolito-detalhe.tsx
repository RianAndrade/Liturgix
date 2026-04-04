import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/shared/lib/api";
import { useAuth, hasMinRole } from "@/features/auth/auth";

interface ServerDetail {
  id: number;
  name: string;
  email: string;
  role: string;
  functions: { id: number; name: string }[];
  serviceCount: number;
}

interface LiturgicalFn {
  id: number;
  name: string;
  displayOrder: number;
}

export default function AcolitoDetalhePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [server, setServer] = useState<ServerDetail | null>(null);
  const [allFunctions, setAllFunctions] = useState<LiturgicalFn[]>([]);
  const [selectedFnIds, setSelectedFnIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const isCoord = user && hasMinRole(user.role, "COORDINATOR");

  useEffect(() => {
    Promise.all([
      api<{ data: ServerDetail }>(`/servers/${id}`),
      isCoord ? api<{ data: LiturgicalFn[] }>("/admin/functions") : Promise.resolve({ data: [] }),
    ]).then(([s, f]) => {
      setServer(s.data);
      setSelectedFnIds(s.data.functions.map((fn) => fn.id));
      setAllFunctions(f.data.filter((fn: any) => fn.active));
      setLoading(false);
    });
  }, [id]);

  const saveFunctions = async () => {
    await api(`/servers/${id}/functions`, {
      method: "PUT",
      body: JSON.stringify({ functionIds: selectedFnIds }),
    });
    const res = await api<{ data: ServerDetail }>(`/servers/${id}`);
    setServer(res.data);
  };

  const toggleFn = (fnId: number) => {
    setSelectedFnIds((prev) => prev.includes(fnId) ? prev.filter((x) => x !== fnId) : [...prev, fnId]);
  };

  if (loading) return <p className="text-muted-foreground">Carregando...</p>;
  if (!server) return <p className="text-destructive">Acólito não encontrado.</p>;

  return (
    <div>
      <Link to="/acolitos" className="text-sm text-muted-foreground hover:underline">&larr; Acólitos</Link>
      <h1 className="mt-1 font-serif text-2xl font-bold">{server.name}</h1>
      <p className="text-sm text-muted-foreground">{server.email} · {server.serviceCount} serviço(s)</p>

      <div className="mt-6">
        <h2 className="mb-3 font-serif text-lg font-semibold">Funções Habilitadas</h2>
        {isCoord && allFunctions.length > 0 ? (
          <div>
            <div className="flex flex-wrap gap-2">
              {allFunctions.map((fn) => (
                <button
                  key={fn.id}
                  onClick={() => toggleFn(fn.id)}
                  className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${selectedFnIds.includes(fn.id) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
                >
                  {fn.name}
                </button>
              ))}
            </div>
            <button onClick={saveFunctions} className="mt-3 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Salvar Funções
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-1">
            {server.functions.map((f) => (
              <span key={f.id} className="rounded bg-muted px-2 py-1 text-sm">{f.name}</span>
            ))}
            {server.functions.length === 0 && <p className="text-sm italic text-muted-foreground">Sem funções habilitadas</p>}
          </div>
        )}
      </div>
    </div>
  );
}
