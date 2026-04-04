import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/shared/lib/api";

export default function EscalaNovaPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api<{ data: { scheduleId: number } }>("/schedules/generate", {
        method: "POST",
        body: JSON.stringify({ name, startDate, endDate }),
      });
      setGenerating(true);
      // Poll for completion
      const scheduleId = res.data.scheduleId;
      const poll = setInterval(async () => {
        try {
          const s = await api<{ data: { generatedAt: string } }>(`/schedules/${scheduleId}`);
          if (s.data.generatedAt) {
            clearInterval(poll);
            navigate(`/escala/${scheduleId}`);
          }
        } catch { /* keep polling */ }
      }, 1000);
      // Timeout after 30s
      setTimeout(() => { clearInterval(poll); navigate(`/escala/${scheduleId}`); }, 30000);
    } catch (err: any) {
      setError(err?.message || "Erro ao gerar escala");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 font-serif text-2xl font-bold">Nova Escala</h1>

      {generating ? (
        <div className="rounded-md border border-border bg-card p-8 text-center">
          <div className="mb-3 text-lg font-medium">Gerando escala...</div>
          <p className="text-sm text-muted-foreground">O algoritmo está distribuindo os acólitos. Aguarde.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="rounded-md border border-border bg-card p-6">
          {error && <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium">Nome da Escala</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ex: Escala Abril 2026"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Data Início</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Data Fim</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Gerar Escala
          </button>
        </form>
      )}
    </div>
  );
}
