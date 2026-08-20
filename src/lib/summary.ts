import { toArs, getDefaultRate } from "./currency";
import type { AnnualAverages, AnnualSummary, MonthSnapshot, MonthlyRate, MonthlySummary, Movement } from "./types";

function getRateForMonth(
  rates: MonthlyRate[],
  year: number,
  month: number,
): MonthlyRate {
  return (
    rates.find((r) => r.year === year && r.month === month) ??
    getDefaultRate(year, month)
  );
}

export function filterByMonth(
  movements: Movement[],
  year: number,
  month: number,
): Movement[] {
  return movements.filter((m) => {
    const [y, mo] = m.date.split("-").map(Number);
    return y === year && mo === month;
  });
}

export function filterByYear(movements: Movement[], year: number): Movement[] {
  return movements.filter((m) => m.date.startsWith(`${year}-`));
}

function countActiveMonths(movements: Movement[], year: number): number {
  const months = new Set<number>();
  for (const m of movements) {
    if (!m.date.startsWith(`${year}-`)) continue;
    months.add(Number(m.date.split("-")[1]));
  }
  return months.size;
}

function computeAverages(
  aggregated: Omit<MonthlySummary, never> & { movementCount: number },
  activeMonths: number,
): AnnualAverages {
  const divisor = activeMonths > 0 ? activeMonths : 1;
  return {
    disponible: aggregated.disponible / divisor,
    totalIncome: aggregated.totalIncome / divisor,
    totalExpenses: aggregated.totalExpenses / divisor,
    sharedExpenses: aggregated.sharedExpenses / divisor,
    passiveIncome: aggregated.passiveIncome / divisor,
    activeIncome: aggregated.activeIncome / divisor,
    personalExpenses: aggregated.personalExpenses / divisor,
    personalFixed: aggregated.personalFixed / divisor,
    personalVariable: aggregated.personalVariable / divisor,
  };
}

function aggregateMovements(
  movements: Movement[],
  resolveRate: (year: number, month: number) => MonthlyRate,
): Omit<MonthlySummary, never> & { movementCount: number } {
  let passiveIncome = 0;
  let activeIncome = 0;
  let personalExpenses = 0;
  let personalFixed = 0;
  let personalVariable = 0;
  let sharedExpenses = 0;

  for (const m of movements) {
    const [y, mo] = m.date.split("-").map(Number);
    const rate = resolveRate(y, mo);
    const ars = toArs(m.amount, m.currency, rate);

    if (m.type === "income") {
      if (m.incomeKind === "passive") passiveIncome += ars;
      else activeIncome += ars;
    } else if (m.scope === "shared") {
      sharedExpenses += ars;
    } else {
      personalExpenses += ars;
      if (m.kind === "fixed") personalFixed += ars;
      else personalVariable += ars;
    }
  }

  const totalIncome = passiveIncome + activeIncome;
  const totalExpenses = personalExpenses + sharedExpenses;

  return {
    passiveIncome,
    activeIncome,
    personalExpenses,
    personalFixed,
    personalVariable,
    totalIncome,
    sharedExpenses,
    totalExpenses,
    disponible: totalIncome - totalExpenses,
    movementCount: movements.length,
  };
}

export function computeMonthlySummary(
  movements: Movement[],
  rate: MonthlyRate,
): MonthlySummary {
  const aggregated = aggregateMovements(movements, () => rate);
  return {
    passiveIncome: aggregated.passiveIncome,
    activeIncome: aggregated.activeIncome,
    personalExpenses: aggregated.personalExpenses,
    personalFixed: aggregated.personalFixed,
    personalVariable: aggregated.personalVariable,
    totalIncome: aggregated.totalIncome,
    sharedExpenses: aggregated.sharedExpenses,
    totalExpenses: aggregated.totalExpenses,
    disponible: aggregated.disponible,
  };
}

export function computeAnnualSummary(
  movements: Movement[],
  year: number,
  rates: MonthlyRate[],
): AnnualSummary {
  const yearMovements = filterByYear(movements, year);
  const aggregated = aggregateMovements(yearMovements, (y, m) =>
    getRateForMonth(rates, y, m),
  );
  const activeMonths = countActiveMonths(yearMovements, year);
  const averages = computeAverages(aggregated, activeMonths);

  return {
    year,
    passiveIncome: aggregated.passiveIncome,
    activeIncome: aggregated.activeIncome,
    personalExpenses: aggregated.personalExpenses,
    personalFixed: aggregated.personalFixed,
    personalVariable: aggregated.personalVariable,
    sharedExpenses: aggregated.sharedExpenses,
    totalIncome: aggregated.totalIncome,
    totalExpenses: aggregated.totalExpenses,
    disponible: aggregated.disponible,
    movementCount: aggregated.movementCount,
    activeMonths,
    averages,
  };
}

export function computeMonthlyBreakdown(
  movements: Movement[],
  year: number,
  rates: MonthlyRate[],
): MonthSnapshot[] {
  const snapshots: MonthSnapshot[] = [];

  for (let month = 1; month <= 12; month++) {
    const monthMovements = filterByMonth(movements, year, month);
    const rate = getRateForMonth(rates, year, month);
    snapshots.push({
      year,
      month,
      summary: computeMonthlySummary(monthMovements, rate),
      movementCount: monthMovements.length,
    });
  }

  return snapshots;
}
