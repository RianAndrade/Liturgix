import { useState, useEffect, type FormEvent } from "react";
import { api } from "@/shared/lib/api";
import { getFunctionColor } from "@/shared/lib/function-colors";
import { PageLoading } from "@/shared/components/ui/Spinner";
import { PageError } from "@/shared/components/ui/PageError";
import { Spinner } from "@/shared/components/ui/Spinner";
import { ConfirmDialog } from "@/shared/components/ui/ConfirmDialog";
import { useToast } from "@/shared/components/ui/Toast";

interface LiturgicalFunction {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  displayOrder: number;
}

export default function AdminFuncoesPage() {
  const { toast } = useToast();
  const [functions, setFunctions] = useState<LiturgicalFunction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [displayOrder, setDisplayOrder] = useState(1);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [toggleTarget, setToggleTarget] = useState<LiturgicalFunction | null>(null);

  const fetchFunctions = async () => {
    setError(false);
    try {
      const res = await api<{ data: LiturgicalFunction[] }>("/admin/functions");
      setFunctions(res.data);
    } catch {
      setError(true);
    }
    setLoading(false);
  };

  useEffect(() => { fetchFunctions(); }, []);

  const resetForm = () => {
    setName(""); setDescription(""); setDisplayOrder(functions.length + 1);
    setEditingId(null); setShowForm(false); setFormError("");
  };

  const startEdit = (fn: LiturgicalFunction) => {
    setName(fn.name); setDescription(fn.description ?? "");
    setDisplayOrder(fn.displayOrder); setEditingId(fn.id);
    setShowForm(true); setFormError("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      if (editingId) {
        await api(`/admin/functions/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify({ name, description: description || undefined, displayOrder }),
        });
        toast("Função atualizada");
      } else {
        await api("/admin/functions", {
          method: "POST",
          body: JSON.stringify({ name, description: description || undefined, displayOrder }),
        });
        toast("Função criada");
      }
      resetForm();
      await fetchFunctions();
    } catch (err: any) {
      setFormError(err?.message || "Erro ao salvar");
    }
    setSubmitting(false);
  };

  const confirmToggle = async () => {
    if (!toggleTarget) return;
    try {
      await api(`/admin/functions/${toggleTarget.id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !toggleTarget.active }),
      });
      toast(toggleTarget.active ? "Função desativada" : "Função ativada");
      setToggleTarget(null);
      await fetchFunctions();
    } catch {
      toast("Erro ao alterar função", "error");
    }
  };

  if (loading) return <PageLoading />;
  if (error) return <PageError onRetry={fetchFunctions} />;

  const labelClass = "mb-1 block text-[11px] font-semibold uppercase tracking-[1.5px] text-accent";
  const inputClass = "w-full rounded-lg border border-border bg-card-inner px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";

  return (
    <div>
      <ConfirmDialog
        open={!!toggleTarget}
        title={toggleTarget?.active ? "Desativar Função" : "Ativar Função"}
        message={toggleTarget?.active
          ? `Desativar "${toggleTarget?.name}"? Escalas ativas podem ser afetadas.`
          : `Ativar "${toggleTarget?.name}"?`}
        confirmLabel={toggleTarget?.active ? "Desativar" : "Ativar"}
        variant={toggleTarget?.active ? "danger" : "default"}
        onCancel={() => setToggleTarget(null)}
        onConfirm={confirmToggle}
      />

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
            {editingId ? `Editar: ${name}` : "Nova Função"}
          </h2>
          {formError && (
            <p className="mb-3 rounded-lg px-3 py-2 text-sm" style={{ background: "#a0413c20", color: "#a0413c" }}>
              {formError}
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
            <button type="submit" disabled={submitting}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground flex items-center gap-2 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #7a2e1a, #a0413c)" }}>
              {submitting && <Spinner size={14} />}
              Salvar
            </button>
            <button type="button" onClick={resetForm}
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {functions.length === 0 ? (
        <div className="rounded-lg bg-card p-6 border border-border text-center">
          <p className="text-sm text-muted-foreground">Nenhuma função cadastrada.</p>
        </div>
      ) : (
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
              <button onClick={() => setToggleTarget(fn)} className="text-xs text-muted-foreground hover:underline">
                {fn.active ? "Desativar" : "Ativar"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
