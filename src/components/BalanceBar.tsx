"use client";

import { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { useDisplayAmount } from "@/hooks/useDisplayAmount";

export function BalanceBar() {
  const { summary } = useFinance();
  const fmt = useDisplayAmount();
  const [open, setOpen] = useState(false);

  const total = summary.totalIncome + summary.totalExpenses;
  const incomePct = total > 0 ? (summary.totalIncome / total) * 100 : 50;

  return (
    <section className="card animate-slide-up p-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
          Detalle del mes
        </span>
        <span className="text-xs text-zinc-400">{open ? "Ocultar" : "Ver"}</span>
      </button>

      <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className="bg-emerald-500 transition-all duration-500"
          style={{ width: `${incomePct}%` }}
        />
        <div
          className="bg-red-400 transition-all duration-500"
          style={{ width: `${100 - incomePct}%` }}
        />
      </div>

      <div className="mt-2 flex justify-between text-xs">
        <span className="font-medium text-emerald-600">
          Ingresos {fmt(summary.totalIncome)}
        </span>
        <span className="font-medium text-red-500">
          Gastos {fmt(summary.totalExpenses)}
        </span>
      </div>

      {open && (
        <div className="mt-4 space-y-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <Detail label="Ingresos pasivos" value={summary.passiveIncome} fmt={fmt} tone="income" />
            <Detail label="Ingresos activos" value={summary.activeIncome} fmt={fmt} tone="income" />
            <Detail label="Gastos personales" value={summary.personalExpenses} fmt={fmt} tone="expense" />
            <Detail label="Gastos compartidos" value={summary.sharedExpenses} fmt={fmt} tone="shared" />
            <Detail label="Pers. fijos" value={summary.personalFixed} fmt={fmt} />
            <Detail label="Pers. variables" value={summary.personalVariable} fmt={fmt} />
          </dl>

          <div className="flex justify-between rounded-xl bg-emerald-50 px-3 py-2 text-sm dark:bg-emerald-950/30">
            <span className="text-emerald-700 dark:text-emerald-400">Ingresos</span>
            <span className="font-semibold text-emerald-600">{fmt(summary.totalIncome)}</span>
          </div>
          <div className="flex justify-between rounded-xl bg-red-50 px-3 py-2 text-sm dark:bg-red-950/30">
            <span className="text-red-700 dark:text-red-400">Gastos</span>
            <span className="font-semibold text-red-500">{fmt(summary.totalExpenses)}</span>
          </div>
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
    income: "text-emerald-600",
    expense: "text-red-500",
    shared: "text-indigo-500",
  };

  return (
    <div className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800/50">
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd
        className={`font-semibold tabular-nums ${tone ? colors[tone] : "text-zinc-800 dark:text-zinc-100"}`}
      >
        {fmt(value)}
      </dd>
    </div>
  );
}
