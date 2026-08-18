"use client";

import { useFinance } from "@/context/FinanceContext";
import { useDisplayAmount } from "@/hooks/useDisplayAmount";
import type { SummaryScope } from "@/lib/types";

export function DisponibleHero({ scope }: { scope: SummaryScope }) {
  const { year, summary, annualSummary } = useFinance();
  const fmt = useDisplayAmount();

  const isYear = scope === "year";
  const positive = isYear
    ? annualSummary.averages.disponible >= 0
    : summary.disponible >= 0;

  const monthLabel =
    annualSummary.activeMonths === 1
      ? "1 mes"
      : `${annualSummary.activeMonths} meses`;

  return (
    <section className="card animate-slide-up overflow-hidden p-0">
      <div
        className={`px-5 py-6 ${positive ? "bg-gradient-to-br from-emerald-600 to-emerald-700" : "bg-gradient-to-br from-red-500 to-red-600"} text-white`}
      >
        {isYear ? (
          <>
            <p className="text-sm font-medium text-white/80">
              Prom. mensual {year}
            </p>
            <p className="mt-1 text-4xl font-bold tracking-tight tabular-nums">
              {fmt(annualSummary.averages.disponible)}
            </p>
            <p className="mt-1 text-xs text-white/70">
              Acumulado {fmt(annualSummary.disponible)} · {monthLabel} con
              movimientos
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-white/80">Disponible del mes</p>
            <p className="mt-1 text-4xl font-bold tracking-tight tabular-nums">
              {fmt(summary.disponible)}
            </p>
          </>
        )}
      </div>
      <div className="grid grid-cols-3 divide-x divide-zinc-100 dark:divide-zinc-800">
        {isYear ? (
          <>
            <StatCell
              label="Prom. ingresos"
              value={annualSummary.averages.totalIncome}
              fmt={fmt}
              tone="income"
            />
            <StatCell
              label="Prom. egresos"
              value={annualSummary.averages.totalExpenses}
              fmt={fmt}
              tone="expense"
            />
            <StatCell
              label="Prom. compart."
              value={annualSummary.averages.sharedExpenses}
              fmt={fmt}
              tone="shared"
            />
          </>
        ) : (
          <>
            <StatCell label="Ingresos" value={summary.totalIncome} fmt={fmt} tone="income" />
            <StatCell label="Gastos" value={summary.totalExpenses} fmt={fmt} tone="expense" />
            <StatCell label="Compart." value={summary.sharedExpenses} fmt={fmt} tone="shared" />
          </>
        )}
      </div>
    </section>
  );
}

function StatCell({
  label,
  value,
  fmt,
  tone,
}: {
  label: string;
  value: number;
  fmt: (n: number) => string;
  tone: "income" | "expense" | "shared";
}) {
  const colors = {
    income: "text-emerald-600",
    expense: "text-red-500",
    shared: "text-indigo-500",
  };

  return (
    <div className="px-3 py-3 text-center">
      <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
        {label}
      </p>
      <p className={`mt-0.5 text-sm font-semibold tabular-nums ${colors[tone]}`}>
        {fmt(value)}
      </p>
    </div>
  );
}
