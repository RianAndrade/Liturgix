import { useState, useEffect, useCallback } from "react";
import { api } from "@/shared/lib/api";
import { useToast } from "@/shared/components/ui/Toast";

type Role = "ACOLYTE" | "GUARDIAN" | "COORDINATOR" | "ADMIN";

const ROLE_LABELS: Record<Role, string> = {
  ACOLYTE: "Acólito",
  GUARDIAN: "Responsável",
  COORDINATOR: "Coordenador",
  ADMIN: "Administrador",
};

const ROLE_COLORS: Record<Role, string> = {
  ACOLYTE: "#8b1a1a",
  GUARDIAN: "#a67c52",
  COORDINATOR: "#3d5a6e",
  ADMIN: "#6e3044",
};

interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: string;
  serviceCount: number;
  guardianLinkCount: number;
  acolyteLinkCount: number;
}

interface Pagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

interface UsersResponse {
  success: boolean;
  data: User[];
  pagination: Pagination;
}

interface PatchResponse {
  success: boolean;
  data: { id: number; name: string; email: string; role: Role; active: boolean };
}

const PER_PAGE = 50;

export default function AdminUsuariosPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, perPage: PER_PAGE, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<Role | "">("");
  const [filterActive, setFilterActive] = useState<"" | "true" | "false">("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState<number | null>(null);

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("perPage", String(PER_PAGE));
      if (filterRole) params.set("role", filterRole);
      if (filterActive) params.set("active", filterActive);

      const res = await api<UsersResponse>(`/admin/users?${params.toString()}`);
      setUsers(res.data);
      setPagination(res.pagination);
    } catch {
      toast("Erro ao carregar usuários", "error");
    } finally {
      setLoading(false);
    }
  }, [filterRole, filterActive, toast]);

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  const handleRoleChange = async (user: User, newRole: Role) => {
    if (newRole === user.role) return;
    setUpdatingId(user.id);
    try {
      await api<PatchResponse>(`/admin/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole }),
      });
      toast(`Papel de ${user.name} alterado para ${ROLE_LABELS[newRole]}`, "success");
      await fetchUsers(pagination.page);
    } catch {
      toast("Erro ao alterar papel", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleActive = async (user: User) => {
    if (user.active && confirmDeactivate !== user.id) {
      setConfirmDeactivate(user.id);
      return;
    }
    setConfirmDeactivate(null);
    setUpdatingId(user.id);
    try {
      await api<PatchResponse>(`/admin/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !user.active }),
      });
      toast(
        user.active ? `${user.name} desativado` : `${user.name} reativado`,
        "success",
      );
      await fetchUsers(pagination.page);
    } catch {
      toast("Erro ao alterar status", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const selectClass =
    "rounded-md border border-border bg-card-inner px-2 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";

  return (
    <div>
      <div className="mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[3px] text-accent">
          ✦ Administração
        </p>
        <h1 className="mt-1 mb-6 font-serif text-[22px] font-medium text-foreground">
          Usuários
        </h1>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value as Role | "")}
          className={selectClass}
        >
          <option value="">Todos os papéis</option>
          {(Object.keys(ROLE_LABELS) as Role[]).map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </select>
        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value as "" | "true" | "false")}
          className={selectClass}
        >
          <option value="">Todos os status</option>
          <option value="true">Ativos</option>
          <option value="false">Inativos</option>
        </select>
        <span className="text-xs text-muted-foreground">
          {pagination.total} usuário{pagination.total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : users.length === 0 ? (
        <p className="text-muted-foreground">Nenhum usuário encontrado.</p>
      ) : (
        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Nome</th>
                <th className="px-4 py-2 text-left font-medium">Email</th>
                <th className="px-4 py-2 text-left font-medium">Papel</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
                <th className="px-4 py-2 text-left font-medium">Serviços</th>
                <th className="px-4 py-2 text-left font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-border last:border-b-0 transition-colors hover:bg-muted/50"
                >
                  <td className="px-4 py-2.5 font-medium text-foreground">
                    {user.name}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {user.email}
                  </td>
                  <td className="px-4 py-2.5">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user, e.target.value as Role)}
                      disabled={updatingId === user.id}
                      className="rounded-md border-none bg-transparent px-0 py-0 text-xs font-semibold outline-none focus:ring-2 focus:ring-ring"
                      style={{ color: ROLE_COLORS[user.role] }}
                    >
                      {(Object.keys(ROLE_LABELS) as Role[]).map((role) => (
                        <option key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-1.5 text-xs">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{
                          backgroundColor: user.active ? "#2a7a6f" : "#a0413c",
                        }}
                      />
                      {user.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {user.serviceCount}
                  </td>
                  <td className="px-4 py-2.5">
                    {confirmDeactivate === user.id ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Confirmar?</span>
                        <button
                          onClick={() => handleToggleActive(user)}
                          disabled={updatingId === user.id}
                          className="text-xs font-semibold hover:underline"
                          style={{ color: "#a0413c" }}
                        >
                          Sim
                        </button>
                        <button
                          onClick={() => setConfirmDeactivate(null)}
                          className="text-xs text-muted-foreground hover:underline"
                        >
                          Não
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleToggleActive(user)}
                        disabled={updatingId === user.id}
                        className="text-xs font-medium hover:underline"
                        style={{ color: user.active ? "#a0413c" : "#2a7a6f" }}
                      >
                        {user.active ? "Desativar" : "Ativar"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => fetchUsers(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="rounded-md border border-border px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-xs text-muted-foreground">
            Página {pagination.page} de {pagination.totalPages}
          </span>
          <button
            onClick={() => fetchUsers(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="rounded-md border border-border px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
