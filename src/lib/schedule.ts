import { MONTH_NAMES } from "./types";
import { todayIso } from "./format";

export const MAX_REPEAT_COUNT = 36;

export type RepeatMode = "once" | "monthly" | "installments";

export function padIso(year: number, month: number, day: number): string {
  const last = daysInMonth(year, month);
  const d = Math.min(Math.max(day, 1), last);
  return `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function parseIsoDate(
  iso: string,
): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1) return null;
  return { year, month, day };
}

export function addDaysIso(iso: string, days: number): string {
  const parsed = parseIsoDate(iso);
  if (!parsed) return iso;
  const dt = new Date(parsed.year, parsed.month - 1, parsed.day + days);
  return padIso(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
}

/** Mantiene el día cuando se puede; si el mes es más corto, usa el último día. */
export function addMonthsIso(iso: string, months: number): string {
  const parsed = parseIsoDate(iso);
  if (!parsed) return iso;
  const monthIndex = parsed.month - 1 + months;
  const year = parsed.year + Math.floor(monthIndex / 12);
  const month = ((monthIndex % 12) + 12) % 12;
  return padIso(year, month + 1, parsed.day);
}

export function defaultDateForPeriod(
  year: number,
  month: number,
  today: string = todayIso(),
): string {
  if (year < 1 || month < 1) return today;
  const parsed = parseIsoDate(today);
  if (parsed && parsed.year === year && parsed.month === month) return today;
  return padIso(year, month, 1);
}

export function expandMonthlyDates(startIso: string, count: number): string[] {
  const n = Math.min(MAX_REPEAT_COUNT, Math.max(1, Math.floor(count)));
  return Array.from({ length: n }, (_, i) => addMonthsIso(startIso, i));
}

export function installmentLabel(
  description: string,
  index: number,
  total: number,
): string {
  const base = description.replace(/\s+\d+\s*\/\s*\d+\s*$/, "").trim();
  return `${base} ${index}/${total}`;
}

export function seriesPreview({
  mode,
  startIso,
  count,
  firstInstallment,
  totalInstallments,
}: {
  mode: RepeatMode;
  startIso: string;
  count: number;
  firstInstallment?: number;
  totalInstallments?: number;
}): string {
  if (mode === "once") return "";
  const dates = expandMonthlyDates(startIso, count);
  const last = dates[dates.length - 1];
  const from = formatMonthYear(startIso);
  const to = formatMonthYear(last);

  if (mode === "installments") {
    const first = firstInstallment ?? 1;
    const total = totalInstallments ?? count;
    const lastN = first + count - 1;
    if (count === 1) return `${first}/${total} · ${from}`;
    return `${count} cuotas · ${first}/${total} a ${lastN}/${total} · ${from} → ${to}`;
  }

  if (count === 1) return `1 mes · ${from}`;
  return `${count} meses · ${from} → ${to}`;
}

export function formatMonthYear(iso: string): string {
  const parsed = parseIsoDate(iso);
  if (!parsed) return iso;
  const name = MONTH_NAMES[parsed.month - 1];
  if (!name) return iso;
  return `${name.slice(0, 3)} ${parsed.year}`;
}

export function notesInPeriodLabel(iso: string): string {
  const parsed = parseIsoDate(iso);
  if (!parsed) return "";
  const name = MONTH_NAMES[parsed.month - 1];
  if (!name) return "";
  return `Se anota en ${name.toLowerCase()} ${parsed.year}`;
}
