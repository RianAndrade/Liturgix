export const FUNCTION_COLORS: Record<string, string> = {
  "Cruciferário": "#8b1a1a",
  "Ceroferário": "#c99560",
  "Turiferário": "#7a5c3a",
  "Naveteiro": "#a67c52",
  "Acólito do Missal": "#6b4226",
  "Acólito das Galhetas": "#6e3044",
  "Acólito da Credência": "#5c6b4e",
  "Acólito da Patena": "#b8944e",
  "Cerimoniário": "#3d5a6e",
};

export function getFunctionColor(name: string): string {
  return FUNCTION_COLORS[name] ?? "#9a8568";
}
