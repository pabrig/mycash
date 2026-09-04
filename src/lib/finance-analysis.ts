import { toArs, toUsd } from "./currency";
import { formatMoney } from "./format";
import { expenseCategoryLabel } from "./labels";
import { filterByYear, getRateForMonth } from "./summary";
import { MONTH_NAMES, type MonthSnapshot, type MonthlyRate, type Movement, type SharedCategorySlice } from "./types";

export interface MonthEvolutionPoint {
  year: number;
  month: number;
  income: number;
  expenses: number;
  disponible: number;
  movementCount: number;
  /** Diferencia de ahorro vs el mes anterior con datos. */
  vsPrevDisponible: number | null;
}

export interface FinanceInsight {
  id: string;
  tone: "positive" | "warning" | "neutral";
  text: string;
}

function monthLabel(month: number): string {
  return MONTH_NAMES[month - 1] ?? "";
}

function shortMonth(month: number): string {
  return monthLabel(month).slice(0, 3);
}

function categoryId(movement: Movement): string {
  const id = movement.category?.trim();
  return id || "otros";
}

/** Meses visibles del año, con comparación vs el mes anterior que tuvo movimientos. */
export function buildMonthEvolution(
  breakdown: MonthSnapshot[],
  monthsShown: number,
): MonthEvolutionPoint[] {
  const points: MonthEvolutionPoint[] = [];
  let prevDisponible: number | null = null;

  for (const snap of breakdown.slice(0, monthsShown)) {
    const hasActivity = snap.movementCount > 0;
    const disponible = snap.summary.disponible;
    points.push({
      year: snap.year,
      month: snap.month,
      income: snap.summary.totalIncome,
      expenses: snap.summary.totalExpenses,
      disponible,
      movementCount: snap.movementCount,
      vsPrevDisponible:
        hasActivity && prevDisponible !== null
          ? disponible - prevDisponible
          : null,
    });
    if (hasActivity) prevDisponible = disponible;
  }

  return points;
}

/** En qué categorías se fueron los gastos del año (pesos al TC de cada mes). */
export function computeExpenseCategoryMix(
  movements: Movement[],
  year: number,
  rates: MonthlyRate[],
): SharedCategorySlice[] {
  const yearMovements = filterByYear(movements, year);
  const byCategory = new Map<
    string,
    { ars: number; usd: number; count: number }
  >();
  let totalArs = 0;

  for (const m of yearMovements) {
    if (m.type !== "expense") continue;
    const [y, month] = m.date.split("-").map(Number);
    const rate = getRateForMonth(rates, y, month);
    const ars = toArs(m.amount, m.currency, rate);
    const usd = toUsd(m.amount, m.currency, rate);
    const category = categoryId(m);
    const prev = byCategory.get(category) ?? { ars: 0, usd: 0, count: 0 };
    prev.ars += ars;
    prev.usd += usd;
    prev.count += 1;
    byCategory.set(category, prev);
    totalArs += ars;
  }

  return [...byCategory.entries()]
    .map(([category, slice]) => ({
      category,
      amountArs: slice.ars,
      amountUsd: slice.usd,
      share: totalArs > 0 ? (slice.ars / totalArs) * 100 : 0,
      count: slice.count,
    }))
    .sort(
      (a, b) =>
        b.amountArs - a.amountArs || a.category.localeCompare(b.category),
    );
}

export function financeCategoryCopy(): { title: string; empty: string } {
  return {
    title: "En qué se fue la plata",
    empty: "Cuando anotes el tipo de gasto, acá ves el reparto.",
  };
}

export function financeEvolutionCopy(): {
  title: string;
  subtitle: string;
  empty: string;
} {
  return {
    title: "Cómo fue cambiando",
    subtitle: "Cada barra es lo que te quedó ese mes (ingresos menos gastos).",
    empty: "Cuando anotes movimientos, acá ves mes a mes cómo te fue.",
  };
}

export function financeInsightsCopy(): { title: string } {
  return { title: "En pocas palabras" };
}

