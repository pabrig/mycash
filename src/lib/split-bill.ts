import { EXPENSE_CATEGORIES } from "./types";

export interface SplitParticipant {
  id: string;
  name: string;
  paid: number;
}

export interface SplitBalance {
  id: string;
  name: string;
  paid: number;
  share: number;
  /** pagó − parte; positivo = le deben, negativo = debe */
  net: number;
}

export interface SplitTransfer {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
}

export interface SplitResult {
  total: number;
  count: number;
  /** Parte igual redondeada, para mostrar. Las balances.share suman el total. */
  share: number;
  balances: SplitBalance[];
  transfers: SplitTransfer[];
}

export interface SplitPerson {
  id: string;
  name: string;
  isMe: boolean;
}

export interface SplitExpense {
  id: string;
  date: string;
  description: string;
  amount: number;
  paidById: string;
}

export interface SplitEvent {
  id: string;
  title: string;
  createdAt: string;
  startDate?: string;
  endDate?: string;
  people: SplitPerson[];
  expenses: SplitExpense[];
}

export interface SplitExpenseGroup {
  date: string;
  items: SplitExpense[];
}

function toPesos(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n);
}

/** Reparte `total` en `n` enteros que suman exacto (el resto va a los primeros). */
export function equalShares(total: number, n: number): number[] {
  if (n <= 0) return [];
  const safe = Math.max(0, Math.round(total));
  const base = Math.floor(safe / n);
  const rem = safe - base * n;
  return Array.from({ length: n }, (_, i) => base + (i < rem ? 1 : 0));
}

/**
 * Partes iguales: cada persona pone el mismo share del total.
 * Quien pagó de más cobra; quien no puso (o puso de menos) transfiere.
 * Liquidación greedy con la menor cantidad de transferencias.
 */
export function settleEqualSplit(people: SplitParticipant[]): SplitResult {
  const participants = people.map((p, i) => ({
    id: p.id,
    name: p.name.trim() || `Persona ${i + 1}`,
    paid: toPesos(p.paid),
  }));
  const n = participants.length;
  const total = participants.reduce((sum, p) => sum + p.paid, 0);

  if (n === 0) {
    return { total: 0, count: 0, share: 0, balances: [], transfers: [] };
  }

  const shares = equalShares(total, n);
  const balances: SplitBalance[] = participants.map((p, i) => ({
    id: p.id,
    name: p.name,
    paid: p.paid,
    share: shares[i],
    net: p.paid - shares[i],
  }));

  const debtors = balances
    .filter((b) => b.net < 0)
    .map((b) => ({ ...b, remaining: -b.net }));
  const creditors = balances
    .filter((b) => b.net > 0)
    .map((b) => ({ ...b, remaining: b.net }));

  const transfers: SplitTransfer[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].remaining, creditors[j].remaining);
    if (pay <= 0) break;
    transfers.push({
      fromId: debtors[i].id,
      fromName: debtors[i].name,
      toId: creditors[j].id,
      toName: creditors[j].name,
      amount: pay,
    });
    debtors[i].remaining -= pay;
    creditors[j].remaining -= pay;
    if (debtors[i].remaining === 0) i += 1;
    if (creditors[j].remaining === 0) j += 1;
  }

  return { total, count: n, share: Math.round(total / n), balances, transfers };
}

/** Suma lo que pagó cada persona en el evento. */
export function paidByPerson(event: SplitEvent): SplitParticipant[] {
  const paid = new Map<string, number>();
  for (const person of event.people) paid.set(person.id, 0);
  for (const expense of event.expenses) {
    paid.set(
      expense.paidById,
      (paid.get(expense.paidById) ?? 0) + toPesos(expense.amount),
    );
  }
  return event.people.map((person) => ({
    id: person.id,
    name: person.name,
    paid: paid.get(person.id) ?? 0,
  }));
}

export function settleEvent(event: SplitEvent): SplitResult {
  return settleEqualSplit(paidByPerson(event));
}

export function eventMyShare(event: SplitEvent, result: SplitResult): number {
  const me = event.people.find((person) => person.isMe);
  if (!me) return result.share;
  return result.balances.find((b) => b.id === me.id)?.share ?? result.share;
}

