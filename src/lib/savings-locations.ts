/**
 * Lugares donde “vive” el Ahorro USD (composición informativa).
 * El total de Ahorro sigue saliendo de movimientos; esto solo explica dónde está.
 */

export interface SavingsLocation {
  id: string;
  name: string;
  /** Monto en USD (misma moneda que el bolsillo Ahorro). */
  amount: number;
  sortOrder: number;
  updatedAt: string;
}

export type SavingsLocationDraft = {
  name: string;
  amount: number;
};

export function createLocationId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function buildLocation(
  draft: SavingsLocationDraft,
  sortOrder: number,
  now = new Date(),
): SavingsLocation {
  const name = draft.name.trim() || "Lugar";
  const amount = Math.max(0, draft.amount);
  return {
    id: createLocationId(),
    name,
    amount,
    sortOrder,
    updatedAt: now.toISOString(),
  };
}

export function applyLocationPatch(
  location: SavingsLocation,
  patch: Partial<SavingsLocationDraft>,
  now = new Date(),
): SavingsLocation {
  const name =
    patch.name !== undefined
      ? patch.name.trim() || location.name
      : location.name;
  const amount =
    patch.amount !== undefined
      ? Math.max(0, patch.amount)
      : location.amount;
  return {
    ...location,
    name,
    amount,
    updatedAt: now.toISOString(),
  };
}

export function sortedLocations(
  locations: SavingsLocation[],
): SavingsLocation[] {
  return [...locations].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.name.localeCompare(b.name, "es");
  });
}

export function sumLocations(locations: SavingsLocation[]): number {
  return locations.reduce((acc, loc) => acc + loc.amount, 0);
}

/** Porcentaje del total Ahorro (0–100). Si total ≤ 0, 0. */
export function locationSharePercent(
  amount: number,
  ahorroTotal: number,
): number {
  if (!(ahorroTotal > 0) || !(amount > 0)) return 0;
  return Math.min(100, (amount / ahorroTotal) * 100);
}

/**
 * Diferencia suma de lugares − total Ahorro.
 * Positivo = sobra en lugares; negativo = falta.
 */
export function locationsGap(
  locations: SavingsLocation[],
  ahorroTotal: number,
): number {
  return sumLocations(locations) - ahorroTotal;
}
