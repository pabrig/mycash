"use client";

import { useMemo } from "react";
import { useFinance } from "@/context/FinanceContext";
import { FinanceEvolution } from "@/components/FinanceEvolution";
import { FinanceInsights } from "@/components/FinanceInsights";
import { SharedCategoryMix } from "@/components/SharedCategoryMix";
import { useFormatMoney, useFormatUsd } from "@/hooks/useDisplayAmount";
import { currentPeriod, formatMoney } from "@/lib/format";
import {
  incomeMixCopy,
  savingsRateCopy,
  sharedYearCopy,
  visibleMonthCount,
  yearHeroCopy,
  yearListCopy,
} from "@/lib/annual-copy";
import { goalsYearNoteCopy } from "@/lib/goals-copy";
import { projectedYearReserved } from "@/lib/goals";
import { isFeatureEnabled } from "@/lib/feature-flags";
import {
  buildFinanceInsights,
  buildMonthEvolution,
  computeExpenseCategoryMix,
  financeCategoryCopy,
  monthDeltaCopy,
  monthDeltaTone,
} from "@/lib/finance-analysis";
import {
  computeMonthlyBreakdown,
  getRateForMonth,
  monthlySummaryToUsd,
} from "@/lib/summary";
import { MONTH_NAMES } from "@/lib/types";