export function groupExpensesByDate(
  expenses: SplitExpense[],
): SplitExpenseGroup[] {
  const order: string[] = [];
  const map = new Map<string, SplitExpense[]>();
  const sorted = [...expenses].sort((a, b) =>
    b.date.localeCompare(a.date) || b.id.localeCompare(a.id),
  );
  for (const expense of sorted) {
    const list = map.get(expense.date);
    if (list) {
      list.push(expense);
    } else {
      map.set(expense.date, [expense]);
      order.push(expense.date);
    }
  }
  return order.map((date) => ({ date, items: map.get(date) ?? [] }));
}

/** Día calendario desde YYYY-MM-DD, sin Date (hidrata igual en server y client). */
export function formatIsoDay(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  return `${Number(match[3])}/${Number(match[2])}`;
}

export function eventDaySpan(
  startDate?: string,
  endDate?: string,
): number | null {
  if (!startDate || !endDate) return null;
  const start = Date.parse(`${startDate}T00:00:00`);
  const end = Date.parse(`${endDate}T00:00:00`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return null;
  }
  return Math.round((end - start) / 86_400_000) + 1;
}

export function formatEventDates(event: SplitEvent): string {
  const { startDate, endDate } = event;
  if (!startDate && !endDate) return "";
  if (startDate && endDate && startDate !== endDate) {
    const days = eventDaySpan(startDate, endDate);
    const range = `${formatIsoDay(startDate)} – ${formatIsoDay(endDate)}`;
    return days && days > 1 ? `${range} · ${days} días` : range;
  }
  return formatIsoDay(startDate || endDate || "");
}

export function personName(
  event: SplitEvent,
  personId: string,
  fallback = "Alguien",
): string {
  const person = event.people.find((p) => p.id === personId);
  const name = person?.name.trim();
  if (name) return name;
  const i = event.people.findIndex((p) => p.id === personId);
  return i >= 0 ? `Persona ${i + 1}` : fallback;
}

export function formatSplitSummary(
  title: string,
  result: SplitResult,
  fmt: (n: number) => string,
): string {
  const heading = title.trim() || "Cuenta dividida";
  const lines = [
    heading,
    `Total ${fmt(result.total)} · ${fmt(result.share)} cada uno`,
    "",
  ];
  if (result.transfers.length === 0) {
    lines.push("Nadie se debe nada.");
  } else {
    for (const t of result.transfers) {
      lines.push(`${t.fromName} → ${t.toName}  ${fmt(t.amount)}`);
    }
  }
  return lines.join("\n");
}

export function formatEventSplitSummary(
  event: SplitEvent,
  result: SplitResult,
  fmt: (n: number) => string,
): string {
  const heading = event.title.trim() || "Cuenta dividida";
  const dates = formatEventDates(event);
  const lines = [
    heading,
    ...(dates ? [dates] : []),
    `Total ${fmt(result.total)} · ${fmt(result.share)} cada uno`,
    "",
  ];
  if (result.transfers.length === 0) {
    lines.push("Nadie se debe nada.");
  } else {
    for (const t of result.transfers) {
      lines.push(`${t.fromName} → ${t.toName}  ${fmt(t.amount)}`);
    }
  }

  const recent = [...event.expenses]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .slice(0, 8);
  if (recent.length > 0) {
    lines.push("", "Gastos");
    for (const expense of recent) {
      const what = expense.description.trim() || "Gasto";
      lines.push(
        `${formatIsoDay(expense.date)} ${what} ${fmt(expense.amount)} (${personName(event, expense.paidById)})`,
      );
    }
    if (event.expenses.length > recent.length) {
      lines.push(`… y ${event.expenses.length - recent.length} más`);
    }
  }

  return lines.join("\n");
}

/** Prefill del form de gasto con la parte de una persona. */
export function splitSharePath(title: string, share: number): string {
  const amount = Math.max(0, Math.round(share));
  if (amount <= 0) return "/nuevo";
  const desc = (title.trim() || "Cuenta dividida").slice(0, 80);
  const q = new URLSearchParams({
    monto: String(amount),
    desc,
    cat: "salidas",
  });
  return `/nuevo?${q.toString()}`;
}

export function parseSplitExpensePrefill(params: {
  get: (name: string) => string | null;
}): { amount: string; description: string; category: string } | null {
  const raw = params.get("monto")?.replace(",", ".") ?? "";
  const amount = Math.round(Number(raw));
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const desc = (params.get("desc") ?? "").trim().slice(0, 80) || "Cuenta dividida";
  const cat = params.get("cat") ?? "salidas";
  const category = (EXPENSE_CATEGORIES as readonly string[]).includes(cat)
    ? cat
    : "salidas";
  return { amount: String(amount), description: desc, category };
}
