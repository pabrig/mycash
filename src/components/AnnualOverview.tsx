"use client";

import { useMemo, type ReactNode } from "react";
import { useFinance } from "@/context/FinanceContext";
import {
  useFormatMoney,
  useFormatUsd,
} from "@/hooks/useDisplayAmount";
import { currentPeriod, formatMoney } from "@/lib/format";
import { computeMonthlyBreakdown, getRateForMonth, monthlySummaryToUsd } from "@/lib/summary";
import { computeSplitMonthlyBreakdown, walletBucketToUsd } from "@/lib/wallet";
import { MONTH_NAMES } from "@/lib/types";
import type { MonthlyRate } from "@/lib/types";

export function AnnualOverview({
  onOpenMonth,
}: {
  onOpenMonth: (month: number) => void;
}) {
  const {
    walletMode,
    year,
    month,
    ownMovements,
    rates,
    annualSummary,
    annualSummaryArs,
    splitAnnualSummary,
    setPeriod,
    usdEnabled,
    displayCurrency,
  } = useFinance();
  const formatArs = useFormatMoney();
  const formatUsd = useFormatUsd();
  const preferUsd = usdEnabled && displayCurrency === "USD";

  const breakdown = useMemo(
    () => computeMonthlyBreakdown(ownMovements, year, rates),
    [ownMovements, year, rates],
  );

  const splitBreakdown = useMemo(
    () => computeSplitMonthlyBreakdown(ownMovements, year, rates),
    [ownMovements, year, rates],
  );

  const vidaArsYear = useMemo(
    () =>
      splitBreakdown.reduce(
        (acc, snap) => ({
          income: acc.income + snap.split.vida.income,
          expenses: acc.expenses + snap.split.vida.expenses,
        }),
        { income: 0, expenses: 0 },
      ),
    [splitBreakdown],
  );

  const now = currentPeriod();
  const mixSummary = preferUsd ? annualSummary : annualSummaryArs;
  const mixFmt = preferUsd ? formatUsd : formatArs;
  const mixHint = preferUsd
    ? "Al dólar de cierre de cada mes"
    : "En pesos de cada mes";

  if (walletMode === "split") {
    const { vida, ahorro, activeMonths } = splitAnnualSummary;

    return (
      <section className="animate-slide-up space-y-4">
        <YearHeader year={year} activeMonths={activeMonths} />

        <div className="space-y-3">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              Diario · ARS
            </p>
            <div className="grid grid-cols-2 gap-2">
              <AvgPill
                label="↑ Ingresos"
                primary={formatArs(vidaArsYear.income)}
                secondary={formatUsd(vida.income)}
                tone="income"
              />
              <AvgPill
                label="↓ Gastos"
                primary={formatArs(vidaArsYear.expenses)}
                secondary={formatUsd(vida.expenses)}
                tone="expense"
              />
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              Ahorro · USD
            </p>
            <div className="grid grid-cols-2 gap-2">
              <AvgPill
                label="↑ Entradas"
                primary={formatUsd(ahorro.income)}
                tone="income"
              />
              <AvgPill
                label="↓ Salidas"
                primary={formatUsd(ahorro.expenses)}
                tone="expense"
              />
            </div>
          </div>
        </div>

        <IncomeMixCard
          summary={mixSummary}
          fmt={mixFmt}
          hint={mixHint}
        />

        <div className="bento overflow-hidden !p-0">
          <div className="grid grid-cols-[4.75rem_1fr_1fr] gap-x-3 px-4 py-3 text-[10px] font-semibold tracking-wide text-zinc-400 uppercase">
            <span>Mes</span>
            <span className="text-right">Ingresos</span>
            <span className="text-right">Gastos</span>
          </div>

          <ul className="space-y-0.5 px-1.5 pb-2">
            {splitBreakdown.map((snap) => {
              const isCurrent =
                snap.year === now.year &&
                snap.month === now.month &&
                year === now.year;
              const isSelected = snap.month === month && year === snap.year;
              const hasActivity = snap.movementCount > 0;
              const rate = getRateForMonth(rates, snap.year, snap.month);
              const vidaUsd = walletBucketToUsd(snap.split.vida, rate);

              return (
                <li key={snap.month}>
                  <button
                    type="button"
                    onClick={() => {
                      setPeriod(year, snap.month);
                      onOpenMonth(snap.month);
                    }}
                    className={`w-full rounded-2xl px-3 py-3 text-left transition ${
                      isSelected
                        ? "bg-[var(--card-muted)]"
                        : "active:bg-[var(--card-muted)]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <MonthLabel
                        month={snap.month}
                        isCurrent={isCurrent}
                        hasActivity={hasActivity}
                        rate={null}
                      />
                      {hasActivity ? (
                        <span className="pt-0.5 text-[10px] tabular-nums text-zinc-400">
                          {isCurrent ? "dólar" : "cierre"}{" "}
                          {formatMoney(rate.usdToArs)}
                        </span>
                      ) : (
                        <span className="self-center text-xs text-zinc-300 dark:text-zinc-600">
                          Sin nada
                        </span>
                      )}
                    </div>

                    {hasActivity && (
                      <div className="mt-3 space-y-2.5">
                        <PocketRow
                          label="Diario"
                          income={
                            <FlowAmount
                              ars={snap.split.vida.income}
                              usd={vidaUsd.income}
                              preferUsd={false}
                              formatArs={formatArs}
                              formatUsd={formatUsd}
                              tone="income"
                            />
                          }
                          expenses={
                            <FlowAmount
                              ars={snap.split.vida.expenses}
                              usd={vidaUsd.expenses}
                              preferUsd={false}
                              formatArs={formatArs}
                              formatUsd={formatUsd}
                              tone="expense"
                            />
                          }
                        />
                        <PocketRow
                          label="Ahorro"
                          income={
                            <UsdAmount
                              amount={snap.split.ahorro.income}
                              formatUsd={formatUsd}
                              tone="income"
                            />
                          }
                          expenses={
                            <UsdAmount
                              amount={snap.split.ahorro.expenses}
                              formatUsd={formatUsd}
                              tone="expense"
                            />
                          }
                        />
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="bg-[var(--card-muted)] px-4 py-3.5">
            <p className="text-sm font-semibold text-zinc-500">Año</p>
            <div className="mt-3 space-y-2.5">
              <PocketRow
                label="Diario"
                income={
                  <FlowAmount
                    ars={vidaArsYear.income}
                    usd={vida.income}
                    preferUsd={false}
                    formatArs={formatArs}
                    formatUsd={formatUsd}
                    tone="income"
                    bold
                  />
                }
                expenses={
                  <FlowAmount
                    ars={vidaArsYear.expenses}
                    usd={vida.expenses}
                    preferUsd={false}
                    formatArs={formatArs}
                    formatUsd={formatUsd}
                    tone="expense"
                    bold
                  />
                }
              />
              <PocketRow
                label="Ahorro"
                income={
                  <UsdAmount
                    amount={ahorro.income}
                    formatUsd={formatUsd}
                    tone="income"
                    bold
                  />
                }
                expenses={
                  <UsdAmount
                    amount={ahorro.expenses}
                    formatUsd={formatUsd}
                    tone="expense"
                    bold
                  />
                }
              />
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-zinc-400">
          Tocá un mes para ver el día a día
        </p>
      </section>
    );
  }

  const { activeMonths } = annualSummary;
  const primary = preferUsd ? annualSummary : annualSummaryArs;
  const secondary = preferUsd ? annualSummaryArs : annualSummary;
  const primaryFmt = preferUsd ? formatUsd : formatArs;
  const secondaryFmt = preferUsd ? formatArs : formatUsd;

  return (
    <section className="animate-slide-up space-y-4">
      <YearHeader year={year} activeMonths={activeMonths} />

      <div className="grid grid-cols-2 gap-2">
        <AvgPill
          label="Ingresos"
          primary={primaryFmt(primary.totalIncome)}
          secondary={secondaryFmt(secondary.totalIncome)}
          tone="income"
        />
        <AvgPill
          label="Gastos"
          primary={primaryFmt(primary.totalExpenses)}
          secondary={secondaryFmt(secondary.totalExpenses)}
          tone="expense"
        />
      </div>

      <IncomeMixCard
        summary={mixSummary}
        fmt={mixFmt}
        hint={mixHint}
      />

      <div className="bento overflow-hidden !p-0">
        <div className="grid grid-cols-[minmax(3.5rem,1fr)_1fr_1fr] gap-x-3 px-4 py-3 text-[10px] font-semibold tracking-wide text-zinc-400 uppercase">
          <span>Mes</span>
          <span className="text-right">Ingresos</span>
          <span className="text-right">Gastos</span>
        </div>

        <ul className="space-y-0.5 px-1.5 pb-2">
          {breakdown.map((snap) => {
            const isCurrent =
              snap.year === now.year &&
              snap.month === now.month &&
              year === now.year;
            const isSelected = snap.month === month && year === snap.year;
            const hasActivity = snap.movementCount > 0;
            const rate = getRateForMonth(rates, snap.year, snap.month);
            const usd = monthlySummaryToUsd(snap.summary, rate);

            return (
              <li key={snap.month}>
                <button
                  type="button"
                  onClick={() => {
                    setPeriod(year, snap.month);
                    onOpenMonth(snap.month);
                  }}
                  className={`grid w-full grid-cols-[minmax(3.5rem,1fr)_1fr_1fr] gap-x-3 rounded-2xl px-3 py-3 text-left transition ${
                    isSelected
                      ? "bg-[var(--card-muted)]"
                      : isCurrent
                        ? "bg-zinc-50/80 dark:bg-zinc-900/40"
                        : "active:bg-[var(--card-muted)]"
                  }`}
                >
                  <MonthLabel
                    month={snap.month}
                    isCurrent={isCurrent}
                    hasActivity={hasActivity}
                    rate={hasActivity ? rate : null}
                  />

                  {hasActivity ? (
                    <>
                      <FlowAmount
                        ars={snap.summary.totalIncome}
                        usd={usd.totalIncome}
                        preferUsd={preferUsd}
                        formatArs={formatArs}
                        formatUsd={formatUsd}
                        tone="income"
                      />
                      <FlowAmount
                        ars={snap.summary.totalExpenses}
                        usd={usd.totalExpenses}
                        preferUsd={preferUsd}
                        formatArs={formatArs}
                        formatUsd={formatUsd}
                        tone="expense"
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

        <div className="grid grid-cols-[minmax(3.5rem,1fr)_1fr_1fr] gap-x-3 bg-[var(--card-muted)] px-4 py-3.5">
          <span className="self-center text-sm font-semibold text-zinc-500">Año</span>
          <FlowAmount
            ars={annualSummaryArs.totalIncome}
            usd={annualSummary.totalIncome}
            preferUsd={preferUsd}
            formatArs={formatArs}
            formatUsd={formatUsd}
            tone="income"
            bold
          />
          <FlowAmount
            ars={annualSummaryArs.totalExpenses}
            usd={annualSummary.totalExpenses}
            preferUsd={preferUsd}
            formatArs={formatArs}
            formatUsd={formatUsd}
            tone="expense"
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

function YearHeader({
  year,
  activeMonths,
}: {
  year: number;
  activeMonths: number;
}) {
  const monthLabel =
    activeMonths === 1 ? "mes con algo anotado" : "meses con algo anotado";

  return (
    <div>
      <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
        Mes a mes · {year}
      </h2>
      <p className="mt-0.5 text-xs text-zinc-400">
        {activeMonths} {monthLabel} · pesos de cada mes, dólares al cierre
      </p>
    </div>
  );
}

function MonthLabel({
  month,
  isCurrent,
  hasActivity,
  rate,
}: {
  month: number;
  isCurrent: boolean;
  hasActivity: boolean;
  rate: MonthlyRate | null;
}) {
  return (
    <span className="min-w-0 self-center">
      <span
        className={`block text-sm ${hasActivity ? "font-semibold" : "text-zinc-400"}`}
      >
        {MONTH_NAMES[month - 1].slice(0, 3)}
        {isCurrent && (
          <span className="ml-1.5 text-[10px] font-medium text-teal-600">
            actual
          </span>
        )}
      </span>
      {rate && (
        <span className="mt-0.5 block text-[10px] tabular-nums text-zinc-400">
          {isCurrent ? "dólar" : "cierre"} {formatMoney(rate.usdToArs)}
        </span>
      )}
    </span>
  );
}

function FlowAmount({
  ars,
  usd,
  preferUsd,
  formatArs,
  formatUsd,
  tone,
  bold = false,
}: {
  ars: number;
  usd: number;
  preferUsd: boolean;
  formatArs: (n: number) => string;
  formatUsd: (n: number) => string;
  tone: "income" | "expense";
  bold?: boolean;
}) {
  const primary = preferUsd ? formatUsd(usd) : formatArs(ars);
  const secondary = preferUsd ? formatArs(ars) : formatUsd(usd);
  const color = tone === "income" ? "amount-positive" : "amount-negative";

  return (
    <span className="min-w-0 text-right">
      <span
        className={`block truncate tabular-nums ${bold ? "font-bold" : "font-semibold"} text-sm ${color}`}
      >
        {primary}
      </span>
      <span className="mt-0.5 block truncate text-[10px] tabular-nums text-zinc-400">
        {secondary}
      </span>
    </span>
  );
}

function IncomeMixCard({
  summary,
  fmt,
  hint,
}: {
  summary: {
    passiveIncome: number;
    activeIncome: number;
    totalIncome: number;
    totalExpenses: number;
  };
  fmt: (n: number) => string;
  hint: string;
}) {
  const { passiveIncome, activeIncome, totalIncome, totalExpenses } = summary;
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
        <p className="meta mt-0.5 text-xs">{hint}</p>
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
            className="bg-cyan-400 transition-all"
            style={{ width: `${passiveShare}%` }}
          />
          <div
            className="bg-teal-600 transition-all"
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

function PocketRow({
  label,
  income,
  expenses,
}: {
  label: string;
  income: ReactNode;
  expenses: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[4.75rem_1fr_1fr] items-start gap-x-3">
      <span className="pt-0.5 text-[11px] font-semibold text-zinc-500">
        {label}
      </span>
      {income}
      {expenses}
    </div>
  );
}

function UsdAmount({
  amount,
  formatUsd,
  tone,
  bold = false,
}: {
  amount: number;
  formatUsd: (n: number) => string;
  tone: "income" | "expense";
  bold?: boolean;
}) {
  const color = tone === "income" ? "amount-positive" : "amount-negative";
  return (
    <span
      className={`block truncate text-right text-sm tabular-nums ${bold ? "font-bold" : "font-semibold"} ${color}`}
    >
      {formatUsd(amount)}
    </span>
  );
}

function AvgPill({
  label,
  primary,
  secondary,
  tone,
}: {
  label: string;
  primary: string;
  secondary?: string | null;
  tone?: "income" | "expense";
}) {
  const colors =
    tone === "income"
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
        {primary}
      </p>
      {secondary && (
        <p className="mt-0.5 text-[10px] tabular-nums text-zinc-400">
          {secondary}
        </p>
      )}
    </div>
  );
}
