import { toArs, toUsd, getDefaultRate } from "./currency";
import type {
  AnnualSummary,
  Currency,
  MonthSnapshot,
  MonthlyRate,
  MonthlySummary,
  Movement,
} from "./types";

type AmountConverter = (
  amount: number,
  currency: Currency,
  rate: MonthlyRate,
) => number;

export function getRateForMonth(
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

function aggregateMovements(
  movements: Movement[],
  resolveRate: (year: number, month: number) => MonthlyRate,
  convert: AmountConverter = toArs,
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
    const amount = convert(m.amount, m.currency, rate);

    if (m.type === "income") {
      if (m.incomeKind === "passive") passiveIncome += amount;
      else activeIncome += amount;
    } else if (m.scope === "shared") {
      sharedExpenses += amount;
    } else {
      personalExpenses += amount;
      if (m.kind === "fixed") personalFixed += amount;
      else personalVariable += amount;
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
  const aggregated = aggregateMovements(
    yearMovements,
    (y, m) => getRateForMonth(rates, y, m),
    toUsd,
  );
  const activeMonths = countActiveMonths(yearMovements, year);

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
  };
}

export function monthlySummaryToUsd(
  summary: MonthlySummary,
  rate: MonthlyRate,
): MonthlySummary {
  const convert = (amount: number) => toUsd(amount, "ARS", rate);
  return {
    passiveIncome: convert(summary.passiveIncome),
    activeIncome: convert(summary.activeIncome),
    personalExpenses: convert(summary.personalExpenses),
    personalFixed: convert(summary.personalFixed),
    personalVariable: convert(summary.personalVariable),
    totalIncome: convert(summary.totalIncome),
    sharedExpenses: convert(summary.sharedExpenses),
    totalExpenses: convert(summary.totalExpenses),
    disponible: convert(summary.disponible),
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
