import { Fragment, useState, useEffect, useCallback, type FormEvent } from "react";
import { api } from "@/shared/lib/api";
import { useAuth, hasMinRole } from "@/features/auth/auth";
import { getFunctionColor } from "@/shared/lib/function-colors";
import { PageLoading } from "@/shared/components/ui/Spinner";
import { PageError } from "@/shared/components/ui/PageError";
import { Spinner } from "@/shared/components/ui/Spinner";
import { ConfirmDialog } from "@/shared/components/ui/ConfirmDialog";
import { useToast } from "@/shared/components/ui/Toast";

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

interface Pagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

const TYPE_LABEL: Record<string, string> = {
  SUNDAY_MASS: "Missa Dominical",
  WEEKDAY_MASS: "Missa Semanal",
  HOLY_DAY: "Dia Santo",
  SPECIAL: "Especial",
};

const TYPE_ICON: Record<string, string> = {
  SUNDAY_MASS: "☀",
  WEEKDAY_MASS: "✝",
  HOLY_DAY: "⭐",
  SPECIAL: "◆",
};

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const PRESETS: { label: string; description: string; match: (name: string) => number }[] = [
  { label: "Completa", description: "Todas as funções", match: () => 1 },
  { label: "Reduzida", description: "Tochas, Cruz e Sino, Missal, Leitores", match: (name) => ["Missal", "Tochas", "Cruz e Sino", "Leitores"].includes(name) ? 1 : 0 },
  { label: "Só Tochas", description: "Apenas Tochas", match: (name) => name === "Tochas" ? 1 : 0 },
  { label: "Só Mor", description: "Apenas 1 Mor", match: (name) => name === "Mor" ? 1 : 0 },
  { label: "Limpar", description: "Remover todas", match: () => 0 },
];

const PER_PAGE = 12;

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
  const { toast } = useToast();
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
    try {
      const requirements = Object.entries(reqs)
        .filter(([, qty]) => qty > 0)
        .map(([fid, quantity]) => ({ functionId: Number(fid), quantity }));
      await api(`/celebrations/${celebration.id}/requirements`, {
        method: "PUT",
        body: JSON.stringify({ requirements }),
      });
      toast("Requisitos salvos");
      onSave();
    } catch {
      toast("Erro ao salvar requisitos", "error");
    }
    setSaving(false);
  };

  return (
    <div className="mt-3 rounded-md border border-border bg-muted/50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium">Requisitos de funções</span>
        <div className="flex gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                const r: Record<number, number> = {};
                for (const fn of functions) r[fn.id] = p.match(fn.name);
                setReqs(r);
              }}
              title={p.description}
              className="rounded-md border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {functions.map((fn) => (
          <div key={fn.id} className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0"
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
              className="w-14 rounded-md border border-border bg-background px-2 py-1 text-center text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
        >
          {saving && <Spinner size={14} />}
          {saving ? "Salvando..." : "Salvar"}
        </button>
        <button
          onClick={onClose}
          className="rounded-md border border-border px-4 py-1.5 text-sm hover:bg-muted"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function MonthNav({
  year,
  month,
  onChange,
}: {
  year: number;
  month: number;
  onChange: (y: number, m: number) => void;
}) {
  const prev = () => {
    if (month === 1) onChange(year - 1, 12);
    else onChange(year, month - 1);
  };
  const next = () => {
    if (month === 12) onChange(year + 1, 1);
    else onChange(year, month + 1);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={prev}
        className="rounded-md border border-border px-2 py-1.5 text-sm hover:bg-muted transition-colors"
        aria-label="Mês anterior"
      >
        ‹
      </button>
      <span className="min-w-[140px] text-center text-sm font-medium">
        {MONTH_NAMES[month - 1]} {year}
      </span>
      <button
        onClick={next}
        className="rounded-md border border-border px-2 py-1.5 text-sm hover:bg-muted transition-colors"
        aria-label="Próximo mês"
      >
        ›
      </button>
    </div>
  );
}

