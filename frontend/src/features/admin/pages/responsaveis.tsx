import { useState, useEffect, useCallback } from "react";
import { api } from "@/shared/lib/api";
import { PageLoading } from "@/shared/components/ui/Spinner";
import { PageError } from "@/shared/components/ui/PageError";
import { useToast } from "@/shared/components/ui/Toast";

interface LinkedAcolyte {
  linkId: number;
  id: number;
  name: string;
  email: string;
}

interface Guardian {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  acolytes: LinkedAcolyte[];
}

interface UnlinkedAcolyte {
  id: number;
  name: string;
  email: string;
}

export default function ResponsaveisPage() {
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [unlinked, setUnlinked] = useState<UnlinkedAcolyte[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [linkingId, setLinkingId] = useState<number | null>(null);
  const [selectedAcolyteId, setSelectedAcolyteId] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      const [gRes, uRes] = await Promise.all([
        api<{ success: boolean; data: Guardian[] }>("/guardians"),
        api<{ success: boolean; data: UnlinkedAcolyte[] }>("/guardians/unlinked-acolytes"),
      ]);
      setGuardians(gRes.data);
      setUnlinked(uRes.data);
    } catch {
      toast("Erro ao carregar responsáveis", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLink = async (guardianId: number) => {
    if (!selectedAcolyteId) return;
    setSubmitting(true);
    try {
      await api(`/guardians/${guardianId}/link`, {
        method: "POST",
        body: JSON.stringify({ acolyteId: selectedAcolyteId }),
      });
      toast("Acólito vinculado com sucesso", "success");
      setLinkingId(null);
      setSelectedAcolyteId("");
      await fetchData();
    } catch {
      toast("Erro ao vincular acólito", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnlink = async (guardianId: number, linkId: number) => {
    setSubmitting(true);
    try {
      await api(`/guardians/${guardianId}/link/${linkId}`, {
        method: "DELETE",
      });
      toast("Vínculo removido com sucesso", "success");
      await fetchData();
    } catch {
      toast("Erro ao remover vínculo", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
    setLinkingId(null);
    setSelectedAcolyteId("");
  };

  if (loading) return <PageLoading />;

  return (
    <div>
      <div className="mb-5">
        <p className="text-[10px] font-semibold uppercase tracking-[3px] text-accent">
          ✦ Administração
        </p>
        <h1 className="mt-1 mb-6 font-serif text-[22px] font-medium text-foreground">
          Responsáveis
        </h1>
        <p className="text-sm text-muted-foreground">
          Gerencie vínculos entre responsáveis e acólitos menores.
        </p>
      </div>

      {guardians.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum responsável cadastrado ainda.
          </p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Responsáveis aparecem aqui quando um usuário com papel de responsável é registrado.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {guardians.map((g) => {
            const isExpanded = expandedId === g.id;
            const isLinking = linkingId === g.id;

            return (
              <div
                key={g.id}
                className="rounded-lg border border-border bg-card"
                style={{ borderLeftWidth: 3, borderLeftColor: "#a67c52" }}
              >
                {/* Guardian header */}
                <button
                  type="button"
                  className="flex w-full items-center gap-3 p-4 text-left"
                  onClick={() => toggleExpand(g.id)}
                >
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                    style={{ background: "#a67c52", color: "#f3ece0" }}
                  >
                    {g.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {g.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {g.email}
                    </p>
                  </div>
                  <span
                    className="rounded-md px-2 py-0.5 text-[10px] font-semibold"
                    style={{ background: "rgba(166,124,82,0.12)", color: "#a67c52" }}
                  >
                    {g.acolytes.length} {g.acolytes.length === 1 ? "acólito" : "acólitos"}
                  </span>
                  <svg
                    className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-border px-4 pb-4 pt-3">
                    {g.acolytes.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">
                        Nenhum acólito vinculado.
                      </p>
                    ) : (
                      <div className="overflow-hidden rounded-md border border-border mb-3">
                        <table className="w-full text-sm">
                          <thead className="border-b border-border bg-muted">
                            <tr>
                              <th className="px-3 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                Nome
                              </th>
                              <th className="px-3 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                Email
                              </th>
                              <th className="px-3 py-1.5 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                Ação
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {g.acolytes.map((a) => (
                              <tr key={a.linkId} className="border-b border-border last:border-0">
                                <td className="px-3 py-2 font-medium text-foreground">
                                  {a.name}
                                </td>
                                <td className="px-3 py-2 text-muted-foreground">
                                  {a.email}
                                </td>
                                <td className="px-3 py-2 text-right">
                                  <button
                                    onClick={() => handleUnlink(g.id, a.linkId)}
                                    disabled={submitting}
                                    className="text-xs text-destructive hover:underline disabled:opacity-50"
                                  >
                                    Desvincular
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Link acolyte controls */}
                    {isLinking ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedAcolyteId}
                          onChange={(e) =>
                            setSelectedAcolyteId(
                              e.target.value ? Number(e.target.value) : ""
                            )
                          }
                          className="flex-1 rounded-lg border border-border bg-card-inner px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                        >
                          <option value="">Selecione um acólito...</option>
                          {unlinked.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name} ({a.email})
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleLink(g.id)}
                          disabled={!selectedAcolyteId || submitting}
                          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50"
                        >
                          Vincular
                        </button>
                        <button
                          onClick={() => {
                            setLinkingId(null);
                            setSelectedAcolyteId("");
                          }}
                          className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setLinkingId(g.id)}
                        disabled={unlinked.length === 0}
                        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50"
                      >
                        Vincular Acólito
                      </button>
                    )}

                    {unlinked.length === 0 && !isLinking && (
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        Todos os acólitos já estão vinculados.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
