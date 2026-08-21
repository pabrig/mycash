"use client";

import { useMemo } from "react";
import { useFinance } from "@/context/FinanceContext";
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
    ownMovements,
    rates,
    annualSummary,
    annualSummaryArs,
    sharedEnabled,
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
      computeMonthlyBreakdown(ownMovements, year, rates).slice(0, monthsShown),
    [ownMovements, year, rates, monthsShown],
  );

  const positive = annualSummaryArs.disponible >= 0;

  return (
    <section className="animate-slide-up mx-auto grid w-full max-w-5xl gap-4 md:gap-6">
      <div className="bento overflow-hidden !p-0">
        <div className="px-6 pt-7 pb-6">
          <p className="text-sm font-medium text-zinc-400">{copy.label}</p>
          <p
            className={`mt-2 text-5xl font-extrabold tracking-tighter tabular-nums md:text-6xl ${
              positive ? "text-zinc-900 dark:text-white" : "amount-negative"
            }`}
          >
            {formatArs(annualSummaryArs.disponible)}
          </p>
          <p
            className={`mt-2 text-xl font-semibold tabular-nums ${
              positive ? "text-zinc-500 dark:text-zinc-400" : "amount-negative"
            }`}
          >
            {formatUsd(annualSummary.disponible)}
          </p>
          <p className="meta mt-2">{copy.asOf}</p>
          <p className="meta mt-0.5">{copy.fx}</p>
          <p className="mt-3 text-xs leading-relaxed text-zinc-400">
            {copy.hint}
          </p>

          <div className="mt-6 space-y-2">
            <div
              className="flex h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
              aria-hidden
            >
              {rate.savedShare > 0 && (
                <div
                  className="bg-teal-500 transition-all"
                  style={{ width: `${rate.savedShare}%` }}
                />
              )}
              {rate.spentShare > 0 && (
                <div
                  className="bg-rose-400/80 transition-all"
                  style={{ width: `${rate.spentShare}%` }}
                />
              )}
            </div>
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
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

        {(mix || shared) && (
          <div className="space-y-5 border-t border-zinc-100 px-4 py-5 dark:border-zinc-800/80 sm:px-6">
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
                  swatch: "bg-teal-600",
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
                  swatch: "bg-rose-500",
                }}
                right={{
                  label: "Solo tuyo",
                  share: shared.personalShare,
                  swatch: "bg-rose-300",
                }}
              />
            )}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          {list.title}
        </h2>
        <p className="mt-0.5 text-xs text-zinc-400">{list.subtitle}</p>
      </div>

      <div className="bento overflow-hidden !p-0">
        <div className="grid grid-cols-[minmax(4.5rem,1fr)_1fr_1fr_1fr] gap-x-2 px-4 py-3 text-[10px] font-semibold tracking-wide text-zinc-400 uppercase">
          <span>Mes</span>
          <span className="text-right">Ingreso</span>
          <span className="text-right">Gasto</span>
          <span className="text-right">Ahorro</span>
        </div>

        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
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

            return (
              <li key={snap.month}>
                <button
                  type="button"
                  onClick={() => {
                    setPeriod(year, snap.month);
                    onOpenMonth(snap.month);
                  }}
                  className={`w-full px-4 py-3.5 text-left transition ${
                    isSelected
                      ? "bg-[var(--card-muted)]"
                      : "active:bg-[var(--card-muted)]"
                  }`}
                >
                  <div className="grid grid-cols-[minmax(4.5rem,1fr)_1fr_1fr_1fr] items-start gap-x-2">
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">
                        {MONTH_NAMES[snap.month - 1].slice(0, 3)}
                        {isCurrent && (
                          <span className="ml-1.5 text-[10px] font-medium text-teal-600">
                            hoy
                          </span>
                        )}
                      </span>
                      {hasActivity && (
                        <span className="mt-0.5 block text-[10px] tabular-nums text-zinc-400">
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
                      <span className="col-span-3 self-center text-right text-xs text-zinc-300 dark:text-zinc-600">
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

      <p className="text-center text-xs text-zinc-400">
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
      <p className="text-[11px] font-semibold tracking-wide text-zinc-400 uppercase">
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
        className="flex h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
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
      {caption && <p className="text-xs text-zinc-400">{caption}</p>}
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
      <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
        <span className={`h-2 w-2 shrink-0 rounded-full ${swatch}`} />
        {label}
      </p>
      <p className="mt-0.5 text-3xl font-extrabold tracking-tight tabular-nums text-zinc-900 dark:text-white">
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
      className={`rounded-2xl px-2.5 py-3 sm:px-3.5 ${
        emphasis
          ? "bg-teal-50 ring-1 ring-teal-500/15 dark:bg-teal-950/40 dark:ring-teal-400/20"
          : "bg-[var(--card)]"
      }`}
    >
      <p className="text-[11px] font-medium text-zinc-400">{label}</p>
      <p
        className={`mt-1 truncate text-sm font-bold tabular-nums sm:text-base ${color}`}
      >
        {ars}
      </p>
      <p className="mt-0.5 truncate text-[10px] tabular-nums text-zinc-400">
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
        className={`block truncate tabular-nums ${
          emphasis ? "text-sm font-bold" : "text-sm font-semibold"
        } ${color}`}
      >
        {ars}
      </span>
      <span className="mt-0.5 block truncate text-[10px] tabular-nums text-zinc-400">
        {usd}
      </span>
    </span>
  );
}