function CelebrationCard({
  celebration,
  functions,
  isCoord,
  onEdit,
  onDelete,
  onReqsSaved,
}: {
  celebration: Celebration;
  functions: LiturgicalFunction[];
  isCoord: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onReqsSaved: () => void;
}) {
  const [showReqs, setShowReqs] = useState(false);
  const d = new Date(celebration.date);
  const weekday = d.toLocaleDateString("pt-BR", { weekday: "long" });
  const day = d.getDate();
  const timeStr = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden transition-shadow hover:shadow-md">
      {/* Header com data */}
      <div className="flex items-stretch">
        <div className="flex w-16 flex-col items-center justify-center bg-primary/10 px-2 py-3">
          <span className="text-2xl font-bold leading-none text-primary">{day}</span>
          <span className="mt-0.5 text-[10px] font-medium uppercase text-primary/70">{weekday.slice(0, 3)}</span>
        </div>
        <div className="flex flex-1 flex-col justify-center px-3 py-2.5">
          <div className="flex items-center gap-2">
            <span className="font-serif font-semibold leading-tight">{celebration.name}</span>
            <CelebrationPeriodBadge date={celebration.date} />
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{timeStr}</span>
            <span className="text-border">|</span>
            <span>{TYPE_ICON[celebration.type]} {TYPE_LABEL[celebration.type] ?? celebration.type}</span>
            {celebration.location && (
              <>
                <span className="text-border">|</span>
                <span>{celebration.location}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Funções */}
      <div className="border-t border-border px-3 py-2">
        {celebration.functionRequirements.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {celebration.functionRequirements.map((r) => (
              <span
                key={r.function.id}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
                style={{ backgroundColor: getFunctionColor(r.function.name) }}
              >
                {r.function.name} x{r.quantity}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-xs italic text-muted-foreground/60">Sem requisitos definidos</span>
        )}
      </div>

      {/* Ações */}
      {isCoord && (
        <div className="border-t border-border px-3 py-1.5 flex items-center gap-3">
          <button onClick={onEdit} className="text-xs text-primary hover:underline">Editar</button>
          <button onClick={() => setShowReqs(!showReqs)} className="text-xs text-primary hover:underline">
            {showReqs ? "Fechar funções" : "Funções"}
          </button>
          <button onClick={onDelete} className="ml-auto text-xs text-destructive hover:underline">Remover</button>
        </div>
      )}

      {/* Editor de requisitos inline */}
      {isCoord && showReqs && (
        <div className="border-t border-border px-3 py-2">
          <RequirementsEditor
            celebration={celebration}
            functions={functions}
            onSave={() => { setShowReqs(false); onReqsSaved(); }}
            onClose={() => setShowReqs(false)}
          />
        </div>
      )}
    </div>
  );
}

export default function CelebracoesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [celebrations, setCelebrations] = useState<Celebration[]>([]);
  const [functions, setFunctions] = useState<LiturgicalFunction[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, perPage: PER_PAGE, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [type, setType] = useState("SUNDAY_MASS");
  const [location, setLocation] = useState("");
  const [formReqs, setFormReqs] = useState<Record<number, number>>({});
  const [editingId, setEditingId] = useState<number | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Celebration | null>(null);

  const now = new Date();
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);

  const fetchCelebrations = useCallback(async (page = 1) => {
    setError(false);
    try {
      const startDate = `${filterYear}-${String(filterMonth).padStart(2, "0")}-01`;
      const lastDay = new Date(filterYear, filterMonth, 0).getDate();
      const endDate = `${filterYear}-${String(filterMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

      const [celRes, fnRes] = await Promise.all([
        api<{ data: Celebration[]; pagination: Pagination }>(
          `/celebrations?startDate=${startDate}&endDate=${endDate}&page=${page}&perPage=${PER_PAGE}`,
        ),
        api<{ data: LiturgicalFunction[] }>("/functions"),
      ]);
      setCelebrations(celRes.data);
      setPagination(celRes.pagination);
      setFunctions(fnRes.data);
    } catch {
      setError(true);
    }
    setLoading(false);
  }, [filterYear, filterMonth]);

  useEffect(() => {
    setLoading(true);
    fetchCelebrations(1);
  }, [fetchCelebrations]);

  const applyPreset = (preset: typeof PRESETS[number]) => {
    const reqs: Record<number, number> = {};
    for (const fn of functions) reqs[fn.id] = preset.match(fn.name);
    setFormReqs(reqs);
  };

  const resetForm = () => {
    setName(""); setDate(""); setTime("10:00"); setType("SUNDAY_MASS"); setLocation("");
    setFormReqs({}); setEditingId(null); setShowForm(false);
  };

  const startEdit = (c: Celebration) => {
    setName(c.name);
    setDate(c.date.slice(0, 10));
    setTime(c.date.slice(11, 16) || "10:00");
    setType(c.type);
    setLocation(c.location ?? "");
    const reqs: Record<number, number> = {};
    for (const r of c.functionRequirements) reqs[r.function.id] = r.quantity;
    setFormReqs(reqs);
    setEditingId(c.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const celBody = { name, date: `${date}T${time}:00.000Z`, type, location: location || undefined };
      let celId = editingId;
      if (editingId) {
        await api(`/celebrations/${editingId}`, { method: "PATCH", body: JSON.stringify(celBody) });
      } else {
        const res = await api<{ data: { id: number } }>("/celebrations", { method: "POST", body: JSON.stringify(celBody) });
        celId = res.data.id;
      }
      const requirements = Object.entries(formReqs)
        .filter(([, qty]) => qty > 0)
        .map(([fid, quantity]) => ({ functionId: Number(fid), quantity }));
      if (celId && requirements.length > 0) {
        await api(`/celebrations/${celId}/requirements`, {
          method: "PUT",
          body: JSON.stringify({ requirements }),
        });
      }
      toast(editingId ? "Celebração atualizada" : "Celebração criada");
      resetForm();
      await fetchCelebrations(1);
    } catch {
      toast("Erro ao salvar celebração", "error");
    }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api(`/celebrations/${deleteTarget.id}`, { method: "DELETE" });
      toast("Celebração removida");
      setDeleteTarget(null);
      await fetchCelebrations(pagination.page);
    } catch {
      toast("Erro ao remover celebração", "error");
    }
  };

  const isCoord = user && hasMinRole(user.role, "COORDINATOR");

  if (loading) return <PageLoading />;
  if (error) return <PageError onRetry={() => fetchCelebrations(1)} />;

  return (
    <div>
      <ConfirmDialog
        open={!!deleteTarget}
        title="Remover Celebração"
        message={`Tem certeza que deseja remover "${deleteTarget?.name}"?`}
        confirmLabel="Remover"
        variant="danger"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-serif text-2xl font-bold">Celebrações</h1>
        <div className="flex items-center gap-3">
          <MonthNav
            year={filterYear}
            month={filterMonth}
            onChange={(y, m) => { setFilterYear(y); setFilterMonth(m); }}
          />
          {isCoord && (
            <button
              onClick={() => { resetForm(); setShowForm(!showForm); }}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Nova Celebração
            </button>
          )}
        </div>
      </div>

      {/* Resumo */}
      <div className="mb-4 flex items-center gap-4 text-xs text-muted-foreground">
        <span>{pagination.total} celebraç{pagination.total === 1 ? "ão" : "ões"} em {MONTH_NAMES[filterMonth - 1]}</span>
        {celebrations.length > 0 && (
          <span className="text-border">|</span>
        )}
        {celebrations.length > 0 && (() => {
          const allFns = new Map<string, number>();
          for (const c of celebrations) {
            for (const r of c.functionRequirements) {
              allFns.set(r.function.name, (allFns.get(r.function.name) ?? 0) + r.quantity);
            }
          }
          return [...allFns.entries()].map(([fname, total]) => (
            <span key={fname} className="inline-flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: getFunctionColor(fname) }} />
              {fname}: {total}
            </span>
          ));
        })()}
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 font-serif text-lg font-semibold">
            {editingId ? "Editar Celebração" : "Nova Celebração"}
          </h2>
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

          {/* Funções com presets */}
          {functions.length > 0 && (
            <div className="mt-4 rounded-md border border-border bg-muted/30 p-3">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium">Funções necessárias</label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => applyPreset(p)}
                      title={p.description}
                      className="rounded-md border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {functions.map((fn) => (
                  <div key={fn.id} className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getFunctionColor(fn.name) }}
                    />
                    <label className="flex-1 text-sm">{fn.name}</label>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={formReqs[fn.id] ?? 0}
                      onChange={(e) =>
                        setFormReqs((prev) => ({ ...prev, [fn.id]: Number(e.target.value) }))
                      }
                      className="w-14 rounded-md border border-border bg-background px-2 py-1 text-center text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <button type="submit" disabled={submitting} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
              {submitting && <Spinner size={14} />}
              Salvar
            </button>
            <button type="button" onClick={resetForm} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">Cancelar</button>
          </div>
        </form>
      )}

      {/* Lista */}
      {celebrations.length === 0 ? (
        <div className="rounded-lg bg-card p-8 border border-border text-center">
          <p className="text-sm text-muted-foreground">Nenhuma celebração em {MONTH_NAMES[filterMonth - 1]}.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {celebrations.map((c) => (
            <CelebrationCard
              key={c.id}
              celebration={c}
              functions={functions}
              isCoord={!!isCoord}
              onEdit={() => startEdit(c)}
              onDelete={() => setDeleteTarget(c)}
              onReqsSaved={() => fetchCelebrations(pagination.page)}
            />
          ))}
        </div>
      )}

      {/* Paginação */}
      {pagination.totalPages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-2">
          <button
            disabled={pagination.page <= 1}
            onClick={() => fetchCelebrations(pagination.page - 1)}
            className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-40 transition-colors"
          >
            Anterior
          </button>
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => fetchCelebrations(p)}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                p === pagination.page
                  ? "bg-primary text-primary-foreground"
                  : "border border-border hover:bg-muted"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => fetchCelebrations(pagination.page + 1)}
            className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-40 transition-colors"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
