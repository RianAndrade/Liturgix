import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/shared/lib/theme";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const next = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;
  const label = theme === "light" ? "Claro" : theme === "dark" ? "Escuro" : "Sistema";

  return (
    <button
      onClick={next}
      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors hover:opacity-80"
      style={{ color: "#7a5c3a" }}
      title={`Tema: ${label}`}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}
