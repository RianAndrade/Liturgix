import { Fragment, useState, useEffect, type FormEvent } from "react";
import { api } from "@/shared/lib/api";
import { useAuth, hasMinRole } from "@/features/auth/auth";
import { getFunctionColor } from "@/shared/lib/function-colors";

interface LiturgicalFunction {
  id: number;
  name: string;
}

interface FunctionRequirement {
  quantity: number;
  function: { id: number; name: string };
}

interface Celebration {
  id: number;
  name: string;
  date: string;
  type: string;
  location: string | null;
  functionRequirements: FunctionRequirement[];
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

function RequirementsEditor({
  celebration,
  functions,
  onSave,
  onClose,
}: {
  celebration: Celebration;
  functions: LiturgicalFunction[];
  onSave: () => void;
  onClose: () => void;
}) {
  const [reqs, setReqs] = useState<Record<number, number>>(() => {
    const map: Record<number, number> = {};
    for (const r of celebration.functionRequirements) {
      map[r.function.id] = r.quantity;
    }
    return map;
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const requirements = Object.entries(reqs)
      .filter(([, qty]) => qty > 0)
      .map(([fid, quantity]) => ({ functionId: Number(fid), quantity }));
    await api(`/celebrations/${celebration.id}/requirements`, {
      method: "PUT",
      body: JSON.stringify({ requirements }),
    });
    setSaving(false);
    onSave();
  };

  return (
    <tr>
      <td colSpan={5} className="border-b border-border bg-muted/50 px-4 py-3">
        <div className="mb-2 text-sm font-medium">
          Requisitos de funções — {celebration.name}
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {functions.map((fn) => (
            <div key={fn.id} className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: getFunctionColor(fn.name) }}
              />
              <label className="flex-1 text-sm">{fn.name}</label>
              <input
                type="number"
                min={0}
                max={20}
                value={reqs[fn.id] ?? 0}
                onChange={(e) =>
                  setReqs((prev) => ({ ...prev, [fn.id]: Number(e.target.value) }))
                }
                className="w-16 rounded-md border border-border bg-background px-2 py-1 text-center text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
          <button
            onClick={onClose}
            className="rounded-md border border-border px-4 py-1.5 text-sm hover:bg-muted"
          >
            Cancelar
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function CelebracoesPage() {
  const { user } = useAuth();
  const [celebrations, setCelebrations] = useState<Celebration[]>([]);
  const [functions, setFunctions] = useState<LiturgicalFunction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingReqsId, setEditingReqsId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [type, setType] = useState("SUNDAY_MASS");
  const [location, setLocation] = useState("");

  const fetch_ = async () => {
    const [celRes, fnRes] = await Promise.all([
      api<{ data: Celebration[] }>("/celebrations"),
      api<{ data: LiturgicalFunction[] }>("/functions"),
    ]);
    setCelebrations(celRes.data);
    setFunctions(fnRes.data);
    setLoading(false);
  };

  useEffect(() => { fetch_(); }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await api("/celebrations", {
      method: "POST",
      body: JSON.stringify({ name, date: `${date}T${time}:00.000Z`, type, location: location || undefined }),
    });
    setShowForm(false);
    setName(""); setDate(""); setTime("10:00"); setType("SUNDAY_MASS"); setLocation("");
    await fetch_();
  };

  const handleDelete = async (id: number) => {
    await api(`/celebrations/${id}`, { method: "DELETE" });
    await fetch_();
  };

  const isCoord = user && hasMinRole(user.role, "COORDINATOR");

  if (loading) return <p className="text-muted-foreground">Carregando...</p>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold">Celebrações</h1>
        {isCoord && (
          <button onClick={() => setShowForm(!showForm)} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Nova Celebração
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-md border border-border bg-card p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Nome</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Data</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Horário</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Tipo</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring">
                {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-3">
            <label className="mb-1 block text-sm font-medium">Local (opcional)</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="mt-3 flex gap-2">
            <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Salvar</button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">Cancelar</button>
          </div>
        </form>
      )}

      {celebrations.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma celebração cadastrada.</p>
      ) : (
        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Nome</th>
                <th className="px-4 py-2 text-left font-medium">Data</th>
                <th className="px-4 py-2 text-left font-medium">Tipo</th>
                <th className="px-4 py-2 text-left font-medium">Funções</th>
                {isCoord && <th className="px-4 py-2 text-right font-medium">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {celebrations.map((c) => (
              <Fragment key={c.id}>
                <tr className="border-b border-border last:border-0">
                  <td className="px-4 py-2 font-medium">{c.name}</td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {new Date(c.date).toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      {TYPE_LABEL[c.type] ?? c.type}
                      <CelebrationPeriodBadge date={c.date} />
                    </div>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {c.functionRequirements.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {c.functionRequirements.map((r) => (
                          <span
                            key={r.function.id}
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
                            style={{ backgroundColor: getFunctionColor(r.function.name) }}
                          >
                            {r.function.name} ×{r.quantity}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs italic text-muted-foreground/60">Sem requisitos</span>
                    )}
                  </td>
                  {isCoord && (
                    <td className="px-4 py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingReqsId(editingReqsId === c.id ? null : c.id)}
                          className="text-sm text-primary hover:underline"
                        >
                          Funções
                        </button>
                        <button onClick={() => handleDelete(c.id)} className="text-sm text-destructive hover:underline">Remover</button>
                      </div>
                    </td>
                  )}
                </tr>
                {editingReqsId === c.id && (
                  <RequirementsEditor
                    celebration={c}
                    functions={functions}
                    onSave={() => { setEditingReqsId(null); fetch_(); }}
                    onClose={() => setEditingReqsId(null)}
                  />
                )}
              </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
