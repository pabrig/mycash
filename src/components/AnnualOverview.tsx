"use client";

import { useMemo } from "react";
import { useFinance } from "@/context/FinanceContext";
import { useDisplayAmount, useFormatMoney, useFormatUsd, useFormatUsdShort } from "@/hooks/useDisplayAmount";
import { currentPeriod } from "@/lib/format";
import { computeMonthlyBreakdown } from "@/lib/summary";
import { computeSplitMonthlyBreakdown } from "@/lib/wallet";
import { MONTH_NAMES } from "@/lib/types";

export function AnnualOverview({
  onOpenMonth,
}: {
  onOpenMonth: (month: number) => void;
}) {
  const { walletMode, year, month, ownMovements, rates, annualSummary, splitAnnualSummary, setPeriod } =
    useFinance();
  const fmt = useDisplayAmount();
  const formatMoney = useFormatMoney();
  const formatUsd = useFormatUsd();
  const formatUsdShort = useFormatUsdShort();

  const breakdown = useMemo(
    () => computeMonthlyBreakdown(ownMovements, year, rates),
    [ownMovements, year, rates],
  );

  const splitBreakdown = useMemo(
    () => computeSplitMonthlyBreakdown(ownMovements, year, rates),
    [ownMovements, year, rates],
  );

  const now = currentPeriod();

  if (walletMode === "split") {
    const { averages, activeMonths } = splitAnnualSummary;

    return (
      <section className="animate-slide-up space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            Mes a mes · {year}
          </h2>
          <p className="mt-0.5 text-xs text-zinc-400">
            Promedio de {activeMonths}{" "}
            {activeMonths === 1 ? "mes con algo anotado" : "meses con algo anotado"}
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              Cotidiano · ARS
            </p>
            <div className="grid grid-cols-3 gap-2">
              <AvgPill
                label="↑ Ingresos"
                value={averages.vida.income}
                formatter={formatMoney}
                tone="income"
              />
              <AvgPill
                label="↓ Gastos"
                value={averages.vida.expenses}
                formatter={formatMoney}
                tone="expense"
              />
              <AvgPill
                label="Te queda"
                value={averages.vida.disponible}
                formatter={formatMoney}
                tone="balance"
              />
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              Ahorro · USD
            </p>
            <div className="grid grid-cols-3 gap-2">
              <AvgPill
                label="↑ Entradas"
                value={averages.ahorro.income}
                formatter={formatUsd}
                tone="income"
              />
              <AvgPill
                label="↓ Salidas"
                value={averages.ahorro.expenses}
                formatter={formatUsd}
                tone="expense"
              />
              <AvgPill
                label="Te queda"
                value={averages.ahorro.disponible}
                formatter={formatUsd}
                tone="balance"
              />
            </div>
          </div>
        </div>

        <IncomeMixCard averages={annualSummary.averages} fmt={fmt} />

        <div className="bento overflow-hidden !p-0">
          <div className="grid grid-cols-[minmax(3rem,1fr)_1.2fr_1.2fr] gap-x-2 px-4 py-3 text-[10px] font-semibold tracking-wide text-zinc-400 uppercase">
            <span>Mes</span>
            <span className="text-right">Cotidiano</span>
            <span className="text-right">Ahorro</span>
          </div>

          <ul className="space-y-0.5 px-1.5 pb-2">
            {splitBreakdown.map((snap) => {
              const isCurrent =
                snap.year === now.year &&
                snap.month === now.month &&
                year === now.year;
              const isSelected = snap.month === month && year === snap.year;
              const hasActivity = snap.movementCount > 0;
              const vidaPositive = snap.split.vida.disponible >= 0;
              const ahorroPositive = snap.split.ahorro.disponible >= 0;

              return (
                <li key={snap.month}>
                  <button
                    type="button"
                    onClick={() => {
                      setPeriod(year, snap.month);
                      onOpenMonth(snap.month);
                    }}
                    className={`grid w-full grid-cols-[minmax(3rem,1fr)_1.2fr_1.2fr] gap-x-2 rounded-2xl px-2.5 py-3 text-left transition ${
                      isSelected
                        ? "bg-[var(--card-muted)]"
                        : "active:bg-[var(--card-muted)]"
                    }`}
                  >
                    <span
                      className={`self-center text-sm ${hasActivity ? "font-semibold" : "text-zinc-400"}`}
                    >
                      {MONTH_NAMES[snap.month - 1].slice(0, 3)}
                      {isCurrent && (
                        <span className="ml-1 text-[10px] font-medium text-teal-600">
                          hoy
                        </span>
                      )}
                    </span>

                    {hasActivity ? (
                      <>
                        <MonthBucketCell
                          disponible={snap.split.vida.disponible}
                          income={snap.split.vida.income}
                          expenses={snap.split.vida.expenses}
                          format={formatMoney}
                          positive={vidaPositive}
                        />
                        <MonthBucketCell
                          disponible={snap.split.ahorro.disponible}
                          income={snap.split.ahorro.income}
                          expenses={snap.split.ahorro.expenses}
                          format={formatUsd}
                          formatFlow={formatUsdShort}
                          positive={ahorroPositive}
                        />
                      </>
                    ) : (
                      <span className="col-span-2 self-center text-right text-xs text-zinc-300 dark:text-zinc-600">
                        Sin nada
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="grid grid-cols-[minmax(3rem,1fr)_1.2fr_1.2fr] gap-x-2 bg-[var(--card-muted)] px-4 py-3.5 text-sm">
            <span className="self-center font-semibold text-zinc-500">
              Promedio
            </span>
            <MonthBucketCell
              disponible={averages.vida.disponible}
              income={averages.vida.income}
              expenses={averages.vida.expenses}
              format={formatMoney}
              positive={averages.vida.disponible >= 0}
              bold
            />
            <MonthBucketCell
              disponible={averages.ahorro.disponible}
              income={averages.ahorro.income}
              expenses={averages.ahorro.expenses}
              format={formatUsd}
              formatFlow={formatUsdShort}
              positive={averages.ahorro.disponible >= 0}
              bold
            />
          </div>
        </div>

        <p className="text-center text-xs text-zinc-400">
          Tocá un mes para ver el día a día
        </p>
      </section>
    );
  }

  const { averages, activeMonths } = annualSummary;

  return (
    <section className="animate-slide-up space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          Mes a mes · {year}
        </h2>
        <p className="mt-0.5 text-xs text-zinc-400">
          Promedio de {activeMonths}{" "}
          {activeMonths === 1 ? "mes con algo anotado" : "meses con algo anotado"}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <AvgPill label="Ingresos" value={averages.totalIncome} fmt={fmt} tone="income" />
        <AvgPill label="Gastos" value={averages.totalExpenses} fmt={fmt} tone="expense" />
        <AvgPill label="Te queda" value={averages.disponible} fmt={fmt} tone="balance" />
      </div>

      <IncomeMixCard averages={averages} fmt={fmt} />

      <div className="bento overflow-hidden !p-0">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-4 py-3 text-[10px] font-semibold tracking-wide text-zinc-400 uppercase">
          <span>Mes</span>
          <span className="text-right amount-positive">Ingresos</span>
          <span className="text-right amount-negative">Gastos</span>
          <span className="text-right">Te queda</span>
        </div>

        <ul className="space-y-0.5 px-1.5 pb-2">
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
                  className={`grid w-full grid-cols-[1fr_auto_auto_auto] gap-x-3 rounded-2xl px-3 py-3 text-left transition ${
                    isSelected
                      ? "bg-[var(--card-muted)]"
                      : isCurrent
                        ? "bg-zinc-50/80 dark:bg-zinc-900/40"
                        : "active:bg-[var(--card-muted)]"
                  }`}
                >
                  <span
                    className={`text-sm ${hasActivity ? "font-semibold" : "text-zinc-400"}`}
                  >
                    {MONTH_NAMES[snap.month - 1].slice(0, 3)}
                    {isCurrent && (
                      <span className="ml-1.5 text-[10px] font-medium text-teal-600">
                        actual
                      </span>
                    )}
                  </span>

                  {hasActivity ? (
                    <>
                      <span className="text-right text-sm tabular-nums amount-positive">
                        {fmt(snap.summary.totalIncome)}
                      </span>
                      <span className="text-right text-sm tabular-nums amount-negative">
                        {fmt(snap.summary.totalExpenses)}
                      </span>
                      <span
                        className={`text-right text-sm font-bold tabular-nums ${positive ? "amount-positive" : "amount-negative"}`}
                      >
                        {fmt(snap.summary.disponible)}
                      </span>
                    </>
                  ) : (
                    <span className="col-span-3 text-right text-xs text-zinc-300 dark:text-zinc-600">
                      Sin nada
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 bg-[var(--card-muted)] px-4 py-3.5 text-sm">
          <span className="font-semibold text-zinc-500">
            Promedio
          </span>
          <span className="text-right font-bold tabular-nums amount-positive">
            {fmt(averages.totalIncome)}
          </span>
          <span className="text-right font-bold tabular-nums amount-negative">
            {fmt(averages.totalExpenses)}
          </span>
          <span
            className={`text-right font-extrabold tabular-nums ${averages.disponible >= 0 ? "amount-positive" : "amount-negative"}`}
          >
            {fmt(averages.disponible)}
          </span>
        </div>
      </div>

      <p className="text-center text-xs text-zinc-400">
        Tocá un mes para ver el día a día
      </p>
    </section>
  );
}

function IncomeMixCard({
  averages,
  fmt,
}: {
  averages: {
    passiveIncome: number;
    activeIncome: number;
    totalIncome: number;
    totalExpenses: number;
  };
  fmt: (n: number) => string;
}) {
  const { passiveIncome, activeIncome, totalIncome, totalExpenses } = averages;
  const hasIncome = totalIncome > 0;
  const gap = passiveIncome - activeIncome;
  const passiveShare = hasIncome ? (passiveIncome / totalIncome) * 100 : 0;
  const activeShare = hasIncome ? (activeIncome / totalIncome) * 100 : 0;
  const coverage =
    totalExpenses > 0 ? (passiveIncome / totalExpenses) * 100 : null;

  return (
    <div className="bento space-y-3">
      <div>
        <p className="text-sm font-semibold tracking-tight">
          De dónde sale tu plata
        </p>
        <p className="meta mt-0.5 text-xs">
          Promedio por mes: trabajo y rentas
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-[var(--card-muted)] px-3 py-2.5">
          <p className="text-[10px] font-semibold tracking-wide text-zinc-400 uppercase">
            Rentas
          </p>
          <p className="mt-0.5 text-sm font-bold tabular-nums amount-positive">
            {fmt(passiveIncome)}
          </p>
          {hasIncome && (
            <p className="mt-0.5 text-[10px] tabular-nums text-zinc-400">
              {passiveShare.toFixed(0)}% del total
            </p>
          )}
        </div>
        <div className="rounded-2xl bg-[var(--card-muted)] px-3 py-2.5">
          <p className="text-[10px] font-semibold tracking-wide text-zinc-400 uppercase">
            Trabajo
          </p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-zinc-800 dark:text-zinc-100">
            {fmt(activeIncome)}
          </p>
          {hasIncome && (
            <p className="mt-0.5 text-[10px] tabular-nums text-zinc-400">
              {activeShare.toFixed(0)}% del total
            </p>
          )}
        </div>
      </div>

      {hasIncome && (
        <div
          className="flex h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
          aria-hidden
        >
          <div
            className="bg-teal-600 transition-all"
            style={{ width: `${passiveShare}%` }}
          />
          <div
            className="bg-zinc-400 transition-all"
            style={{ width: `${activeShare}%` }}
          />
        </div>
      )}

      <dl className="space-y-2 text-sm">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-zinc-400">Rentas vs trabajo</dt>
          <dd
            className={`font-bold tabular-nums ${
              gap >= 0 ? "amount-positive" : "text-zinc-800 dark:text-zinc-100"
            }`}
          >
            {gap >= 0 ? "+" : "−"}
            {fmt(Math.abs(gap))}
          </dd>
        </div>
        {coverage !== null && (
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-zinc-400">¿Las rentas cubren los gastos?</dt>
            <dd className="font-bold tabular-nums">
              {coverage.toFixed(0)}%
            </dd>
          </div>
        )}
      </dl>

      {coverage !== null && (
        <p className="text-xs leading-relaxed text-zinc-400">
          {coverage >= 100
            ? "Con las rentas te alcanza para cubrir los gastos."
            : `Las rentas cubren el ${coverage.toFixed(0)}% de los gastos. El resto sale del trabajo.`}
        </p>
      )}
    </div>
  );
}

function MonthBucketCell({
  disponible,
  income,
  expenses,
  format,
  formatFlow,
  positive,
  bold = false,
}: {
  disponible: number;
  income: number;
  expenses: number;
  format: (n: number) => string;
  formatFlow?: (n: number) => string;
  positive: boolean;
  bold?: boolean;
}) {
  const flow = formatFlow ?? format;
  return (
    <span className="text-right">
      <span
        className={`block tabular-nums ${bold ? "font-bold" : "font-semibold"} text-sm ${positive ? "text-teal-600 dark:text-teal-400" : "text-red-500"}`}
      >
        {format(disponible)}
      </span>
      <span className="mt-0.5 block text-[10px] tabular-nums text-zinc-400">
        <span className="text-teal-600/80 dark:text-teal-400/80">↑{flow(income)}</span>
        {" · "}
        <span className="text-red-500/80">↓{flow(expenses)}</span>
      </span>
    </span>
  );
}

function AvgPill({
  label,
  value,
  fmt,
  formatter,
  tone,
}: {
  label: string;
  value: number;
  fmt?: (n: number) => string;
  formatter?: (n: number) => string;
  tone?: "income" | "expense" | "balance";
}) {
  const format = fmt ?? formatter ?? String;
  const colors =
    tone === "balance"
      ? value >= 0
        ? "text-teal-600 dark:text-teal-400"
        : "text-red-500"
      : tone === "income"
        ? "text-teal-600 dark:text-teal-400"
        : tone === "expense"
          ? "text-red-500"
          : "text-zinc-800 dark:text-zinc-100";

  return (
    <div className="bento px-3 py-3 text-center">
      <p className="text-[10px] font-semibold tracking-wide text-zinc-400 uppercase">
        {label}
      </p>
      <p className={`mt-1 text-sm font-bold tabular-nums ${colors}`}>
        {format(value)}
      </p>
    </div>
  );
}
