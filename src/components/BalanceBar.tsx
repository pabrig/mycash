"use client";

import { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { useDisplayAmount } from "@/hooks/useDisplayAmount";

export function BalanceBar() {
  const { summary, walletMode, sharedEnabled } = useFinance();
  const fmt = useDisplayAmount();
  const [open, setOpen] = useState(false);

  if (walletMode === "split") return null;

  const total = summary.totalIncome + summary.totalExpenses;
  const incomePct = total > 0 ? (summary.totalIncome / total) * 100 : 50;

  return (
    <section className="bento animate-slide-up-delay-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-sm font-semibold text-zinc-500">Flujo del mes</span>
        <span className="text-xs font-medium text-zinc-400">
          {open ? "Menos" : "Detalle"}
        </span>
      </button>

      <div className="mt-4 flex h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className="rounded-full bg-emerald-500 transition-all duration-700 ease-out"
          style={{ width: `${incomePct}%` }}
        />
        <div
          className="rounded-full bg-rose-400/80 transition-all duration-700 ease-out"
          style={{ width: `${100 - incomePct}%` }}
        />
      </div>

      <div className="mt-3 flex justify-between text-xs font-semibold">
        <span className="amount-positive">↑ {fmt(summary.totalIncome)}</span>
        <span className="amount-negative">↓ {fmt(summary.totalExpenses)}</span>
      </div>

      {open && (
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Detail label="Pasivos" value={summary.passiveIncome} fmt={fmt} tone="income" />
          <Detail label="Activos" value={summary.activeIncome} fmt={fmt} tone="income" />
          <Detail label="Personales" value={summary.personalExpenses} fmt={fmt} tone="expense" />
          {sharedEnabled && (
            <Detail label="Compartidos" value={summary.sharedExpenses} fmt={fmt} tone="shared" />
          )}
          <Detail label="Fijos" value={summary.personalFixed} fmt={fmt} />
          <Detail label="Variables" value={summary.personalVariable} fmt={fmt} />
        </div>
      )}
    </section>
  );
}

function Detail({
  label,
  value,
  fmt,
  tone,
}: {
  label: string;
  value: number;
  fmt: (n: number) => string;
  tone?: "income" | "expense" | "shared";
}) {
  const colors = {
    income: "amount-positive",
    expense: "amount-negative",
    shared: "text-teal-600 dark:text-teal-400",
  };

  return (
    <div className="rounded-2xl bg-[var(--card-muted)] px-3.5 py-3">
      <p className="text-[11px] font-medium text-zinc-400">{label}</p>
      <p
        className={`mt-0.5 text-sm font-bold tabular-nums ${
          tone ? colors[tone] : "text-zinc-900 dark:text-white"
        }`}
      >
        {fmt(value)}
      </p>
    </div>
  );
}
