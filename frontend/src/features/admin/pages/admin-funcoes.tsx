import { useState, useEffect, type FormEvent } from "react";
import { api } from "@/shared/lib/api";
import { getFunctionColor } from "@/shared/lib/function-colors";

interface LiturgicalFunction {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  displayOrder: number;
}

export default function AdminFuncoesPage() {
  const [functions, setFunctions] = useState<LiturgicalFunction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [displayOrder, setDisplayOrder] = useState(1);
  const [error, setError] = useState("");

  const fetchFunctions = async () => {
    const res = await api<{ data: LiturgicalFunction[] }>("/admin/functions");
    setFunctions(res.data);
    setLoading(false);
  };

  useEffect(() => { fetchFunctions(); }, []);

  const resetForm = () => {
    setName(""); setDescription(""); setDisplayOrder(functions.length + 1);
    setEditingId(null); setShowForm(false); setError("");
  };

  const startEdit = (fn: LiturgicalFunction) => {
    setName(fn.name); setDescription(fn.description ?? "");
    setDisplayOrder(fn.displayOrder); setEditingId(fn.id);
    setShowForm(true); setError("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (editingId) {
        await api(`/admin/functions/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify({ name, description: description || undefined, displayOrder }),
        });
      } else {
        await api("/admin/functions", {
          method: "POST",
          body: JSON.stringify({ name, description: description || undefined, displayOrder }),
        });
      }
      resetForm();
      await fetchFunctions();
    } catch (err: any) {
      setError(err?.message || "Erro ao salvar");
    }
  };

  const toggleActive = async (fn: LiturgicalFunction) => {
    await api(`/admin/functions/${fn.id}`, {
      method: "PATCH",
      body: JSON.stringify({ active: !fn.active }),
    });
    await fetchFunctions();
  };

  if (loading) {
    return <p className="text-muted-foreground">Carregando...</p>;
  }

  const labelClass = "mb-1 block text-[11px] font-semibold uppercase tracking-[1.5px] text-accent";
  const inputClass = "w-full rounded-lg border border-border bg-card-inner px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[3px] text-accent">✦ Administração</p>
          <h1 className="mt-1 font-serif text-[22px] font-medium text-foreground">Funções Litúrgicas</h1>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); setDisplayOrder(functions.length + 1); }}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground"
          style={{ background: "linear-gradient(135deg, #7a2e1a, #a0413c)" }}
        >
          Nova Função
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-lg border border-border bg-card p-5">
          <h2 className="mb-3 font-serif text-lg font-semibold text-foreground">
            {editingId ? "Editar Função" : "Nova Função"}
          </h2>
          {error && (
            <p className="mb-3 rounded-lg px-3 py-2 text-sm" style={{ background: "#a0413c20", color: "#a0413c" }}>
              {error}
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className={labelClass}>Nome</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Descrição</label>
              <input value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Ordem</label>
              <input type="number" value={displayOrder} onChange={(e) => setDisplayOrder(Number(e.target.value))}
                min={1} className={inputClass} />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" className="rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground"
              style={{ background: "linear-gradient(135deg, #7a2e1a, #a0413c)" }}>
              Salvar
            </button>
            <button type="button" onClick={resetForm}
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {functions.map((fn) => (
          <div key={fn.id}
            className="flex items-center gap-3 rounded-lg bg-card p-3"
            style={{ borderLeft: `3px solid ${getFunctionColor(fn.name)}` }}>
            <div
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold"
              style={{ background: getFunctionColor(fn.name), color: "#f3ece0" }}>
              {fn.displayOrder}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{fn.name}</p>
              <p className="text-[11px] text-muted-foreground">{fn.description || "Sem descrição"}</p>
            </div>
            <span
              className="rounded-md px-2 py-0.5 text-[10px] font-semibold"
              style={
                fn.active
                  ? { background: "rgba(42,122,111,0.12)", color: "#2a7a6f" }
                  : { background: "rgba(154,133,104,0.12)", color: "#9a8568" }
              }
            >
              {fn.active ? "Ativa" : "Inativa"}
            </span>
            <button onClick={() => startEdit(fn)} className="text-xs font-medium text-accent hover:underline">
              Editar
            </button>
            <button onClick={() => toggleActive(fn)} className="text-xs text-muted-foreground hover:underline">
              {fn.active ? "Desativar" : "Ativar"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
