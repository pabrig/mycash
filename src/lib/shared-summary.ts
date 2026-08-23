import { toArs, toUsd } from "./currency";
import { filterByMonth, getRateForMonth } from "./summary";
import type {
  MonthlyRate,
  Movement,
  SharedMonthSnapshot,
  SharedPeriodSummary,
} from "./types";

/** Gastos del grupo activo. Sin nube o sin grupo, se muestran todos los shared. */
export function householdSharedMovements(
  movements: Movement[],
  householdId: string | null | undefined,
  cloudEnabled: boolean,
): Movement[] {
  if (!cloudEnabled || !householdId) return movements;
  return movements.filter(
    (m) => !m.householdId || m.householdId === householdId,
  );
}

function categoryId(movement: Movement): string {
  const id = movement.category?.trim();
  return id || "otros";
}

/** Totales del periodo en ARS y USD. Cada movimiento usa el TC de su mes. */
export function computeSharedPeriodSummary(
  movements: Movement[],
  rates: MonthlyRate[],
): SharedPeriodSummary {
  const byCategory = new Map<
    string,
    { ars: number; usd: number; count: number }
  >();
  let totalArs = 0;
  let totalUsd = 0;
  let movementCount = 0;
  const months = new Set<string>();

  for (const m of movements) {
    if (m.type !== "expense") continue;
    movementCount += 1;
    const [year, month] = m.date.split("-").map(Number);
    months.add(`${year}-${month}`);
    const rate = getRateForMonth(rates, year, month);
    const ars = toArs(m.amount, m.currency, rate);
    const usd = toUsd(m.amount, m.currency, rate);
    const category = categoryId(m);
    const prev = byCategory.get(category) ?? { ars: 0, usd: 0, count: 0 };
    prev.ars += ars;
    prev.usd += usd;
    prev.count += 1;
    byCategory.set(category, prev);
    totalArs += ars;
    totalUsd += usd;
  }

  const categories = [...byCategory.entries()]
    .map(([category, slice]) => ({
      category,
      amountArs: slice.ars,
      amountUsd: slice.usd,
      share: totalArs > 0 ? (slice.ars / totalArs) * 100 : 0,
      count: slice.count,
    }))
    .sort((a, b) => b.amountArs - a.amountArs || a.category.localeCompare(b.category));

  return {
    totalArs,
    totalUsd,
    movementCount,
    activeMonths: months.size,
    categories,
  };
}

export function computeSharedMonthlyBreakdown(
  movements: Movement[],
  year: number,
  rates: MonthlyRate[],
): SharedMonthSnapshot[] {
  const snapshots: SharedMonthSnapshot[] = [];

  for (let month = 1; month <= 12; month++) {
    const monthMovements = filterByMonth(movements, year, month);
    const summary = computeSharedPeriodSummary(monthMovements, rates);
    snapshots.push({
      year,
      month,
      totalArs: summary.totalArs,
      totalUsd: summary.totalUsd,
      movementCount: summary.movementCount,
    });
  }

  return snapshots;
}
