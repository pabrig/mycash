import {
  isCurrentCalendarYear,
  monthSpanUntil,
  visibleMonthCount,
} from "./annual-copy";
import { formatDayAndMonth, formatMonth } from "./format";

export function sharedMonthHeroCopy(
  year: number,
  month: number,
): {
  label: string;
  asOf: string;
  fx: string;
  hint: string;
} {
  return {
    label: "Gastado en el grupo",
    asOf: formatMonth(year, month),
    fx: "Pesos y dólares al dólar de este mes",
    hint: "Así se repartió la plata del grupo este mes. Abajo, cada gasto está aparte.",
  };
}

export function sharedYearHeroCopy(
  year: number,
  activeMonths: number,
  now: Date = new Date(),
): {
  label: string;
  asOf: string;
  fx: string;
  hint: string;
} {
  const elapsed = visibleMonthCount(year, now);
  const monthWord = activeMonths === 1 ? "mes" : "meses";

  if (isCurrentCalendarYear(year, now)) {
    const filled = activeMonths > 0 && activeMonths >= elapsed;
    return {
      label: "Gastado hasta hoy",
      asOf: filled
        ? `Suma de ${monthSpanUntil(now)}`
        : activeMonths === 0
          ? `Hasta el ${formatDayAndMonth(now)}`
          : `Suma de ${activeMonths} ${monthWord} con gastos`,
      fx: "Pesos y dólares al cierre de cada mes",
      hint:
        activeMonths === 0
          ? "Cuando anoten gastos del grupo, acá ves en qué se fue la plata."
          : `Hasta el ${formatDayAndMonth(now)}. Este es el total del grupo. Abajo, cada mes está aparte.`,
    };
  }

  return {
    label: "Gastado en el año",
    asOf:
      activeMonths === 12
        ? `Suma de los 12 meses · ${year}`
        : activeMonths === 0
          ? `Enero a diciembre · ${year}`
          : `Suma de ${activeMonths} ${monthWord} · ${year}`,
    fx: "Pesos y dólares al cierre de cada mes",
    hint:
      activeMonths === 0
        ? `No hay gastos del grupo en ${year}.`
        : "Este es el total del grupo en el año. Abajo, cada mes está aparte.",
  };
}

export function sharedCategoryCopy(): { title: string; empty: string } {
  return {
    title: "En qué se fue",
    empty: "Cuando anoten el tipo de gasto, acá ves el reparto.",
  };
}

export function sharedMonthListCopy(): { title: string; subtitle: string } {
  return {
    title: "Mes a mes",
    subtitle: "El total de cada mes es solo ese mes. El de arriba junta todo.",
  };
}
