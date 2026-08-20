"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/format";
import { useFormatMoney } from "@/hooks/useDisplayAmount";
import {
  formatSplitSummary,
  settleEqualSplit,
  splitSharePath,
} from "@/lib/split-bill";
import { IconClose, IconPlus } from "@/components/ui/Icons";

type Row = { id: string; name: string; paid: string };

function parsePaid(raw: string): number {
  const n = parseFloat(raw.replace(",", ".").replace(/\s/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function SplitBill() {
  const formatArs = useFormatMoney();
  const [title, setTitle] = useState("");
  const [rows, setRows] = useState<Row[]>([
    { id: "p1", name: "", paid: "" },
    { id: "p2", name: "", paid: "" },
  ]);
  const nextId = useRef(3);
  const [meId, setMeId] = useState("p1");
  const [copied, setCopied] = useState(false);

  const result = useMemo(
    () =>
      settleEqualSplit(
        rows.map((r) => ({
          id: r.id,
          name: r.name,
          paid: parsePaid(r.paid),
        })),
      ),
    [rows],
  );

  function update(id: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function remove(id: string) {
    if (rows.length <= 2) return;
    const next = rows.filter((r) => r.id !== id);
    setRows(next);
    if (id === meId) setMeId(next[0]?.id ?? "p1");
  }

  async function copySummary() {
    const text = formatSplitSummary(title, result, formatMoney);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const canSettle = result.total > 0 && result.count >= 2;
  const myShare =
    result.balances.find((b) => b.id === meId)?.share ?? result.share;
  const shareHref = splitSharePath(title, myShare);

  return (
    <div className="space-y-5">
      <p className="text-sm leading-relaxed text-zinc-500">
        Cargá quiénes comieron y cuánto puso cada uno. Si alguien no pagó, dejá
        $0. Marcá quién sos vos: se puede cargar tu parte (lo que te toca) como
        gasto, no lo que pusiste en la mesa.
      </p>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="input-field"
        placeholder="¿Qué fue? Ej: Cena, asado, after…"
      />

      <section className="space-y-3">
        <p className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">
          Quiénes
        </p>
        <ul className="space-y-2">
          {rows.map((row, i) => (
            <li
              key={row.id}
              className="flex items-center gap-2 rounded-2xl bg-[var(--card)] p-2 pl-3"
            >
              <input
                type="text"
                value={row.name}
                onChange={(e) => update(row.id, { name: e.target.value })}
                className="min-w-0 flex-1 bg-transparent py-2 text-sm font-medium outline-none"
                placeholder={i === 0 ? "Yo" : `Persona ${i + 1}`}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setMeId(row.id)}
                className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold transition active:scale-95 ${
                  meId === row.id
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "text-zinc-400"
                }`}
              >
                yo
              </button>
              <div className="flex items-center gap-1 rounded-xl bg-[var(--card-muted)] px-2.5">
                <span className="text-xs text-zinc-400">puso</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={row.paid}
                  onChange={(e) => update(row.id, { paid: e.target.value })}
                  className="w-[6.5rem] bg-transparent py-2.5 text-right text-sm font-semibold tabular-nums outline-none"
                  placeholder="0"
                />
              </div>
              <button
                type="button"
                onClick={() => remove(row.id)}
                disabled={rows.length <= 2}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-400 transition active:scale-95 disabled:opacity-30"
                aria-label={`Quitar ${row.name || `persona ${i + 1}`}`}
              >
                <IconClose className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() =>
            setRows((prev) => [
              ...prev,
              { id: `p${nextId.current++}`, name: "", paid: "" },
            ])
          }
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-zinc-600 transition active:scale-[0.99] dark:text-zinc-300"
        >
          <IconPlus className="h-4 w-4" />
          Agregar persona
        </button>
      </section>

      <section className="bento space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-zinc-400">Total</p>
            <p className="mt-1 text-3xl font-extrabold tracking-tighter tabular-nums">
              {formatArs(result.total)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-zinc-400">Cada uno</p>
            <p className="mt-1 text-xl font-bold tabular-nums">
              {formatArs(result.share)}
            </p>
          </div>
        </div>

        {!canSettle ? (
          <p className="text-sm text-zinc-400">
            Ingresá al menos un monto para ver quién le transfiere a quién.
          </p>
        ) : result.transfers.length === 0 ? (
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
            Quedaron a mano — nadie se debe nada.
          </p>
        ) : (
          <ul className="space-y-2">
            {result.transfers.map((t) => (
              <li
                key={`${t.fromId}-${t.toId}`}
                className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--card-muted)] px-3.5 py-3 text-sm"
              >
                <span className="min-w-0 font-medium">
                  <span className="truncate">{t.fromName}</span>
                  <span className="mx-1.5 text-zinc-400">→</span>
                  <span className="truncate">{t.toName}</span>
                </span>
                <span className="shrink-0 font-bold tabular-nums">
                  {formatArs(t.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}

        {canSettle && (
          <div className="flex flex-col gap-2">
            <Link
              href={shareHref}
              className="btn-primary block w-full text-center text-sm"
            >
              Cargar mi parte · {formatArs(myShare)}
            </Link>
            <button
              type="button"
              onClick={() => void copySummary()}
              className="w-full rounded-2xl py-3 text-sm font-semibold text-zinc-600 dark:text-zinc-300"
            >
              {copied ? "Copiado" : "Copiar para WhatsApp"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
