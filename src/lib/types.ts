export type Currency = "ARS" | "USD";

export type DisplayCurrency = "ARS" | "USD";

export type MovementType = "income" | "expense";

export type ExpenseScope = "personal" | "shared";

export type ExpenseKind = "fixed" | "variable";

export type IncomeKind = "passive" | "active";

/** Bolsa mental: cotidiano (ARS) vs ahorro USD. Id interno "vida" = Cotidiano. */
export type Wallet = "vida" | "ahorro";

export type WalletMode = "unified" | "split";

export type ConversionDirection = "to_usd" | "to_ars";

export interface WalletBucketSummary {
  wallet: Wallet;
  currency: Currency;
  income: number;
  expenses: number;
  disponible: number;
}

export interface SplitMonthlySummary {
  vida: WalletBucketSummary;
  ahorro: WalletBucketSummary;
  /** Total aproximado en ARS (vida + ahorro al TC del mes) */
  equivalentTotalArs: number;
}

export interface SplitAnnualSummary {
  year: number;
  /** Totales del año en USD (cotidiano convertido al TC de cada mes) */
  vida: WalletBucketSummary;
  ahorro: WalletBucketSummary;
  equivalentTotalArs: number;
  movementCount: number;
  activeMonths: number;
}

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
  /** Override de bolsa (modo bolsillos); si falta, se infiere */
  wallet?: Wallet;
  createdAt: string;
  /** Usuario que cargó el movimiento (compartidos) */
  createdByUserId?: string;
  createdByName?: string;
}

export interface Profile {
  id: string;
  displayName: string;
}

export interface Household {
  id: string;
  name: string;
}

export interface HouseholdMember {
  userId: string;
  displayName: string;
  role: "owner" | "member";
}

export interface HouseholdInvite {
  id: string;
  code: string;
  expiresAt: string;
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
  /** Ingresos − gastos personales − gastos compartidos propios */
  disponible: number;
}

export interface MonthSnapshot {
  year: number;
  month: number;
  summary: MonthlySummary;
  movementCount: number;
}

/** Totales del año. Cada movimiento se convierte al TC de su mes (USD o ARS). */
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
