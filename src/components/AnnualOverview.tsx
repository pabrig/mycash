"use client";

import { useMemo } from "react";
import { useFinance } from "@/context/FinanceContext";
import { useDisplayAmount } from "@/hooks/useDisplayAmount";
import { currentPeriod } from "@/lib/format";
import { computeMonthlyBreakdown } from "@/lib/summary";
import { MONTH_NAMES } from "@/lib/types";

export function AnnualOverview({
  onOpenMonth,
}: {
  onOpenMonth: (month: number) => void;
}) {
  const { year, month, movements, rates, annualSummary, setPeriod } =
    useFinance();
  const fmt = useDisplayAmount();

  const breakdown = useMemo(
    () => computeMonthlyBreakdown(movements, year, rates),
    [movements, year, rates],
  );

  const { averages, activeMonths } = annualSummary;
  const now = currentPeriod();

  return (
    <section className="animate-slide-up space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          Mes a mes · {year}
        </h2>
        <p className="mt-0.5 text-xs text-zinc-400">
          Promedios sobre {activeMonths}{" "}
          {activeMonths === 1 ? "mes con movimientos" : "meses con movimientos"}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <AvgPill label="Prom. ingresos" value={averages.totalIncome} fmt={fmt} tone="income" />
        <AvgPill label="Prom. egresos" value={averages.totalExpenses} fmt={fmt} tone="expense" />
        <AvgPill label="Prom. disponible" value={averages.disponible} fmt={fmt} tone="balance" />
      </div>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 border-b border-zinc-100 px-4 py-2 text-[10px] font-medium uppercase tracking-wide text-zinc-400 dark:border-zinc-800">
          <span>Mes</span>
          <span className="text-right text-emerald-600">Ingresos</span>
          <span className="text-right text-red-500">Egresos</span>
          <span className="text-right">Disp.</span>
        </div>

        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {breakdown.map((snap) => {
            const isCurrent =
              snap.year === now.year &&
              snap.month === now.month &&
              year === now.year;
            const isSelected = snap.month === month && year === snap.year;
            const hasActivity = snap.movementCount > 0;
            const positive = snap.summary.disponible >= 0;

            return (
              <li key={snap.month}>
                <button
                  type="button"
                  onClick={() => {
                    setPeriod(year, snap.month);
                    onOpenMonth(snap.month);
                  }}
                  className={`grid w-full grid-cols-[1fr_auto_auto_auto] gap-x-3 px-4 py-3 text-left transition-colors active:bg-zinc-50 dark:active:bg-zinc-800/50 ${
                    isSelected
                      ? "bg-emerald-50/80 dark:bg-emerald-950/20"
                      : isCurrent
                        ? "bg-zinc-50/50 dark:bg-zinc-800/30"
                        : ""
                  }`}
                >
                  <span
                    className={`text-sm ${hasActivity ? "font-medium" : "text-zinc-400"} ${isSelected ? "text-emerald-700 dark:text-emerald-400" : ""}`}
                  >
                    {MONTH_NAMES[snap.month - 1].slice(0, 3)}
                    {isCurrent && (
                      <span className="ml-1.5 text-[10px] font-normal text-emerald-600">
                        actual
                      </span>
                    )}
                  </span>

                  {hasActivity ? (
                    <>
                      <span className="text-right text-sm tabular-nums text-emerald-600">
                        {fmt(snap.summary.totalIncome)}
                      </span>
                      <span className="text-right text-sm tabular-nums text-red-500">
                        {fmt(snap.summary.totalExpenses)}
                      </span>
                      <span
                        className={`text-right text-sm font-semibold tabular-nums ${positive ? "text-emerald-600" : "text-red-500"}`}
                      >
                        {fmt(snap.summary.disponible)}
                      </span>
                    </>
                  ) : (
                    <span className="col-span-3 text-right text-xs text-zinc-300 dark:text-zinc-600">
                      Sin movimientos
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 border-t border-zinc-200 bg-zinc-50 px-4 py-3 text-sm dark:border-zinc-700 dark:bg-zinc-800/50">
          <span className="font-semibold text-zinc-600 dark:text-zinc-300">
            Promedio
          </span>
          <span className="text-right font-semibold tabular-nums text-emerald-600">
            {fmt(averages.totalIncome)}
          </span>
          <span className="text-right font-semibold tabular-nums text-red-500">
            {fmt(averages.totalExpenses)}
          </span>
          <span
            className={`text-right font-bold tabular-nums ${averages.disponible >= 0 ? "text-emerald-600" : "text-red-500"}`}
          >
            {fmt(averages.disponible)}
          </span>
        </div>
      </div>

      <p className="text-center text-xs text-zinc-400">
        Tocá un mes para ver el detalle diario
      </p>
    </section>
  );
}

function AvgPill({
  label,
  value,
  fmt,
  tone,
}: {
  label: string;
  value: number;
  fmt: (n: number) => string;
  tone: "income" | "expense" | "balance";
}) {
  const colors = {
    income: "text-emerald-600",
    expense: "text-red-500",
    balance: value >= 0 ? "text-emerald-600" : "text-red-500",
  };

  return (
    <div className="card px-3 py-2.5 text-center">
      <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
        {label}
      </p>
      <p className={`mt-0.5 text-sm font-bold tabular-nums ${colors[tone]}`}>
        {fmt(value)}
      </p>
    </div>
  );
}
