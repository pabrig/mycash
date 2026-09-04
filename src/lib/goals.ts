import type { Currency, WalletMode } from "./types";

/**
 * Dónde “vive” la meta respecto a la plata de la cuenta.
 * - disponible: Todo junto (un solo libre)
 * - diario: Dos lugares · bolsillo del día a día
 * - ahorro: Dos lugares · bolsillo ahorro (USD)
 */
export type GoalPlace = "disponible" | "diario" | "ahorro";

/** Meta de ahorro personal. Progreso = plata ya apartada. */
export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currency: Currency;
  /** Cuánto ya apartaste. */
  savedAmount: number;
  /** Cuánto pensás apartar cada mes (opcional). */
  monthlyPlan: number | null;
  /**
   * Si true y la meta puede reservar, el plan mensual se resta de “te queda libre”.
   * Metas de ahorro nunca reservan el libre del mes.
   */
  deductFromDisponible: boolean;
  /** Lugar de la meta (opción B). */
  place: GoalPlace;
  /** Fecha objetivo YYYY-MM-DD (opcional). */
  targetDate: string | null;
  createdAt: string;
  completedAt: string | null;
}

export type SavingsGoalDraft = {
  name: string;
  targetAmount: number;
  currency: Currency;
  savedAmount?: number;
  monthlyPlan?: number | null;
  deductFromDisponible?: boolean;
  place?: GoalPlace;
  targetDate?: string | null;
};

export function isGoalComplete(goal: SavingsGoal): boolean {
  if (goal.targetAmount <= 0) return false;
  return goal.savedAmount >= goal.targetAmount;
}

export function goalRemaining(goal: SavingsGoal): number {
  return Math.max(0, goal.targetAmount - goal.savedAmount);
}

export function goalProgressPercent(goal: SavingsGoal): number {
  if (goal.targetAmount <= 0) return 0;
  return Math.min(100, (goal.savedAmount / goal.targetAmount) * 100);
}

/** Solo Diario / disponible pueden restar del libre del mes. */
export function goalCanReserveDisponible(
  place: GoalPlace,
): boolean {
  return place === "disponible" || place === "diario";
}

/** ¿Esta meta resta del libre con su plan actual? */
export function goalReservesFromLibre(goal: SavingsGoal): boolean {
  return goal.deductFromDisponible && goalCanReserveDisponible(goal.place);
}

export function defaultGoalPlace(walletMode: WalletMode): GoalPlace {
  return walletMode === "split" ? "diario" : "disponible";
}

/** Lugares elegibles según cómo ve la plata la cuenta. */
export function goalPlaceOptions(walletMode: WalletMode): GoalPlace[] {
  return walletMode === "split" ? ["diario", "ahorro"] : ["disponible"];
}

/**
 * Normaliza un place guardado al modo actual de la cuenta.
 * Legacy `disponible` en Dos lugares → Diario.
 */
export function normalizeGoalPlace(
  place: GoalPlace | null | undefined,
  walletMode: WalletMode,
): GoalPlace {
  if (walletMode === "split") {
    if (place === "ahorro") return "ahorro";
    return "diario";
  }
  return "disponible";
}

export function parseGoalPlace(raw: unknown): GoalPlace {
  if (raw === "diario" || raw === "ahorro" || raw === "disponible") return raw;
  return "disponible";
}

/** Moneda sugerida al elegir el lugar (si la cuenta permite USD). */
export function suggestedCurrencyForPlace(
  place: GoalPlace,
  usdEnabled: boolean,
  current: Currency,
): Currency {
  if (!usdEnabled) return "ARS";
  if (place === "ahorro") return "USD";
  if (place === "diario") return "ARS";
  return current;
}

/** Meses enteros que faltan hasta la fecha (mínimo 1 si la fecha es futura). */
export function monthsUntilDate(
  targetDate: string,
  now: Date = new Date(),
): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(targetDate);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return null;

  const target = new Date(year, month - 1, day);
  if (Number.isNaN(target.getTime())) return null;
  if (target.getTime() <= now.getTime()) return null;

  const months =
    (target.getFullYear() - now.getFullYear()) * 12 +
    (target.getMonth() - now.getMonth());
  // Si todavía no llegó el día del mes, cuenta el mes actual como disponible
  const adjusted =
    now.getDate() > day ? Math.max(1, months) : Math.max(1, months + 1);
  return adjusted;
}

/** Cuánto apartar por mes para llegar a tiempo. */
export function suggestedMonthlyPlan(
  goal: Pick<SavingsGoal, "targetAmount" | "savedAmount" | "targetDate">,
  now: Date = new Date(),
): number | null {
  if (!goal.targetDate) return null;
  const months = monthsUntilDate(goal.targetDate, now);
  if (!months) return null;
  const remaining = Math.max(0, goal.targetAmount - goal.savedAmount);
  if (remaining <= 0) return null;
  return Math.ceil(remaining / months);
}

/** Plan del mes: el que eligió la persona, o el sugerido por la fecha. */
export function effectiveMonthlyPlan(
  goal: SavingsGoal,
  now: Date = new Date(),
): number {
  if (isGoalComplete(goal)) return 0;
  if (goal.monthlyPlan != null && goal.monthlyPlan > 0) return goal.monthlyPlan;
  return suggestedMonthlyPlan(goal, now) ?? 0;
}

