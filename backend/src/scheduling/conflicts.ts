import type { Acolyte, CelebrationSlot, Conflict, ConflictType, UnavailableDate } from "./types.js";

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function detectConflict(
  slot: CelebrationSlot,
  acolytes: Acolyte[],
  unavailabilities: UnavailableDate[],
  qualifiedCount: number,
  availableCount: number,
  timeExcludedCount: number = 0,
): Conflict | null {
  const dateStr = toDateStr(slot.celebrationDate);

  // No one qualified at all for this function
  if (qualifiedCount === 0) {
    return {
      celebrationId: slot.celebrationId,
      celebrationName: slot.celebrationName,
      functionId: slot.functionId,
      functionName: slot.functionName,
      type: "QUALIFICATION_GAP",
      description: `Nenhum acólito qualificado para ${slot.functionName}`,
      suggestedAction: "Habilite acólitos para esta função",
    };
  }

  // All qualified excluded by time preference (not fully unavailable)
  if (availableCount === 0 && timeExcludedCount > 0 && timeExcludedCount === qualifiedCount) {
    return {
      celebrationId: slot.celebrationId,
      celebrationName: slot.celebrationName,
      functionId: slot.functionId,
      functionName: slot.functionName,
      type: "TIME_PREFERENCE_EXCLUDED",
      description: `Todos os acólitos qualificados estão disponíveis apenas em outro turno`,
      suggestedAction: "Considere ajustar o horário da celebração ou atribuir manualmente",
    };
  }

  // All qualified are unavailable
  if (availableCount === 0) {
    return {
      celebrationId: slot.celebrationId,
      celebrationName: slot.celebrationName,
      functionId: slot.functionId,
      functionName: slot.functionName,
      type: "ALL_UNAVAILABLE",
      description: `Todos os ${qualifiedCount} acólitos qualificados estão indisponíveis em ${dateStr}`,
      suggestedAction: "Verifique disponibilidades para esta data",
    };
  }

  // Insufficient candidates
  if (availableCount < slot.quantity) {
    return {
      celebrationId: slot.celebrationId,
      celebrationName: slot.celebrationName,
      functionId: slot.functionId,
      functionName: slot.functionName,
      type: "INSUFFICIENT_CANDIDATES",
      description: `${availableCount} disponível(is) para ${slot.quantity} vaga(s) de ${slot.functionName}`,
      suggestedAction: "Habilite mais acólitos ou ajuste os requisitos",
    };
  }

  // Single candidate overload
  if (availableCount === 1) {
    return {
      celebrationId: slot.celebrationId,
      celebrationName: slot.celebrationName,
      functionId: slot.functionId,
      functionName: slot.functionName,
      type: "OVERLOAD_SINGLE_CANDIDATE",
      description: `Apenas 1 acólito disponível para ${slot.functionName}`,
      suggestedAction: "Habilite mais acólitos para distribuir melhor",
    };
  }

  return null;
}
