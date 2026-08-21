import { toArs } from "./currency";
import { formatMonth, todayIso } from "./format";
import {
  expenseCategoryLabel,
  EXPENSE_KIND_LABELS,
  INCOME_KIND_LABELS,
  incomeSourceLabel,
} from "./labels";
import {
  computeAnnualSummaryArs,
  computeMonthlyBreakdown,
  computeMonthlySummary,
  filterByMonth,
  filterByYear,
  getRateForMonth,
} from "./summary";
import type {
  MonthlyRate,
  MonthlySummary,
  Movement,
  SummaryScope,
} from "./types";
import { visibleMonthCount } from "./annual-copy";
import { resolveWallet } from "./wallet";

export type StatementFormat = "pdf" | "xlsx" | "csv";

export const STATEMENT_FORMATS: {
  id: StatementFormat;
  title: string;
  description: string;
}[] = [
  {
    id: "pdf",
    title: "PDF",
    description: "Para imprimir o mandar. Se ve como un resumen en papel.",
  },
  {
    id: "xlsx",
    title: "Excel",
    description: "Para abrir en Excel o Numbers. Trae el resumen y la lista.",
  },
  {
    id: "csv",
    title: "CSV",
    description: "Para Google Sheets u otra app. Solo la lista de movimientos.",
  },
];

export type StatementRow = {
  date: string;
  type: string;
  description: string;
  amount: number;
  currency: "ARS" | "USD";
  amountArs: number;
  category: string;
  scope: string;
  kind: string;
  wallet: string;
  group: string;
};

export type StatementTotal = {
  label: string;
  amountArs: number;
};

export type StatementMonthRow = {
  month: string;
  income: number;
  expenses: number;
  saved: number;
};

export type Statement = {
  scope: SummaryScope;
  title: string;
  generatedOn: string;
  filenameBase: string;
  rows: StatementRow[];
  totals: StatementTotal[];
  months: StatementMonthRow[];
};

export function statementFilename(
  statement: Statement,
  format: StatementFormat,
): string {
  return `${statement.filenameBase}.${format}`;
}

export function buildStatement(input: {
  scope: SummaryScope;
  year: number;
  month: number;
  movements: Movement[];
  rates: MonthlyRate[];
  generatedAt?: Date;
}): Statement {
  const generatedOn = input.generatedAt
    ? toIsoDate(input.generatedAt)
    : todayIso();

  if (input.scope === "year") {
    const rows = filterByYear(input.movements, input.year)
      .slice()
      .sort(byDateThenCreated);
    const summary = computeAnnualSummaryArs(
      input.movements,
      input.year,
      input.rates,
    );
    const monthsShown = visibleMonthCount(input.year, dateFromIso(generatedOn));
    const months = computeMonthlyBreakdown(
      input.movements,
      input.year,
      input.rates,
    )
      .slice(0, monthsShown)
      .map((snap) => ({
        month: formatMonth(snap.year, snap.month),
        income: snap.summary.totalIncome,
        expenses: snap.summary.totalExpenses,
        saved: snap.summary.disponible,
      }));

    return {
      scope: "year",
      title: `Año ${input.year}`,
      generatedOn,
      filenameBase: `mycash-${input.year}`,
      rows: rows.map((m) => toRow(m, input.rates)),
      totals: yearTotals(summary),
      months,
    };
  }

  const monthRows = filterByMonth(input.movements, input.year, input.month)
    .slice()
    .sort(byDateThenCreated);
  const rate = getRateForMonth(input.rates, input.year, input.month);
  const summary = computeMonthlySummary(monthRows, rate);
  const title = formatMonth(input.year, input.month);

  return {
    scope: "month",
    title,
    generatedOn,
    filenameBase: `mycash-${slugPeriod(title)}`,
    rows: monthRows.map((m) => toRow(m, input.rates)),
    totals: monthTotals(summary),
    months: [],
  };
}

function yearTotals(summary: {
  totalIncome: number;
  totalExpenses: number;
  personalExpenses: number;
  sharedExpenses: number;
  disponible: number;
}): StatementTotal[] {
  const totals: StatementTotal[] = [
    { label: "Ingreso", amountArs: summary.totalIncome },
    { label: "Gasto", amountArs: summary.totalExpenses },
  ];
  if (summary.sharedExpenses > 0) {
    totals.push({ label: "De eso, con otros", amountArs: summary.sharedExpenses });
    totals.push({ label: "Solo tuyo", amountArs: summary.personalExpenses });
  }
  totals.push({ label: "Ahorro", amountArs: summary.disponible });
  return totals;
}

function monthTotals(summary: MonthlySummary): StatementTotal[] {
  const totals: StatementTotal[] = [
    { label: "Ingresos", amountArs: summary.totalIncome },
    { label: "Gastos", amountArs: summary.totalExpenses },
  ];
  if (summary.sharedExpenses > 0) {
    totals.push({
      label: "De eso, con otros",
      amountArs: summary.sharedExpenses,
    });
  }
  totals.push({ label: "Disponible", amountArs: summary.disponible });
  return totals;
}

function toRow(movement: Movement, rates: MonthlyRate[]): StatementRow {
  const [year, month] = movement.date.split("-").map(Number);
  const rate = getRateForMonth(rates, year, month);
  const wallet = resolveWallet(movement);
  const isExpense = movement.type === "expense";
  const isShared = isExpense && movement.scope === "shared";

  return {
    date: movement.date,
    type: isExpense ? "Gasto" : "Ingreso",
    description: movement.description,
    amount: movement.amount,
    currency: movement.currency,
    amountArs: toArs(movement.amount, movement.currency, rate),
    category: isExpense
      ? expenseCategoryLabel(movement.category)
      : incomeSourceLabel(movement.source),
    scope: isExpense ? (isShared ? "Compartido" : "Mío") : "",
    kind: isExpense
      ? movement.kind
        ? EXPENSE_KIND_LABELS[movement.kind]
        : ""
      : movement.incomeKind
        ? INCOME_KIND_LABELS[movement.incomeKind]
        : "",
    wallet: wallet === "ahorro" ? "Ahorro" : "Diario",
    group: isShared ? (movement.householdName ?? "") : "",
  };
}

function byDateThenCreated(a: Movement, b: Movement): number {
  const date = a.date.localeCompare(b.date);
  if (date !== 0) return date;
  return a.createdAt.localeCompare(b.createdAt);
}

export function slugPeriod(title: string): string {
  return title
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dateFromIso(iso: string): Date {
  return new Date(`${iso}T12:00:00`);
}