/** Suma en ARS del plan de metas que reservan el libre este mes. */
export function totalMonthlyReserved(
  goals: SavingsGoal[],
  toArs: (amount: number, currency: Currency) => number,
  now: Date = new Date(),
): number {
  let total = 0;
  for (const goal of goals) {
    if (isGoalComplete(goal)) continue;
    if (!goalReservesFromLibre(goal)) continue;
    total += toArs(effectiveMonthlyPlan(goal, now), goal.currency);
  }
  return total;
}

/** Meses del año que aún cuentan (incluye el mes actual). */
export function remainingMonthsInYear(
  year: number,
  now: Date = new Date(),
): number {
  if (year < now.getFullYear()) return 0;
  if (year > now.getFullYear()) return 12;
  return 12 - now.getMonth();
}

/** Si mantenés el plan mensual el resto del año. */
export function projectedYearReserved(
  monthlyReservedArs: number,
  year: number,
  now: Date = new Date(),
): number {
  if (monthlyReservedArs <= 0) return 0;
  return monthlyReservedArs * remainingMonthsInYear(year, now);
}

/** Total ya juntado en metas (ARS). */
export function totalGoalsSavedArs(
  goals: SavingsGoal[],
  toArs: (amount: number, currency: Currency) => number,
): number {
  let total = 0;
  for (const goal of goals) {
    if (goal.savedAmount <= 0) continue;
    total += toArs(goal.savedAmount, goal.currency);
  }
  return total;
}

export function activeGoals(goals: SavingsGoal[]): SavingsGoal[] {
  return goals.filter((g) => !isGoalComplete(g));
}

export function completedGoals(goals: SavingsGoal[]): SavingsGoal[] {
  return goals.filter((g) => isGoalComplete(g));
}

export function createGoalId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function resolvePlaceAndDeduct(
  place: GoalPlace,
  deductFromDisponible: boolean | undefined,
): { place: GoalPlace; deductFromDisponible: boolean } {
  if (!goalCanReserveDisponible(place)) {
    return { place, deductFromDisponible: false };
  }
  return {
    place,
    deductFromDisponible: deductFromDisponible !== false,
  };
}

export function buildGoal(draft: SavingsGoalDraft, now = new Date()): SavingsGoal {
  const savedAmount = Math.max(0, draft.savedAmount ?? 0);
  const targetAmount = Math.max(0, draft.targetAmount);
  const targetDate = draft.targetDate?.trim() || null;
  let monthlyPlan =
    draft.monthlyPlan === undefined ? null : draft.monthlyPlan;

  if (monthlyPlan == null && targetDate) {
    monthlyPlan = suggestedMonthlyPlan(
      { targetAmount, savedAmount, targetDate },
      now,
    );
  }

  const place = draft.place ?? "disponible";
  const { deductFromDisponible } = resolvePlaceAndDeduct(
    place,
    draft.deductFromDisponible,
  );

  const goal: SavingsGoal = {
    id: createGoalId(),
    name: draft.name.trim() || "Mi meta",
    targetAmount,
    currency: draft.currency,
    savedAmount,
    monthlyPlan,
    deductFromDisponible,
    place,
    targetDate,
    createdAt: now.toISOString(),
    completedAt: null,
  };

  if (isGoalComplete(goal)) {
    goal.completedAt = now.toISOString();
  }

  return goal;
}

export function withContribution(
  goal: SavingsGoal,
  amount: number,
  now = new Date(),
): SavingsGoal {
  const savedAmount = Math.max(0, goal.savedAmount + amount);
  const next: SavingsGoal = {
    ...goal,
    savedAmount,
    completedAt:
      savedAmount >= goal.targetAmount && goal.targetAmount > 0
        ? goal.completedAt ?? now.toISOString()
        : null,
  };
  return next;
}

export function applyGoalPatch(
  goal: SavingsGoal,
  patch: Partial<SavingsGoalDraft>,
  now = new Date(),
): SavingsGoal {
  const place = patch.place ?? goal.place;
  const deductRaw =
    patch.deductFromDisponible !== undefined
      ? patch.deductFromDisponible
      : goal.deductFromDisponible;
  const { deductFromDisponible } = resolvePlaceAndDeduct(place, deductRaw);

  const next: SavingsGoal = {
    ...goal,
    name: patch.name !== undefined ? patch.name.trim() || goal.name : goal.name,
    targetAmount:
      patch.targetAmount !== undefined
        ? Math.max(0, patch.targetAmount)
        : goal.targetAmount,
    currency: patch.currency ?? goal.currency,
    savedAmount:
      patch.savedAmount !== undefined
        ? Math.max(0, patch.savedAmount)
        : goal.savedAmount,
    monthlyPlan:
      patch.monthlyPlan !== undefined ? patch.monthlyPlan : goal.monthlyPlan,
    deductFromDisponible,
    place,
    targetDate:
      patch.targetDate !== undefined
        ? patch.targetDate?.trim() || null
        : goal.targetDate,
  };

  if (
    patch.targetDate !== undefined &&
    patch.monthlyPlan === undefined &&
    next.monthlyPlan == null &&
    next.targetDate
  ) {
    next.monthlyPlan = suggestedMonthlyPlan(next, now);
  }

  if (isGoalComplete(next)) {
    next.completedAt = next.completedAt ?? now.toISOString();
  } else {
    next.completedAt = null;
  }

  return next;
}
