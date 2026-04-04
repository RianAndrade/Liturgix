import { useAuth } from "@/features/auth/auth";

export default function PainelPage() {
  const { user } = useAuth();

  const summaryCards = [
    {
      label: "Próxima escala",
      value: "—",
      detail: "Nenhuma agendada",
      borderColor: "#8b1a1a",
    },
    {
      label: "Este mês",
      value: "0",
      detail: "celebrações",
      borderColor: "#b8944e",
    },
    {
      label: "Suas funções",
      value: user?.functions?.length ?? 0,
      detail: user?.functions?.map((f: any) => f.name).join(" · ") || "Nenhuma",
      borderColor: "#5c6b4e",
    },
  ];

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[3px] text-accent">
        ✦ Painel
      </p>
      <h1 className="mt-1 font-serif text-[22px] font-medium text-foreground">
        Bem-vindo, {user?.name?.split(" ")[0]}
      </h1>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-lg bg-card p-4"
            style={{ borderLeft: `3px solid ${card.borderColor}` }}
          >
            <p className="text-[10px] font-medium uppercase tracking-[1px] text-muted-foreground">
              {card.label}
            </p>
            <p className="mt-1 text-xl font-bold text-foreground">{card.value}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{card.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
