import { useState, useEffect } from "react";
import { api } from "@/shared/lib/api";

interface Guardian {
  id: number;
  name: string;
  email: string;
  role: string;
  functions: { id: number; name: string }[];
  serviceCount: number;
}

export default function ResponsaveisPage() {
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Guardians are users with GUARDIAN role — use servers endpoint filtered
    // For now, fetch all users and filter (backend /api/guardians not yet built)
    api<{ data: Guardian[] }>("/servers").then((r) => {
      setGuardians(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-muted-foreground">Carregando...</p>;

  return (
    <div>
      <h1 className="mb-4 font-serif text-2xl font-bold">Responsáveis</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Gerencie vínculos entre responsáveis e acólitos menores.
      </p>

      {guardians.length === 0 ? (
        <div className="rounded-md border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">Nenhum responsável cadastrado ainda.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Nome</th>
                <th className="px-4 py-2 text-left font-medium">Email</th>
                <th className="px-4 py-2 text-left font-medium">Funções</th>
              </tr>
            </thead>
            <tbody>
              {guardians.map((g) => (
                <tr key={g.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2 font-medium">{g.name}</td>
                  <td className="px-4 py-2 text-muted-foreground">{g.email}</td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {g.functions.length > 0 ? g.functions.map((f) => f.name).join(", ") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
