export type Currency = "ARS" | "USD";

export type DisplayCurrency = "ARS" | "USD";

export type MovementType = "income" | "expense";

export type ExpenseScope = "personal" | "shared";

export type ExpenseKind = "fixed" | "variable";

export type IncomeKind = "passive" | "active";

export interface Movement {
  id: string;
  type: MovementType;
  date: string;
  amount: number;
  currency: Currency;
  description: string;
  scope?: ExpenseScope;
  kind?: ExpenseKind;
  category?: string;
  incomeKind?: IncomeKind;
  source?: string;
  createdAt: string;
}

export interface MonthlyRate {
  year: number;
  month: number;
  usdToArs: number;
  updatedAt?: string;
}

export interface MonthlySummary {
  passiveIncome: number;
  activeIncome: number;
  personalExpenses: number;
  personalFixed: number;
  personalVariable: number;
  totalIncome: number;
  sharedExpenses: number;
  totalExpenses: number;
  /** Ingresos − gastos personales − gastos compartidos */
  disponible: number;
}

export interface AnnualAverages {
  disponible: number;
  totalIncome: number;
  totalExpenses: number;
  sharedExpenses: number;
  passiveIncome: number;
  activeIncome: number;
  personalExpenses: number;
  personalFixed: number;
  personalVariable: number;
}

export interface MonthSnapshot {
  year: number;
  month: number;
  summary: MonthlySummary;
  movementCount: number;
}

export interface AnnualSummary {
  year: number;
  passiveIncome: number;
  activeIncome: number;
  personalExpenses: number;
  personalFixed: number;
  personalVariable: number;
  sharedExpenses: number;
  totalIncome: number;
  totalExpenses: number;
  disponible: number;
  movementCount: number;
  /** Meses del año con al menos un movimiento */
  activeMonths: number;
  averages: AnnualAverages;
}

export type SummaryScope = "month" | "year";

export const EXPENSE_CATEGORIES = [
  "alimentacion",
  "transporte",
  "salidas",
  "servicios",
  "salud",
  "streaming",
  "seguros",
  "alquiler",
  "extras",
  "otros",
] as const;

export const INCOME_SOURCES = [
  "itti",
  "alquiler_serena",
  "alquiler_obispo",
  "sueldo",
  "otros",
] as const;

export const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;
