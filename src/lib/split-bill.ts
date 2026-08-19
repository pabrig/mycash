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
