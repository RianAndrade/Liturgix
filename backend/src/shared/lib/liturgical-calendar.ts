import { redis } from "./redis.js";

export type LiturgicalColorValue = "GREEN" | "WHITE" | "RED" | "PURPLE" | "ROSE" | "BLACK";

interface LitCalEvent {
  date: string;
  color: string[];
  grade: number;
  name: string;
  liturgical_season: string;
}

interface LitCalResponse {
  litcal: LitCalEvent[];
}

const LITCAL_BASE = "https://litcal.johnromanodorazio.com/api/dev/calendar";
const CACHE_TTL = 60 * 60 * 24 * 7; // 7 dias
const COLOR_MAP: Record<string, LiturgicalColorValue> = {
  green: "GREEN",
  white: "WHITE",
  red: "RED",
  purple: "PURPLE",
  rose: "ROSE",
  black: "BLACK",
};

function cacheKey(year: number): string {
  return `litcal:${year}`;
}

/** Busca o calendário litúrgico de um ano inteiro e cacheia no Redis. */
async function fetchYear(year: number): Promise<Map<string, LiturgicalColorValue>> {
  const cached = await redis.get(cacheKey(year));
  if (cached) {
    return new Map(JSON.parse(cached));
  }

  const url = `${LITCAL_BASE}?year=${year}&locale=en`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    throw new Error(`LitCal API error: ${res.status}`);
  }

  const data = (await res.json()) as LitCalResponse;
  const colorsByDate = new Map<string, LiturgicalColorValue>();

  // litcal é um array; agrupa por data e pega o de maior grade (precedência)
  const events: LitCalEvent[] = Array.isArray(data.litcal) ? data.litcal : Object.values(data.litcal);
  const byDate = new Map<string, LitCalEvent>();
  for (const event of events) {
    const dateKey = event.date.slice(0, 10); // "YYYY-MM-DD"
    const existing = byDate.get(dateKey);
    if (!existing || event.grade > existing.grade) {
      byDate.set(dateKey, event);
    }
  }

  for (const [dateKey, event] of byDate) {
    const apiColor = event.color[0];
    const mapped = COLOR_MAP[apiColor];
    if (mapped) {
      colorsByDate.set(dateKey, mapped);
    }
  }

  await redis.set(cacheKey(year), JSON.stringify([...colorsByDate]), "EX", CACHE_TTL);
  return colorsByDate;
}

/**
 * Retorna a cor litúrgica para uma data específica.
 * Retorna null se a API estiver indisponível (falha silenciosa).
 */
export async function getLiturgicalColor(date: Date): Promise<LiturgicalColorValue | null> {
  try {
    const civilYear = date.getFullYear();
    const key = date.toISOString().slice(0, 10);

    // O ano litúrgico começa no Advento (~final de novembro do ano anterior).
    // Para cobrir datas no início e no fim do ano civil, busca os dois anos litúrgicos possíveis.
    const colors = await fetchYear(civilYear);
    if (colors.has(key)) return colors.get(key)!;

    const colorsNext = await fetchYear(civilYear + 1);
    return colorsNext.get(key) ?? null;
  } catch {
    return null;
  }
}

/**
 * Retorna cores litúrgicas para múltiplas datas (batch).
 * Útil para listagens de celebrações.
 */
export async function getLiturgicalColors(
  dates: Date[],
): Promise<Map<string, LiturgicalColorValue>> {
  const result = new Map<string, LiturgicalColorValue>();
  const years = new Set(dates.map((d) => d.getFullYear()));

  try {
    const yearMaps = await Promise.all([...years].map(fetchYear));
    const merged = new Map<string, LiturgicalColorValue>();
    for (const m of yearMaps) {
      for (const [k, v] of m) merged.set(k, v);
    }

    for (const date of dates) {
      const key = date.toISOString().slice(0, 10);
      const color = merged.get(key);
      if (color) result.set(key, color);
    }
  } catch {
    // falha silenciosa — retorna o que conseguiu
  }

  return result;
}