export function YearReview({
  onOpenMonth,
}: {
  onOpenMonth: (month: number) => void;
}) {
  const {
    year,
    month,
    balanceMovements,
    rates,
    annualSummary,
    annualSummaryArs,
    sharedEnabled,
    goalsEnabled,
    savingsGoals,
    goalsReservedArs,
    setPeriod,
  } = useFinance();
  const formatArs = useFormatMoney();
  const formatUsd = useFormatUsd();

  const now = currentPeriod();
  const copy = yearHeroCopy(year, annualSummary.activeMonths);
  const list = yearListCopy();
  const rate = savingsRateCopy(
    annualSummaryArs.totalIncome,
    annualSummaryArs.disponible,
  );
  const mix = incomeMixCopy(
    annualSummaryArs.passiveIncome,
    annualSummaryArs.totalIncome,
  );
  const shared = sharedEnabled
    ? sharedYearCopy(
        annualSummaryArs.sharedExpenses,
        annualSummaryArs.totalExpenses,
      )
    : null;

  const monthsShown = visibleMonthCount(year);
  const breakdown = useMemo(
    () =>
      computeMonthlyBreakdown(balanceMovements, year, rates).slice(
        0,
        monthsShown,
      ),
    [balanceMovements, year, rates, monthsShown],
  );

  const evolution = useMemo(
    () => buildMonthEvolution(breakdown, monthsShown),
    [breakdown, monthsShown],
  );

  const categories = useMemo(
    () => computeExpenseCategoryMix(balanceMovements, year, rates),
    [balanceMovements, year, rates],
  );

  const insights = useMemo(
    () =>
      buildFinanceInsights(
        evolution,
        categories,
        annualSummaryArs.totalIncome,
        annualSummaryArs.disponible,
      ),
    [
      evolution,
      categories,
      annualSummaryArs.totalIncome,
      annualSummaryArs.disponible,
    ],
  );

  const categoryCopy = financeCategoryCopy();

  const goalsYear = useMemo(() => {
    if (!isFeatureEnabled("savingsGoals") || !goalsEnabled) return null;
    const yearProjected = projectedYearReserved(goalsReservedArs, year);
    return goalsYearNoteCopy({
      goals: savingsGoals,
      yearDisponibleArs: annualSummaryArs.disponible,
      monthlyReservedArs: goalsReservedArs,
      yearProjectedReservedArs: yearProjected,
      formatArs,
    });
  }, [
    goalsEnabled,
    savingsGoals,
    goalsReservedArs,
    year,
    annualSummaryArs.disponible,
    formatArs,
  ]);

  const openMonth = (nextMonth: number) => {
    setPeriod(year, nextMonth);
    onOpenMonth(nextMonth);
  };

  const positive = annualSummaryArs.disponible >= 0;

  return (
    <section className="animate-slide-up mx-auto grid w-full max-w-5xl gap-4 md:gap-6">
      <div className="bento overflow-hidden !p-0">
        <div className="px-6 pt-7 pb-6">
          <p className="text-sm font-medium text-[var(--muted-fg)]">
            {copy.label}
          </p>
          <p
            className={`mt-2 text-5xl font-extrabold tracking-tighter tabular-nums md:text-6xl ${positive ? "text-[var(--foreground)]" : "amount-negative"}`}
          >
            {formatArs(annualSummaryArs.disponible)}
          </p>
          <p
            className={`mt-2 text-xl font-semibold tabular-nums ${positive ? "text-[var(--muted-fg)] dark:text-[var(--muted-fg)]" : "amount-negative"}`}
          >
            {formatUsd(annualSummary.disponible)}
          </p>
          <p className="meta mt-2">{copy.asOf}</p>
          <p className="meta mt-0.5">{copy.fx}</p>
          <p className="mt-3 text-xs leading-relaxed text-[var(--muted-fg)]">
            {copy.hint}
          </p>

          <div className="mt-6 space-y-2">
            <div
              className="flex h-1.5 overflow-hidden rounded-full bg-[var(--card-muted)]"
              aria-hidden
            >
              {rate.savedShare > 0 && (
                <div
                  className="bg-income transition-all"
                  style={{ width: `${rate.savedShare}%` }}
                />
              )}
              {rate.spentShare > 0 && (
                <div
                  className="bg-[var(--expense)]/80 transition-all"
                  style={{ width: `${rate.spentShare}%` }}
                />
              )}
            </div>
            <p className="text-sm font-medium text-[var(--muted-fg)]">
              {rate.line}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 bg-[var(--card-muted)] px-3 py-4 sm:px-4">
          <Pillar
            label="Ingreso"
            ars={formatArs(annualSummaryArs.totalIncome)}
            usd={formatUsd(annualSummary.totalIncome)}
            tone="income"
          />
          <Pillar
            label="Gasto"
            ars={formatArs(annualSummaryArs.totalExpenses)}
            usd={formatUsd(annualSummary.totalExpenses)}
            tone="expense"
          />
          <Pillar
            label="Ahorro"
            ars={formatArs(annualSummaryArs.disponible)}
            usd={formatUsd(annualSummary.disponible)}
            tone={positive ? "income" : "expense"}
            emphasis
          />
        </div>

        {(mix || shared || goalsYear) && (
          <div className="space-y-5 border-t border-[var(--card-border)] px-4 py-5 dark:border-[var(--card-border)]/80 sm:px-6">
            {mix && (
              <ShareBlock
                title="De dónde entra"
                left={{
                  label: "Rentas",
                  share: mix.passiveShare,
                  swatch: "bg-cyan-400",
                }}
                right={{
                  label: "Trabajo",
                  share: mix.activeShare,
                  swatch: "bg-primary",
                }}
              />
            )}
            {shared && (
              <ShareBlock
                title="De los gastos"
                caption={shared.caption}
                left={{
                  label: "Con otros",
                  share: shared.sharedShare,
                  swatch: "bg-[var(--expense)]",
                }}
                right={{
                  label: "Solo tuyo",
                  share: shared.personalShare,
                  swatch: "bg-[var(--expense)]/70",
                }}
              />
            )}
            {goalsYear ? (
              <div>
                <p className="text-[11px] font-medium text-[var(--muted-fg)]">
                  {goalsYear.title}
                </p>
                <p className="mt-1 text-sm font-medium text-[var(--muted-fg)]">
                  {goalsYear.progress}
                </p>
                {goalsYear.planLine ? (
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted-fg)]">
                    {goalsYear.planLine}
                  </p>
                ) : null}
                {goalsYear.freeLine ? (
                  <p className="mt-0.5 text-xs leading-relaxed text-[var(--muted-fg)]">
                    {goalsYear.freeLine}
                  </p>
                ) : null}
                <p className="mt-1.5 text-[11px] leading-snug text-[var(--muted-fg)]">
                  {goalsYear.hint}
                </p>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <FinanceInsights insights={insights} />

      <FinanceEvolution
        points={evolution}
        selectedMonth={month}
        formatArs={formatArs}
        onSelectMonth={openMonth}
      />

      {categories.length > 0 && (
        <div className="bento !px-4 !py-5 sm:!px-6">
          <SharedCategoryMix
            categories={categories}
            formatArs={formatArs}
            formatUsd={formatUsd}
            title={categoryCopy.title}
            empty={categoryCopy.empty}
          />
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-[var(--foreground)] dark:text-[var(--foreground)]">
          {list.title}
        </h2>
        <p className="mt-0.5 text-xs text-[var(--muted-fg)]">{list.subtitle}</p>
      </div>

      <div className="bento overflow-hidden !p-0">
        <div className="grid grid-cols-[minmax(4.5rem,1fr)_1fr_1fr_1fr] gap-x-2 px-4 py-3 text-[10px] font-semibold tracking-wide text-[var(--muted-fg)] uppercase">
          <span>Mes</span>
          <span className="text-right">Ingreso</span>
          <span className="text-right">Gasto</span>
          <span className="text-right">Ahorro</span>
        </div>

        <ul className="divide-y divide-[var(--card-border)]/80">
          {breakdown.map((snap) => {
            const isCurrent =
              snap.year === now.year &&
              snap.month === now.month &&
              year === now.year;
            const isSelected = snap.month === month && year === snap.year;
            const hasActivity = snap.movementCount > 0;
            const monthRate = getRateForMonth(rates, snap.year, snap.month);
            const usd = monthlySummaryToUsd(snap.summary, monthRate);
            const savedPositive = snap.summary.disponible >= 0;
            const point = evolution.find((p) => p.month === snap.month);
            const delta = monthDeltaCopy(point?.vsPrevDisponible ?? null);
            const deltaTone = monthDeltaTone(point?.vsPrevDisponible ?? null);

            return (
              <li key={snap.month}>
                <button
                  type="button"
                  onClick={() => openMonth(snap.month)}
                  className={`w-full px-4 py-3.5 text-left transition ${isSelected ? "bg-[var(--card-muted)]" : "active:bg-[var(--card-muted)]"}`}
                >
                  <div className="grid grid-cols-[minmax(4.5rem,1fr)_1fr_1fr_1fr] items-start gap-x-2">
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">
                        {MONTH_NAMES[snap.month - 1].slice(0, 3)}
                        {isCurrent && (
                          <span className="ml-1.5 text-[10px] font-medium text-primary">
                            hoy
                          </span>
                        )}
                      </span>
                      {hasActivity && delta && (
                        <span
                          className={`mt-0.5 block text-[10px] font-medium tabular-nums ${deltaTone === "positive" ? "text-primary" : deltaTone === "warning" ? "text-[var(--expense)]" : "text-[var(--muted-fg)]"}`}
                        >
                          {delta === "Igual"
                            ? "Igual al mes ant."
                            : `Vs ant. ${delta}`}
                        </span>
                      )}
                      {hasActivity && !delta && (
                        <span className="mt-0.5 block text-[10px] tabular-nums text-[var(--muted-fg)]">
                          {isCurrent ? "dólar" : "cierre"}{" "}
                          {formatMoney(monthRate.usdToArs)}
                        </span>
                      )}
                    </span>

                    {hasActivity ? (
                      <>
                        <MiniFlow
                          ars={formatArs(snap.summary.totalIncome)}
                          usd={formatUsd(usd.totalIncome)}
                          tone="income"
                        />
                        <MiniFlow
                          ars={formatArs(snap.summary.totalExpenses)}
                          usd={formatUsd(usd.totalExpenses)}
                          tone="expense"
                        />
                        <MiniFlow
                          ars={formatArs(snap.summary.disponible)}
                          usd={formatUsd(usd.disponible)}
                          tone={savedPositive ? "income" : "expense"}
                          emphasis
                        />
                      </>
                    ) : (
                      <span className="col-span-3 self-center text-right text-xs text-[var(--muted-fg)] dark:text-[var(--muted-fg)]">
                        Sin nada
                      </span>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="text-center text-xs text-[var(--muted-fg)]">
        Tocá un mes para ver el día a día
      </p>
    </section>
  );
}

function ShareBlock({
  title,
  caption,
  left,
  right,
}: {
  title: string;
  caption?: string;
  left: { label: string; share: number; swatch: string };
  right: { label: string; share: number; swatch: string };
}) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold tracking-wide text-[var(--muted-fg)] uppercase">
        {title}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <ShareStat label={left.label} share={left.share} swatch={left.swatch} />
        <ShareStat
          label={right.label}
          share={right.share}
          swatch={right.swatch}
        />
      </div>
      <div
        className="flex h-2 overflow-hidden rounded-full bg-[var(--card-muted)]"
        aria-hidden
      >
        {left.share > 0 && (
          <div
            className={`${left.swatch} transition-all`}
            style={{ width: `${left.share}%` }}
          />
        )}
        {right.share > 0 && (
          <div
            className={`${right.swatch} transition-all`}
            style={{ width: `${right.share}%` }}
          />
        )}
      </div>
      {caption && <p className="text-xs text-[var(--muted-fg)]">{caption}</p>}
    </div>
  );
}

function ShareStat({
  label,
  share,
  swatch,
}: {
  label: string;
  share: number;
  swatch: string;
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs font-medium text-[var(--muted-fg)]">
        <span className={`h-2 w-2 shrink-0 rounded-full ${swatch}`} />
        {label}
      </p>
      <p className="mt-0.5 text-3xl font-extrabold tracking-tight tabular-nums text-[var(--foreground)]">
        {share.toFixed(0)}%
      </p>
    </div>
  );
}

function Pillar({
  label,
  ars,
  usd,
  tone,
  emphasis = false,
}: {
  label: string;
  ars: string;
  usd: string;
  tone: "income" | "expense";
  emphasis?: boolean;
}) {
  const color = tone === "income" ? "amount-positive" : "amount-negative";

  return (
    <div
      className={`rounded-2xl px-2.5 py-3 sm:px-3.5 ${emphasis ? "bg-income/10 ring-1 ring-income/20" : "bg-[var(--card)]"}`}
    >
      <p className="text-[11px] font-medium text-[var(--muted-fg)]">{label}</p>
      <p
        className={`mt-1 truncate text-sm font-bold tabular-nums sm:text-base ${color}`}
      >
        {ars}
      </p>
      <p className="mt-0.5 truncate text-[10px] tabular-nums text-[var(--muted-fg)]">
        {usd}
      </p>
    </div>
  );
}

function MiniFlow({
  ars,
  usd,
  tone,
  emphasis = false,
}: {
  ars: string;
  usd: string;
  tone: "income" | "expense";
  emphasis?: boolean;
}) {
  const color = tone === "income" ? "amount-positive" : "amount-negative";

  return (
    <span className="min-w-0 text-right">
      <span
        className={`block truncate tabular-nums ${emphasis ? "text-sm font-bold" : "text-sm font-semibold"} ${color}`}
      >
        {ars}
      </span>
      <span className="mt-0.5 block truncate text-[10px] tabular-nums text-[var(--muted-fg)]">
        {usd}
      </span>
    </span>
  );
}
