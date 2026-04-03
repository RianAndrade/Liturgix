import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/features/auth/auth";
import { AuthLayout } from "@/features/auth/AuthLayout";

export default function LoginPage() {
  const { user, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/painel" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch {
      setError("Credenciais inválidas");
    } finally {
      setLoading(false);
    }
  };

  const labelClass = "mb-1.5 block text-[11px] font-semibold uppercase tracking-[1.5px]";
  const inputClass = "w-full rounded-lg px-3 py-2.5 text-[13px] outline-none";

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <p className="rounded-lg px-3 py-2 text-sm" style={{ background: "#a0413c20", color: "#a0413c" }}>
            {error}
          </p>
        )}

        <div>
          <label className={labelClass} style={{ color: "#c99560" }}>E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="seu@email.com"
            className={inputClass}
            style={{ background: "#3d2b1f", border: "1px solid #5a4636", color: "#f0e6d8" }}
          />
        </div>

        <div>
          <label className={labelClass} style={{ color: "#c99560" }}>Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className={inputClass}
            style={{ background: "#3d2b1f", border: "1px solid #5a4636", color: "#f0e6d8" }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #7a2e1a, #a0413c)", color: "#f3ece0" }}
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="mt-3 text-center text-xs" style={{ color: "#9a8568" }}>
        Não tem conta?{" "}
        <Link to="/cadastro" className="font-medium" style={{ color: "#c99560" }}>
          Cadastre-se
        </Link>
      </p>
    </AuthLayout>
  );
}
