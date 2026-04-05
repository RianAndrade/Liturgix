import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/shared/lib/api";
import { useAuth, hasMinRole } from "@/features/auth/auth";
import { getFunctionColor } from "@/shared/lib/function-colors";
import { PageLoading } from "@/shared/components/ui/Spinner";
import { PageError } from "@/shared/components/ui/PageError";
import { Spinner } from "@/shared/components/ui/Spinner";
import { ConfirmDialog } from "@/shared/components/ui/ConfirmDialog";
import { useToast } from "@/shared/components/ui/Toast";

/* ─── Types ─── */

interface ServerFunction {
  id: number;
  name: string;
}

interface Server {
  id: number;
  name: string;
  functions: ServerFunction[];
}

interface Assignment {
  id: number;
  locked: boolean;
  score: number | null;
  celebration: { id: number; name: string; date: string; type: string };
  function: { id: number; name: string };
  user: { id: number; name: string } | null;
}

interface Schedule {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  publicToken: string | null;
  assignments: Assignment[];
  createdBy: { id: number; name: string };
}

interface RuleWarning {
  type: "not_qualified" | "already_assigned" | "duplicate_function";
  message: string;
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

/* ─── Rule validation (frontend) ─── */

function checkRules(
  targetAssignment: Assignment,
  newUserId: number,
  servers: Server[],
  allAssignments: Assignment[],
): RuleWarning[] {
  const warnings: RuleWarning[] = [];
  const server = servers.find((s) => s.id === newUserId);
  if (!server) return warnings;

  // 1. Not qualified for this function
  const isQualified = server.functions.some((f) => f.id === targetAssignment.function.id);
  if (!isQualified) {
    warnings.push({
      type: "not_qualified",
      message: `${server.name} não é qualificado(a) para "${targetAssignment.function.name}".`,
    });
  }

  // 2. Already assigned in the same celebration (different function)
  const sameCelebrationAssignments = allAssignments.filter(
    (a) => a.celebration.id === targetAssignment.celebration.id && a.id !== targetAssignment.id && a.user?.id === newUserId,
  );
  if (sameCelebrationAssignments.length > 0) {
    const fns = sameCelebrationAssignments.map((a) => a.function.name).join(", ");
    warnings.push({
      type: "already_assigned",
      message: `${server.name} já está escalado(a) nesta celebração como: ${fns}.`,
    });
  }

  // 3. Same function in another celebration on the same day
  const targetDate = targetAssignment.celebration.date.slice(0, 10);
  const sameDaySameFunction = allAssignments.filter(
    (a) =>
      a.id !== targetAssignment.id &&
      a.function.id === targetAssignment.function.id &&
      a.celebration.date.slice(0, 10) === targetDate &&
      a.user?.id === newUserId,
  );
  if (sameDaySameFunction.length > 0) {
    warnings.push({
      type: "duplicate_function",
      message: `${server.name} já exerce "${targetAssignment.function.name}" em outra celebração no mesmo dia.`,
    });
  }

  return warnings;
}

/* ─── Searchable Combobox ─── */

interface ComboOption {
  id: number;
  label: string;
  qualified: boolean;
}

function ServerCombobox({
  options,
  value,
  onSelect,
}: {
  options: ComboOption[];
  value: number | "";
  onSelect: (id: number | "") => void;
}) {
  const [query, setQuery] = useState(() => {
    if (value === "") return "";
    return options.find((o) => o.id === value)?.label ?? "";
  });
  const [open, setOpen] = useState(true);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim() === ""
    ? options
    : options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()));

  // Clamp highlight
  const clampedIdx = Math.min(highlightIdx, filtered.length - 1);

  const pick = (opt: ComboOption | null) => {
    if (opt) {
      setQuery(opt.label);
      onSelect(opt.id);
    } else {
      setQuery("");
      onSelect("");
    }
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[clampedIdx]) pick(filtered[clampedIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  // Scroll highlighted into view
  useEffect(() => {
    const el = listRef.current?.children[clampedIdx + 1] as HTMLElement | undefined; // +1 for the "Não atribuído" option
    el?.scrollIntoView({ block: "nearest" });
  }, [clampedIdx]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.closest(".combobox-root")?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="combobox-root relative">
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); setHighlightIdx(0); }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Buscar acólito..."
        className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        autoFocus
      />
      {open && (
        <div
          ref={listRef}
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-md border border-border bg-card shadow-lg"
        >
          <button
            type="button"
            onClick={() => pick(null)}
            className="w-full px-3 py-1.5 text-left text-sm italic text-muted-foreground hover:bg-muted"
          >
            — Não atribuído —
          </button>
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-xs text-muted-foreground">Nenhum resultado</div>
          ) : (
            filtered.map((opt, i) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => pick(opt)}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors ${
                  i === clampedIdx ? "bg-primary/10 text-foreground" : "hover:bg-muted"
                }`}
              >
                <span className={`flex-1 ${!opt.qualified ? "text-muted-foreground" : ""}`}>
                  {opt.label}
                </span>
                {!opt.qualified && (
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    sem qualificação
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Components ─── */

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

function WarningBanner({ warnings, onConfirm, onCancel, saving }: {
  warnings: RuleWarning[];
  onConfirm: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <div className="mt-2 rounded-md border border-amber-400/50 bg-amber-50 p-3 dark:border-amber-500/30 dark:bg-amber-950/30">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
        <span>⚠</span> Atenção — regras de negócio afetadas
      </div>
      <ul className="mb-3 space-y-1">
        {warnings.map((w, i) => (
          <li key={i} className="text-sm text-amber-700 dark:text-amber-400">
            • {w.message}
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          disabled={saving}
          className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50 flex items-center gap-1.5"
        >
          {saving && <Spinner size={12} />}
          Aplicar mesmo assim
        </button>
        <button
          onClick={onCancel}
          className="rounded-md border border-amber-400/50 px-3 py-1.5 text-xs text-amber-700 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/30"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function AssignmentRow({
  assignment,
  servers,
  allAssignments,
  scheduleId,
  canEdit,
  cardEditing,
  onUpdated,
  onRemove,
}: {
  assignment: Assignment;
  servers: Server[];
  allAssignments: Assignment[];
  scheduleId: number;
  canEdit: boolean;
  cardEditing: boolean;
  onUpdated: () => void;
  onRemove: (id: number) => void;
}) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | "">(assignment.user?.id ?? "");
  const [warnings, setWarnings] = useState<RuleWarning[]>([]);
  const [saving, setSaving] = useState(false);

  const isEditing = editing || cardEditing;

  const handleSelect = (userId: number | "") => {
    setSelectedUserId(userId);
    setWarnings([]);
    if (userId === "" || userId === assignment.user?.id) return;

    const rules = checkRules(assignment, userId, servers, allAssignments);
    if (rules.length > 0) {
      setWarnings(rules);
    } else {
      doSave(userId);
    }
  };

  const doSave = async (userId: number | "") => {
    setSaving(true);
    try {
      await api(`/schedules/${scheduleId}/assignments/${assignment.id}`, {
        method: "PATCH",
        body: JSON.stringify({ userId: userId === "" ? null : userId }),
      });
      toast("Atribuição atualizada");
      setEditing(false);
      setWarnings([]);
      onUpdated();
    } catch {
      toast("Erro ao atualizar atribuição", "error");
    }
    setSaving(false);
  };

  const forceConfirm = () => doSave(selectedUserId);

  // Sort servers: qualified first, then alphabetical
  const sortedServers = [...servers].sort((a, b) => {
    const aQual = a.functions.some((f) => f.id === assignment.function.id) ? 0 : 1;
    const bQual = b.functions.some((f) => f.id === assignment.function.id) ? 0 : 1;
    if (aQual !== bQual) return aQual - bQual;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-background px-3 py-2">
      <div className="flex items-center gap-3">
        {/* Function badge */}
        <span
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-white"
          style={{ backgroundColor: getFunctionColor(assignment.function.name) }}
        >
          {assignment.function.name}
        </span>

        {/* Acolyte name or editor */}
        <div className="flex-1">
          {isEditing ? (
            <ServerCombobox
              options={sortedServers.map((s) => ({
                id: s.id,
                label: s.name,
                qualified: s.functions.some((f) => f.id === assignment.function.id),
              }))}
              value={selectedUserId}
              onSelect={(id) => handleSelect(id)}
            />
          ) : (
            <span className={`text-sm ${assignment.user ? "font-medium" : "italic text-muted-foreground"}`}>
              {assignment.user?.name ?? "Não atribuído"}
            </span>
          )}
        </div>

        {/* Actions (only when NOT in card-wide edit mode) */}
        {canEdit && !cardEditing && (
          <div className="flex items-center gap-1.5">
            {!editing ? (
              <>
                <button
                  onClick={() => { setEditing(true); setSelectedUserId(assignment.user?.id ?? ""); setWarnings([]); }}
                  className="rounded-md border border-border px-2 py-1 text-[11px] text-primary hover:bg-muted transition-colors"
                >
                  Trocar
                </button>
                <button
                  onClick={() => onRemove(assignment.id)}
                  className="rounded-md border border-destructive/30 px-2 py-1 text-[11px] text-destructive hover:bg-destructive/10 transition-colors"
                >
                  ✕
                </button>
              </>
            ) : (
              <button
                onClick={() => { setEditing(false); setWarnings([]); }}
                className="rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
        )}
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <WarningBanner
          warnings={warnings}
          onConfirm={forceConfirm}
          onCancel={() => { setWarnings([]); setSelectedUserId(assignment.user?.id ?? ""); setEditing(false); }}
          saving={saving}
        />
      )}
    </div>
  );
}

function CelebrationCard({
  celebration,
  assignments,
  servers,
  allAssignments,
  allFunctions,
  scheduleId,
  canEdit,
  onUpdated,
  onRemove,
}: {
  celebration: Assignment["celebration"];
  assignments: Assignment[];
  servers: Server[];
  allAssignments: Assignment[];
  allFunctions: ServerFunction[];
  scheduleId: number;
  canEdit: boolean;
  onUpdated: () => void;
  onRemove: (id: number) => void;
}) {
  const { toast } = useToast();
  const [editingAll, setEditingAll] = useState(false);
  const [addingFunction, setAddingFunction] = useState(false);
  const [newFunctionId, setNewFunctionId] = useState<number | "">("");
  const [addingSaving, setAddingSaving] = useState(false);

  const d = new Date(celebration.date);
  const day = d.getDate();
  const weekday = d.toLocaleDateString("pt-BR", { weekday: "long" });
  const timeStr = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  // Functions already assigned in this celebration
  const assignedFunctionIds = new Set(assignments.map((a) => a.function.id));

  const handleAddFunction = async () => {
    if (newFunctionId === "") return;
    setAddingSaving(true);
    try {
      await api(`/schedules/${scheduleId}/assignments`, {
        method: "POST",
        body: JSON.stringify({
          celebrationId: celebration.id,
          functionId: newFunctionId,
          userId: null,
        }),
      });
      toast("Função adicionada");
      setAddingFunction(false);
      setNewFunctionId("");
      onUpdated();
    } catch {
      toast("Erro ao adicionar função", "error");
    }
    setAddingSaving(false);
  };

  return (
    <div className={`rounded-xl border bg-card overflow-hidden shadow-sm transition-all ${editingAll ? "border-primary/40 ring-1 ring-primary/20" : "border-border hover:shadow-md"}`}>
      {/* Header */}
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
          </div>
        </div>
        {/* Edit button + count */}
        <div className="flex items-center gap-2 pr-3">
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {assignments.length} funç{assignments.length === 1 ? "ão" : "ões"}
          </span>
          {canEdit && (
            <button
              onClick={() => setEditingAll(!editingAll)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                editingAll
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "border border-border text-primary hover:bg-muted"
              }`}
            >
              {editingAll ? "Fechar edição" : "Editar"}
            </button>
          )}
        </div>
      </div>

      {/* Assignments */}
      <div className="border-t border-border p-3 space-y-2">
        {assignments.map((a) => (
          <AssignmentRow
            key={a.id}
            assignment={a}
            servers={servers}
            allAssignments={allAssignments}
            scheduleId={scheduleId}
            canEdit={canEdit}
            cardEditing={editingAll}
            onUpdated={onUpdated}
            onRemove={onRemove}
          />
        ))}

        {/* Add function */}
        {canEdit && !addingFunction && (
          <button
            onClick={() => setAddingFunction(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            + Adicionar função
          </button>
        )}
        {canEdit && addingFunction && (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
            <select
              value={newFunctionId}
              onChange={(e) => setNewFunctionId(e.target.value ? Number(e.target.value) : "")}
              className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            >
              <option value="">Selecione uma função...</option>
              {allFunctions.map((fn) => (
                <option key={fn.id} value={fn.id}>
                  {fn.name}{assignedFunctionIds.has(fn.id) ? " (já existe)" : ""}
                </option>
              ))}
            </select>
            <button
              onClick={handleAddFunction}
              disabled={newFunctionId === "" || addingSaving}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1"
            >
              {addingSaving && <Spinner size={12} />}
              Adicionar
            </button>
            <button
              onClick={() => { setAddingFunction(false); setNewFunctionId(""); }}
              className="rounded-md border border-border px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Page ─── */

export default function EscalaDetalhePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [servers, setServers] = useState<Server[]>([]);
  const [allFunctions, setAllFunctions] = useState<ServerFunction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    variant: "danger" | "default";
    action: () => Promise<void>;
  } | null>(null);

  const fetchData = useCallback(async () => {
    setError(false);
    try {
      const [schedRes, srvRes, fnRes] = await Promise.all([
        api<{ data: Schedule }>(`/schedules/${id}`),
        api<{ data: Server[] }>("/servers"),
        api<{ data: ServerFunction[] }>("/functions"),
      ]);
      setSchedule(schedRes.data);
      setServers(srvRes.data);
      setAllFunctions(fnRes.data);
    } catch {
      setError(true);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const runAction = async (action: () => Promise<void>, successMsg: string) => {
    setActionLoading(true);
    try {
      await action();
      await fetchData();
      toast(successMsg);
    } catch {
      toast("Erro ao executar ação", "error");
    }
    setActionLoading(false);
  };

  const handlePublish = () => {
    setConfirmAction({
      title: "Publicar Escala",
      message: "A escala ficará visível para todos. Deseja continuar?",
      variant: "default",
      action: () => api(`/schedules/${id}/publish`, { method: "POST" }),
    });
  };

  const handleArchive = () => {
    setConfirmAction({
      title: "Arquivar Escala",
      message: "A escala será arquivada e não poderá mais ser editada.",
      variant: "danger",
      action: () => api(`/schedules/${id}`, { method: "PATCH", body: JSON.stringify({ status: "ARCHIVED" }) }),
    });
  };

  const handleRemoveAssignment = (assignmentId: number) => {
    setConfirmAction({
      title: "Remover Atribuição",
      message: "Tem certeza que deseja remover esta atribuição?",
      variant: "danger",
      action: () => api(`/schedules/${id}/assignments/${assignmentId}`, { method: "DELETE" }),
    });
  };

  if (loading) return <PageLoading />;
  if (error || !schedule) return <PageError message="Escala não encontrada." onRetry={fetchData} />;

  // Group by celebration
  const byCelebration = new Map<number, { celebration: Assignment["celebration"]; assignments: Assignment[] }>();
  for (const a of schedule.assignments) {
    if (!byCelebration.has(a.celebration.id)) {
      byCelebration.set(a.celebration.id, { celebration: a.celebration, assignments: [] });
    }
    byCelebration.get(a.celebration.id)!.assignments.push(a);
  }

  const isCoord = user && hasMinRole(user.role, "COORDINATOR");
  const isDraft = schedule.status === "DRAFT";
  const canModify = schedule.status !== "ARCHIVED";

  // Stats
  const totalAssignments = schedule.assignments.length;
  const unassigned = schedule.assignments.filter((a) => !a.user).length;

  return (
    <div>
      <ConfirmDialog
        open={!!confirmAction}
        title={confirmAction?.title ?? ""}
        message={confirmAction?.message ?? ""}
        variant={confirmAction?.variant}
        confirmLabel="Sim, continuar"
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          if (confirmAction) {
            runAction(confirmAction.action, "Ação realizada com sucesso");
            setConfirmAction(null);
          }
        }}
      />

      {/* Header */}
      <div className="mb-5">
        <Link to="/escalas" className="text-sm text-muted-foreground hover:underline">&larr; Escalas</Link>
        <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold">{schedule.name}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {new Date(schedule.startDate).toLocaleDateString("pt-BR")} — {new Date(schedule.endDate).toLocaleDateString("pt-BR")}
              <span className={`ml-2 rounded px-2 py-0.5 text-xs font-medium ${
                schedule.status === "PUBLISHED" ? "bg-success/10 text-success"
                : schedule.status === "DRAFT" ? "bg-accent/20 text-accent-foreground"
                : "bg-muted text-muted-foreground"
              }`}>
                {schedule.status === "DRAFT" ? "Rascunho" : schedule.status === "PUBLISHED" ? "Publicada" : "Arquivada"}
              </span>
            </p>
          </div>
          {isCoord && (
            <div className="flex gap-2">
              {isDraft && (
                <button onClick={handlePublish} disabled={actionLoading} className="rounded-md bg-success px-4 py-2 text-sm font-medium text-white hover:bg-success/90 disabled:opacity-50 flex items-center gap-2">
                  {actionLoading && <Spinner size={14} />}
                  Publicar
                </button>
              )}
              {schedule.status === "PUBLISHED" && (
                <button onClick={handleArchive} disabled={actionLoading} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50">
                  Arquivar
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span>{byCelebration.size} celebraç{byCelebration.size === 1 ? "ão" : "ões"}</span>
        <span className="text-border">|</span>
        <span>{totalAssignments} atribuiç{totalAssignments === 1 ? "ão" : "ões"}</span>
        {unassigned > 0 && (
          <>
            <span className="text-border">|</span>
            <span className="text-amber-600 dark:text-amber-400">{unassigned} sem acólito</span>
          </>
        )}
      </div>

      {/* Public link */}
      {schedule.publicToken && (
        <div className="mb-4 rounded-md border border-border bg-muted/50 px-4 py-2 text-sm">
          Link público: <code className="rounded bg-muted px-1">/p/{schedule.publicToken}</code>
        </div>
      )}

      {/* Empty state */}
      {schedule.assignments.length === 0 && (
        <div className="rounded-lg bg-card p-8 border border-border text-center">
          <p className="text-sm text-muted-foreground">Nenhuma atribuição nesta escala.</p>
        </div>
      )}

      {/* Celebration cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        {[...byCelebration.values()].map(({ celebration, assignments }) => (
          <CelebrationCard
            key={celebration.id}
            celebration={celebration}
            assignments={assignments}
            servers={servers}
            allAssignments={schedule.assignments}
            allFunctions={allFunctions}
            scheduleId={schedule.id}
            canEdit={!!isCoord && canModify}
            onUpdated={fetchData}
            onRemove={handleRemoveAssignment}
          />
        ))}
      </div>
    </div>
  );
}
