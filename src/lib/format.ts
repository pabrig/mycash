import { MONTH_NAMES, type DisplayCurrency } from "./types";

/** Separador de miles determinista (evita mismatch SSR/client con Intl). */
function formatIntegerPart(amount: number, thousandSep: "." | ","): string {
  const n = Math.abs(Math.round(amount));
  return n
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, thousandSep);
}

export function formatMoney(amount: number): string {
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? "-" : "";
  return `${sign}$${formatIntegerPart(rounded, ".")}`;
}

export function formatUsd(amount: number): string {
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? "-" : "";
  return `${sign}USD ${formatIntegerPart(rounded, ",")}`;
}

/** Monto USD compacto (sin prefijo) para filas densas */
export function formatUsdShort(amount: number): string {
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? "-" : "";
  return `${sign}${formatIntegerPart(rounded, ",")}`;
}

export const HIDDEN_AMOUNT_ARS = "$ ••••";
export const HIDDEN_AMOUNT_USD = "USD •••";
export const HIDDEN_AMOUNT_SHORT = "••••";

/** Convierte monto en ARS al formato de visualización elegido */
export function formatDisplay(
  amountArs: number,
  display: DisplayCurrency,
  usdToArs: number,
): string {
  if (display === "ARS") return formatMoney(amountArs);
  if (usdToArs <= 0) return formatUsd(0);
  return formatUsd(amountArs / usdToArs);
}

export function arsToDisplay(
  amountArs: number,
  display: DisplayCurrency,
  usdToArs: number,
): number {
  if (display === "ARS") return amountArs;
  if (usdToArs <= 0) return 0;
  return amountArs / usdToArs;
}

export function formatMonth(year: number, month: number): string {
  if (month < 1 || month > 12) return "";
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

/** Desplaza un periodo YYYY-MM por `delta` meses (puede ser negativo). */
export function shiftPeriod(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const zero = year * 12 + (month - 1) + delta;
  const y = Math.floor(zero / 12);
  const m = zero - y * 12 + 1;
  return { year: y, month: m };
}

export function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function currentPeriod(): { year: number; month: number } {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export function isCurrentPeriod(year: number, month: number): boolean {
  if (year === 0 || month === 0) return true;
  const now = currentPeriod();
  return now.year === year && now.month === month;
}

export function formatRateUpdatedAt(iso: string | undefined): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("es-AR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export function buildAnnualBrief(
  year: number,
  summary: {
    passiveIncome: number;
    activeIncome: number;
    personalExpenses: number;
    sharedExpenses: number;
    totalIncome: number;
    totalExpenses: number;
    disponible: number;
    movementCount: number;
    activeMonths: number;
    averages: {
      totalIncome: number;
      totalExpenses: number;
      disponible: number;
    };
  },
  fmt: (amountArs: number) => string,
): string {
  if (summary.movementCount === 0) {
    return `No hay nada anotado en ${year}.`;
  }

  const parts: string[] = [];
  const monthLabel =
    summary.activeMonths === 1 ? "1 mes" : `${summary.activeMonths} meses`;

  parts.push(
    `Ingresos ${fmt(summary.totalIncome)} (${fmt(summary.averages.totalIncome)}/mes): ${fmt(summary.passiveIncome)} rentas y ${fmt(summary.activeIncome)} trabajo.`,
  );
  parts.push(
    `Gastos ${fmt(summary.totalExpenses)} (${fmt(summary.averages.totalExpenses)}/mes): ${fmt(summary.personalExpenses)} tuyos y ${fmt(summary.sharedExpenses)} con otros.`,
  );
  parts.push(
    `Te quedó ${fmt(summary.disponible)} en el año · ${fmt(summary.averages.disponible)} por mes (${monthLabel}).`,
  );

  return parts.join(" ");
}

/** Iniciales para avatares (1 palabra → 2 letras; 2+ → primera de cada una). */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