/** Texto corto bajo cada mes: diferencia vs el anterior. */
export function monthDeltaCopy(vsPrev: number | null): string | null {
  if (vsPrev === null) return null;
  if (vsPrev === 0) return "Igual";
  const abs = formatMoney(Math.abs(vsPrev));
  return vsPrev > 0 ? `+${abs}` : `−${abs}`;
}

export function monthDeltaTone(
  vsPrev: number | null,
): "positive" | "warning" | "neutral" {
  if (vsPrev === null || vsPrev === 0) return "neutral";
  return vsPrev > 0 ? "positive" : "warning";
}

/**
 * Hasta 3 frases cortas. Lenguaje llano, una idea por frase.
 * Los montos van en pesos (mismo criterio que el resumen anual en ARS).
 */
export function buildFinanceInsights(
  points: MonthEvolutionPoint[],
  categories: SharedCategorySlice[],
  totalIncome: number,
  totalDisponible: number,
): FinanceInsight[] {
  const active = points.filter((p) => p.movementCount > 0);
  if (active.length === 0) return [];

  const insights: FinanceInsight[] = [];

  if (totalIncome > 0) {
    const pct = (totalDisponible / totalIncome) * 100;
    if (pct < 0) {
      insights.push({
        id: "overspent",
        tone: "warning",
        text: "Este año gastaste más de lo que entró.",
      });
    } else {
      insights.push({
        id: "saved-share",
        tone: pct >= 20 ? "positive" : "neutral",
        text: `De cada $100 que entró, te quedaron $${Math.round(pct)}.`,
      });
    }
  }

  if (active.length >= 2) {
    const best = active.reduce((a, b) =>
      b.disponible > a.disponible ? b : a,
    );
    const worst = active.reduce((a, b) =>
      b.disponible < a.disponible ? b : a,
    );
    if (best.month !== worst.month) {
      insights.push({
        id: "best-month",
        tone: best.disponible >= 0 ? "positive" : "neutral",
        text: `El mes que mejor te fue fue ${monthLabel(best.month).toLowerCase()} (${formatMoney(best.disponible)}).`,
      });
    }

    const latest = active[active.length - 1];
    if (latest.vsPrevDisponible !== null && insights.length < 3) {
      const prev = active[active.length - 2];
      const delta = latest.vsPrevDisponible;
      if (delta > 0) {
        insights.push({
          id: "latest-better",
          tone: "positive",
          text: `En ${monthLabel(latest.month).toLowerCase()} te quedó más que en ${monthLabel(prev.month).toLowerCase()}.`,
        });
      } else if (delta < 0) {
        insights.push({
          id: "latest-worse",
          tone: "warning",
          text: `En ${monthLabel(latest.month).toLowerCase()} te quedó menos que en ${monthLabel(prev.month).toLowerCase()}.`,
        });
      }
    }
  }

  const top = categories[0];
  if (top && top.share >= 15 && insights.length < 3) {
    insights.push({
      id: "top-category",
      tone: "neutral",
      text: `La mayor parte de tus gastos fue en ${expenseCategoryLabel(top.category).toLowerCase()} (${top.share.toFixed(0)}%).`,
    });
  }

  return insights.slice(0, 3);
}

/** Altura relativa 0–100 para dibujar barras (usa el máximo absoluto del año). */
export function evolutionBarHeights(
  points: MonthEvolutionPoint[],
): number[] {
  const active = points.filter((p) => p.movementCount > 0);
  const peak = Math.max(
    0,
    ...active.map((p) => Math.abs(p.disponible)),
  );
  if (peak <= 0) {
    return points.map((p) => (p.movementCount > 0 ? 8 : 0));
  }
  return points.map((p) => {
    if (p.movementCount === 0) return 0;
    return Math.max(8, Math.round((Math.abs(p.disponible) / peak) * 100));
  });
}

export function evolutionAxisLabel(month: number): string {
  return shortMonth(month);
}
