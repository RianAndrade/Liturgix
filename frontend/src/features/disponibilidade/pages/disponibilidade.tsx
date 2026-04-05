import { useState, useEffect, useCallback } from "react";
import { api } from "@/shared/lib/api";
import { useAuth } from "@/features/auth/auth";
import type { Period } from "@/shared/types";
import { getFunctionColor } from "@/shared/lib/function-colors";
import { ChevronLeft, ChevronRight, Calendar, Bookmark, Save, Check } from "lucide-react";
import { useToast } from "@/shared/components/ui/Toast";

interface LiturgicalFn {
  id: number;
  name: string;
  displayOrder: number;
}

export default function DisponibilidadePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [unavailDates, setUnavailDates] = useState<Map<string, Period>>(new Map());
  const [savedUnavailDates, setSavedUnavailDates] = useState<Map<string, Period>>(new Map());
  const [saving, setSaving] = useState(false);

  const [allFunctions, setAllFunctions] = useState<LiturgicalFn[]>([]);
  const [selectedFnIds, setSelectedFnIds] = useState<Set<number>>(new Set());
  const [savedFnIds, setSavedFnIds] = useState<Set<number>>(new Set());
  const [savingFns, setSavingFns] = useState(false);

  const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${lastDay}`;

  useEffect(() => {
    if (!user) return;
    api<{ data: { date: string; period: Period }[] }>(`/servers/${user.id}/availability?startDate=${startDate}&endDate=${endDate}`)
      .then((r) => {
        const dates = new Map(r.data.map((d) => [d.date.slice(0, 10), d.period] as [string, Period]));
        setUnavailDates(dates);
        setSavedUnavailDates(new Map(dates));
      });
  }, [user, month, year]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api<{ data: LiturgicalFn[] }>("/functions"),
      api<{ data: LiturgicalFn[] }>(`/servers/${user.id}/functions`),
    ]).then(([all, mine]) => {
      setAllFunctions(all.data);
      const myIds = new Set(mine.data.map((f) => f.id));
      setSelectedFnIds(myIds);
      setSavedFnIds(new Set(myIds));
    });
  }, [user]);

  const toggleFn = (id: number) => {
    setSelectedFnIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Cycle: available -> ALL_DAY -> MORNING_ONLY -> NIGHT_ONLY -> available
  const cycleDate = (dateStr: string) => {
    setUnavailDates((prev) => {
      const next = new Map(prev);
      const current = next.get(dateStr);
      if (!current) {
        next.set(dateStr, "ALL_DAY");
      } else if (current === "ALL_DAY") {
        next.set(dateStr, "MORNING_ONLY");
      } else if (current === "MORNING_ONLY") {
        next.set(dateStr, "NIGHT_ONLY");
      } else {
        next.delete(dateStr);
      }
      return next;
    });
  };

  const saveAll = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    setSavingFns(true);
    try {
      await Promise.all([
        api(`/servers/${user.id}/availability`, {
          method: "PUT",
          body: JSON.stringify({
            startDate,
            endDate,
            dates: Array.from(unavailDates.entries()).map(([date, period]) => ({ date, period })),
          }),
        }),
        api(`/servers/${user.id}/functions`, {
          method: "PUT",
          body: JSON.stringify({ functionIds: Array.from(selectedFnIds) }),
        }),
      ]);
      setSavedUnavailDates(new Map(unavailDates));
      setSavedFnIds(new Set(selectedFnIds));
      toast("Alterações salvas");
    } catch {
      toast("Erro ao salvar alterações", "error");
    }
    setSaving(false);
    setSavingFns(false);
  }, [user, startDate, endDate, unavailDates, selectedFnIds, toast]);

  const changeMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setMonth(m);
    setYear(y);
  };

  const calendarDirty = (() => {
    if (unavailDates.size !== savedUnavailDates.size) return true;
    for (const [d, p] of unavailDates) {
      if (savedUnavailDates.get(d) !== p) return true;
    }
    for (const d of savedUnavailDates.keys()) {
      if (!unavailDates.has(d)) return true;
    }
    return false;
  })();

  const fnDirty = (() => {
    if (selectedFnIds.size !== savedFnIds.size) return true;
    for (const id of selectedFnIds) if (!savedFnIds.has(id)) return true;
    return false;
  })();

  const anyDirty = calendarDirty || fnDirty;

  const monthName = new Date(year, month).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const days = Array.from({ length: lastDay }, (_, i) => i + 1);
  const today = new Date().toISOString().slice(0, 10);

  // Pad trailing days to fill last row
  const totalCells = firstDayOfWeek + lastDay;
  const trailingEmpty = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);

  const allDayCount = Array.from(unavailDates.values()).filter((p) => p === "ALL_DAY").length;
  const morningCount = Array.from(unavailDates.values()).filter((p) => p === "MORNING_ONLY").length;
  const nightCount = Array.from(unavailDates.values()).filter((p) => p === "NIGHT_ONLY").length;
  const availCount = lastDay - unavailDates.size;

  return (
    <div className="flex min-h-full w-full flex-col pb-16">
      {/* Page header */}
      <div className="mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[3px] text-accent">
          ✦ Disponibilidade
        </p>
        <h1 className="mt-1 font-serif text-2xl font-bold">
          Gerencie sua agenda
        </h1>
        <p className="mt-1 text-sm text-foreground/70">
          Marque os dias em que você <strong>não</strong> estará disponível e selecione suas funções.
        </p>
      </div>

      {/* Main content */}
      <div className="grid flex-1 gap-5 lg:grid-cols-[1fr_300px]">

        {/* Calendar card */}
        <div className="rounded-xl border border-border bg-card p-4">
          {/* Month navigation — centered */}
          <div className="mb-3 flex items-center justify-center gap-2">
            <button
              onClick={() => changeMonth(-1)}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card-inner text-foreground transition-colors hover:border-accent hover:text-accent active:scale-95"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="min-w-[140px] text-center font-serif text-sm font-semibold capitalize">
              {monthName}
            </span>
            <button
              onClick={() => changeMonth(1)}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card-inner text-foreground transition-colors hover:border-accent hover:text-accent active:scale-95"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Legend bar */}
          <div className="mb-2.5 flex items-center gap-4 rounded-md border border-border bg-card-inner px-3 py-1.5 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <span className="inline-block h-3 w-3 rounded border border-border bg-card" /> Disponível
            </span>
            <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <span className="inline-block h-3 w-3 rounded bg-[#8b1a1a]" /> Indisponível
            </span>
            <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <span className="inline-block h-3 w-3 rounded bg-[#f5c542]" /> Só manhã
            </span>
            <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <span className="inline-block h-3 w-3 rounded bg-[#3b5998]" /> Só noite
            </span>
            {calendarDirty && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-600">
                <span className="inline-block h-3 w-3 rounded bg-amber-500/25 ring-2 ring-amber-500" /> Não salvo
              </span>
            )}
          </div>

          {/* Weekday headers */}
          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wider text-foreground/50">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
              <div key={d} className="py-1">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`e-${i}`} className="h-12 rounded-md bg-card-inner/50" />
            ))}
            {days.map((day) => {
                const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const period = unavailDates.get(dateStr);
                const savedPeriod = savedUnavailDates.get(dateStr);
                const isModified = period !== savedPeriod;
                const isPast = dateStr < today;
                const isToday = dateStr === today;

                const bgColor = !period
                  ? ""
                  : period === "ALL_DAY"
                    ? "bg-[#8b1a1a] text-white"
                    : period === "MORNING_ONLY"
                      ? "bg-[#f5c542] text-[#5a4a3a]"
                      : "bg-[#3b5998] text-white";

                const modifiedRing = isModified
                  ? "ring-2 ring-amber-500 ring-offset-1 ring-offset-card"
                  : "";

                return (
                  <button
                    key={day}
                    onClick={() => !isPast && cycleDate(dateStr)}
                    disabled={isPast}
                    className={`relative flex h-12 items-center justify-center rounded-md text-[13px] font-medium transition-all ${
                      isPast
                        ? "cursor-default text-foreground/20"
                        : period
                          ? `${bgColor} shadow-sm hover:opacity-90 active:scale-95 ${modifiedRing}`
                          : `border border-border bg-card-inner text-foreground hover:border-accent/40 hover:bg-card active:scale-95 ${modifiedRing}`
                    } ${isToday && !isPast ? "font-bold ring-1 ring-accent/50" : ""}`}
                  >
                    {day}
                  </button>
                );
              })}
            {Array.from({ length: trailingEmpty }).map((_, i) => (
              <div key={`t-${i}`} className="h-12 rounded-md bg-card-inner/50" />
            ))}
          </div>

          {/* Summary */}
          <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5">
            <div className="flex gap-3 text-xs font-semibold flex-wrap">
              <span className="text-success">{availCount} disponíveis</span>
              <span className="text-[#8b1a1a]">{allDayCount} indisponíveis</span>
              {morningCount > 0 && <span className="text-[#b8960a]">{morningCount} manhã</span>}
              {nightCount > 0 && <span className="text-[#3b5998]">{nightCount} noite</span>}
            </div>
            {calendarDirty && (
              <span className="text-xs font-semibold text-amber-600">
                Pendente
              </span>
            )}
          </div>
        </div>

        {/* Right column: Functions */}
        <div className="flex flex-col gap-6">
          {allFunctions.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="mb-1 flex items-center gap-2">
                <Bookmark size={14} className="text-accent" />
                <h2 className="font-serif text-sm font-semibold">Minhas Funções</h2>
              </div>
              <p className="mb-2.5 text-xs text-foreground/60">
                Funções que você pode exercer.
              </p>

              <div className="flex flex-col gap-1">
                {allFunctions.map((fn) => {
                  const selected = selectedFnIds.has(fn.id);
                  const wasSaved = savedFnIds.has(fn.id);
                  const isModified = selected !== wasSaved;
                  const color = getFunctionColor(fn.name);
                  return (
                    <button
                      key={fn.id}
                      onClick={() => toggleFn(fn.id)}
                      className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-all active:scale-[0.98] ${
                        selected
                          ? "border border-transparent bg-card-inner font-medium text-foreground"
                          : "border border-transparent text-foreground/60 hover:bg-card-inner/60"
                      } ${isModified ? "ring-1 ring-amber-500/60" : ""}`}
                    >
                      {/* Color dot + checkbox */}
                      <span
                        className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded"
                        style={{ backgroundColor: color }}
                      >
                        {selected && <Check size={10} className="text-white" strokeWidth={3} />}
                      </span>
                      <span>{fn.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Functions summary */}
              <div className="mt-3 border-t border-border pt-2.5 text-[13px] font-medium text-foreground/50">
                {selectedFnIds.size} de {allFunctions.length} selecionadas
                {fnDirty && (
                  <span className="ml-1 font-semibold text-amber-600">
                    — pendente
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed save bar */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-30 border-t px-6 py-3 transition-all lg:left-56 ${
          anyDirty
            ? "border-amber-500/30 bg-card shadow-[0_-4px_20px_rgba(0,0,0,0.1)]"
            : "border-border bg-card/80 backdrop-blur-sm"
        }`}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className={`text-[13px] font-medium ${anyDirty ? "text-amber-600" : "text-foreground/40"}`}>
            {anyDirty ? "Você tem alterações não salvas" : "Tudo salvo"}
          </span>
          <button
            onClick={saveAll}
            disabled={!anyDirty || saving || savingFns}
            className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition-all disabled:opacity-40 ${
              anyDirty
                ? "text-[#f3ece0] shadow-md hover:shadow-lg active:scale-95"
                : "text-[#f3ece0]"
            }`}
            style={{ background: "linear-gradient(135deg, #7a2e1a, #a0413c)" }}
          >
            <Save size={15} />
            {saving || savingFns ? "Salvando..." : anyDirty ? "Salvar tudo" : "Salvo"}
          </button>
        </div>
      </div>
    </div>
  );
}
