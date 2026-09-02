import { MONTH_NAMES } from "./types";

/** Etiqueta corta del rango de meses anteriores en el mismo año. */
export function priorMonthsRangeLabel(month: number): string | null {
  if (month <= 1) return null;
  if (month === 2) return MONTH_NAMES[0];
  return `${MONTH_NAMES[0]} a ${MONTH_NAMES[month - 2]}`;
}
