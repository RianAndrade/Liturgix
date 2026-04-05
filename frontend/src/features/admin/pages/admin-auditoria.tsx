import { useState, useEffect, useCallback } from "react";
import { api } from "@/shared/lib/api";

interface AuditEntry {
  id: number;
  scheduleId: number;
  action: string;
  details: Record<string, unknown> | null;
  createdAt: string;
  schedule: { id: number; name: string };
  performedBy: { id: number; name: string };
}

interface AuditResponse {
  success: boolean;
  data: AuditEntry[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

const ACTION_OPTIONS = [
  { value: "", label: "Todas as ações" },
  { value: "GENERATE", label: "Geração" },
  { value: "PUBLISH", label: "Publicação" },
  { value: "EDIT", label: "Edição" },
  { value: "ASSIGN", label: "Atribuição" },
  { value: "UNASSIGN", label: "Remoção" },
  { value: "LOCK", label: "Travamento" },
  { value: "UNLOCK", label: "Destravamento" },
];

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export default function AdminAuditoriaPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const perPage = 50;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), perPage: String(perPage) });
      if (actionFilter) params.set("action", actionFilter);
      const res = await api<AuditResponse>(`/admin/audit-log?${params.toString()}`);
      setEntries(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotal(res.pagination.total);
    } catch {
      setEntries([]);
      setTotalPages(1);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleActionChange = (value: string) => {
    setActionFilter(value);
    setPage(1);
  };

  const toggleDetails = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div>
      <div className="mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[3px] text-accent">
          ✦ Auditoria
        </p>
        <h1 className="mt-1 mb-6 font-serif text-[22px] font-medium text-foreground">
          Registro de Atividades
        </h1>
      </div>

      {/* Filter */}
      <div className="mb-4 flex items-center gap-3">
        <label className="text-[11px] font-semibold uppercase tracking-[1.5px] text-accent">
          Filtrar ação
        </label>
        <select
          value={actionFilter}
          onChange={(e) => handleActionChange(e.target.value)}
          className="rounded-lg border border-border bg-card-inner px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
        >
          {ACTION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {total > 0 && (
          <span className="text-xs text-muted-foreground">
            {total} registro{total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : entries.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">Nenhum registro encontrado.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Data
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Escala
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Ação
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Executado por
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Detalhes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.map((entry) => (
                <tr key={entry.id} className="transition-colors hover:bg-muted/40">
                  <td className="whitespace-nowrap px-4 py-3 text-foreground">
                    {dateFormatter.format(new Date(entry.createdAt))}
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {entry.schedule?.name ?? `#${entry.scheduleId}`}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold text-foreground">
                      {entry.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {entry.performedBy?.name ?? "Sistema"}
                  </td>
                  <td className="px-4 py-3">
                    {entry.details ? (
                      <div>
                        <button
                          onClick={() => toggleDetails(entry.id)}
                          className="text-xs font-medium text-accent hover:underline"
                        >
                          {expandedId === entry.id ? "Ocultar" : "Ver detalhes"}
                        </button>
                        {expandedId === entry.id && (
                          <pre className="mt-2 max-h-48 overflow-auto rounded-md bg-muted p-3 text-[11px] leading-relaxed text-muted-foreground">
                            {JSON.stringify(entry.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">--</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-border px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-border px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
