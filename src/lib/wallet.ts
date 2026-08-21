import { toArs, toUsd } from "./currency";
import { filterByMonth, filterByYear } from "./summary";
import type {
  MonthlyRate,
  Movement,
  SplitAnnualSummary,
  SplitMonthlySummary,
  Wallet,
  WalletBucketSummary,
} from "./types";

/** Bolsa efectiva de un movimiento (auto si no tiene override). */
export function resolveWallet(m: Movement): Wallet {
  if (m.wallet) return m.wallet;
  if (m.type === "expense" && m.scope === "shared") return "vida";
  if (m.currency === "USD") return "ahorro";
  return "vida";
}

function emptyBucket(wallet: Wallet): WalletBucketSummary {
  return {
    wallet,
    currency: wallet === "vida" ? "ARS" : "USD",
    income: 0,
    expenses: 0,
    disponible: 0,
  };
}

function toBucketAmount(
  amount: number,
  currency: Movement["currency"],
  wallet: Wallet,
  rate: MonthlyRate,
): number {
  if (wallet === "vida") {
    return currency === "ARS" ? amount : toArs(amount, currency, rate);
  }
  if (currency === "USD") return amount;
  if (rate.usdToArs <= 0) return 0;
  return amount / rate.usdToArs;
}

function addMovementToBuckets(
  vida: WalletBucketSummary,
  ahorro: WalletBucketSummary,
  m: Movement,
  rate: MonthlyRate,
) {
  const wallet = resolveWallet(m);
  const bucket = wallet === "vida" ? vida : ahorro;
  const native = toBucketAmount(m.amount, m.currency, wallet, rate);

  if (m.type === "income") bucket.income += native;
  else bucket.expenses += native;
}

export function computeSplitMonthlySummary(
  movements: Movement[],
  rate: MonthlyRate,
): SplitMonthlySummary {
  const vida = emptyBucket("vida");
  const ahorro = emptyBucket("ahorro");

  for (const m of movements) {
    addMovementToBuckets(vida, ahorro, m, rate);
  }

  vida.disponible = vida.income - vida.expenses;
  ahorro.disponible = ahorro.income - ahorro.expenses;

  return {
    vida,
    ahorro,
    equivalentTotalArs: vida.disponible + ahorro.disponible * rate.usdToArs,
  };
}

function countActiveMonths(movements: Movement[], year: number): number {
  const months = new Set<number>();
  for (const m of movements) {
    if (!m.date.startsWith(`${year}-`)) continue;
    months.add(Number(m.date.split("-")[1]));
  }
  return months.size;
}

export function computeSplitAnnualSummary(
  movements: Movement[],
  year: number,
  rates: MonthlyRate[],
): SplitAnnualSummary {
  const yearMovements = filterByYear(movements, year);
  const getRate = (y: number, m: number): MonthlyRate =>
    rates.find((r) => r.year === y && r.month === m) ?? {
      year: y,
      month: m,
      usdToArs: 1200,
    };

  const vida = emptyBucket("vida");
  const ahorro = emptyBucket("ahorro");
  let equivalentTotalArs = 0;
  vida.currency = "USD";

  for (let month = 1; month <= 12; month++) {
    const monthMovements = filterByMonth(yearMovements, year, month);
    if (monthMovements.length === 0) continue;
    const rate = getRate(year, month);
    const monthSplit = computeSplitMonthlySummary(monthMovements, rate);
    vida.income += toUsd(monthSplit.vida.income, "ARS", rate);
    vida.expenses += toUsd(monthSplit.vida.expenses, "ARS", rate);
    ahorro.income += monthSplit.ahorro.income;
    ahorro.expenses += monthSplit.ahorro.expenses;
    equivalentTotalArs += monthSplit.equivalentTotalArs;
  }

  vida.disponible = vida.income - vida.expenses;
  ahorro.disponible = ahorro.income - ahorro.expenses;

  return {
    year,
    vida,
    ahorro,
    equivalentTotalArs,
    movementCount: yearMovements.length,
    activeMonths: countActiveMonths(yearMovements, year),
  };
}

export function walletBucketToUsd(
  bucket: WalletBucketSummary,
  rate: MonthlyRate,
): WalletBucketSummary {
  if (bucket.currency === "USD") return bucket;
  return {
    ...bucket,
    currency: "USD",
    income: toUsd(bucket.income, "ARS", rate),
    expenses: toUsd(bucket.expenses, "ARS", rate),
    disponible: toUsd(bucket.disponible, "ARS", rate),
  };
}

export function computeSplitMonthlyBreakdown(
  movements: Movement[],
  year: number,
  rates: MonthlyRate[],
) {
  const getRate = (y: number, m: number): MonthlyRate =>
    rates.find((r) => r.year === y && r.month === m) ?? {
      year: y,
      month: m,
      usdToArs: 1200,
    };

  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const monthMovements = filterByMonth(movements, year, month);
    return {
      year,
      month,
      movementCount: monthMovements.length,
      split: computeSplitMonthlySummary(monthMovements, getRate(year, month)),
    };
  });
}
