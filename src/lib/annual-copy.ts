import { formatDayAndMonth } from "./format";
import { MONTH_NAMES } from "./types";

export function isCurrentCalendarYear(
  year: number,
  now: Date = new Date(),
): boolean {
  return year === now.getFullYear();
}

export function visibleMonthCount(
  year: number,
  now: Date = new Date(),
): number {
  if (year !== now.getFullYear()) return 12;
  return now.getMonth() + 1;
}

function monthSpanUntil(now: Date): string {
  const end = MONTH_NAMES[now.getMonth()]?.toLowerCase() ?? "";
  if (now.getMonth() === 0) return "enero";
  return `enero a ${end}`;
}

export function yearHeroCopy(
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
      label: "Ahorro hasta hoy",
      asOf: filled
        ? `Suma de ${monthSpanUntil(now)}`
        : activeMonths === 0
          ? `Hasta el ${formatDayAndMonth(now)}`
          : `Suma de ${activeMonths} ${monthWord} con movimientos`,
      fx: "Pesos y dólares al cierre de cada mes",
      hint:
        activeMonths === 0
          ? "Cuando anotes los meses, este número junta lo que te fue quedando."
          : `Hasta el ${formatDayAndMonth(now)}. Este es el total: suma lo que te quedó cada mes. Abajo, cada mes está aparte.`,
    };
  }

  return {
    label: "Ahorro del año",
    asOf:
      activeMonths === 12
        ? `Suma de los 12 meses · ${year}`
        : activeMonths === 0
          ? `Enero a diciembre · ${year}`
          : `Suma de ${activeMonths} ${monthWord} · ${year}`,
    fx: "Pesos y dólares al cierre de cada mes",
    hint:
      activeMonths === 0
        ? `No hay nada anotado en ${year}.`
        : `Este es el total del año: junta lo que te quedó cada mes. Abajo, cada mes está aparte.`,
  };
}

export function savingsRateCopy(
  income: number,
  saved: number,
): {
  percent: number | null;
  savedShare: number;
  spentShare: number;
  line: string;
} {
  if (income <= 0) {
    return {
      percent: null,
      savedShare: 0,
      spentShare: 0,
      line: "Cuando anotes ingresos, acá ves qué porcentaje te queda.",
    };
  }

  const percent = (saved / income) * 100;
  if (percent < 0) {
    return {
      percent,
      savedShare: 0,
      spentShare: 100,
      line: "Gastaste más de lo que entró",
    };
  }

  const savedShare = Math.min(100, percent);
  return {
    percent,
    savedShare,
    spentShare: 100 - savedShare,
    line: `Ahorraste el ${percent.toFixed(0)}% de lo que entró`,
  };
}

export function yearListCopy(): { title: string; subtitle: string } {
  return {
    title: "Mes a mes",
    subtitle: "La columna Ahorro es solo ese mes. El total está arriba.",
  };
}

export function incomeMixCopy(
  passiveIncome: number,
  totalIncome: number,
): {
  passiveShare: number;
  activeShare: number;
} | null {
  if (totalIncome <= 0) return null;
  const passiveShare = (passiveIncome / totalIncome) * 100;
  return {
    passiveShare,
    activeShare: 100 - passiveShare,
  };
}

export function sharedYearCopy(
  sharedExpenses: number,
  totalExpenses: number,
): {
  sharedShare: number;
  personalShare: number;
  caption: string;
} | null {
  if (totalExpenses <= 0 || sharedExpenses <= 0) return null;
  const sharedShare = (sharedExpenses / totalExpenses) * 100;
  return {
    sharedShare,
    personalShare: 100 - sharedShare,
    caption: "Ya está restado en Gastos",
  };
}
