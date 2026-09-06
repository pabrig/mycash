"use client";

import { useMemo } from "react";
import { SharedSpendHero } from "@/components/SharedSpendHero";
import { useAuth } from "@/context/AuthContext";
import { useFinance } from "@/context/FinanceContext";
import { useFormatMoney, useFormatUsd } from "@/hooks/useDisplayAmount";
import { currentPeriod } from "@/lib/format";
import { sharedMonthListCopy, sharedYearHeroCopy } from "@/lib/shared-copy";
import {
  computeSharedMonthlyBreakdown,
  computeSharedPeriodSummary,
  householdSharedMovements,
} from "@/lib/shared-summary";
import { filterByYear } from "@/lib/summary";
import { MONTH_NAMES } from "@/lib/types";
import { visibleMonthCount } from "@/lib/annual-copy";

export function SharedYearReview({
  onOpenMonth,
}: {
  onOpenMonth: (month: number) => void;
}) {
  const { household } = useAuth();
  const { year, month, sharedMovements, rates, cloudEnabled, setPeriod } =
    useFinance();
  const formatArs = useFormatMoney();
  const formatUsd = useFormatUsd();

  const ofGroup = useMemo(
    () =>
      householdSharedMovements(sharedMovements, household?.id, cloudEnabled),
    [sharedMovements, household?.id, cloudEnabled],
  );

  const yearMovements = useMemo(
    () => filterByYear(ofGroup, year),
    [ofGroup, year],
  );

  const summary = useMemo(
    () => computeSharedPeriodSummary(yearMovements, rates),
    [yearMovements, rates],
  );

  const monthsShown = visibleMonthCount(year);
  const breakdown = useMemo(
    () =>
      computeSharedMonthlyBreakdown(yearMovements, year, rates).slice(
        0,
        monthsShown,
      ),
    [yearMovements, year, rates, monthsShown],
  );

  const now = currentPeriod();
  const copy = sharedYearHeroCopy(year, summary.activeMonths);
  const list = sharedMonthListCopy();

  return (
    <section className="animate-slide-up mx-auto grid w-full max-w-5xl gap-4 md:gap-6">
      <SharedSpendHero
        copy={copy}
        totalArs={summary.totalArs}
        totalUsd={summary.totalUsd}
        categories={summary.categories}
        formatArs={formatArs}
        formatUsd={formatUsd}
      />

      <div>
        <h2 className="text-sm font-semibold text-[var(--foreground)] dark:text-[var(--foreground)]">
          {list.title}
        </h2>
        <p className="mt-0.5 text-xs text-[var(--muted-fg)]">{list.subtitle}</p>
      </div>

      <div className="bento overflow-hidden !p-0">
        <div className="grid grid-cols-[minmax(4.5rem,1fr)_1fr] gap-x-2 px-4 py-3 text-[10px] font-semibold tracking-wide text-[var(--muted-fg)] uppercase">
          <span>Mes</span>
          <span className="text-right">Total</span>
        </div>

        <ul className="divide-y divide-[var(--card-border)]/80">
          {breakdown.map((snap) => {
            const isCurrent =
              snap.year === now.year &&
              snap.month === now.month &&
              year === now.year;
            const isSelected = snap.month === month && year === snap.year;
            const hasActivity = snap.movementCount > 0;

            return (
              <li key={snap.month}>
                <button
                  type="button"
                  onClick={() => {
                    setPeriod(year, snap.month);
                    onOpenMonth(snap.month);
                  }}
                  className={`w-full px-4 py-3.5 text-left transition ${ isSelected ? "bg-[var(--card-muted)]" : "active:bg-[var(--card-muted)]" }`}
                >
                  <div className="grid grid-cols-[minmax(4.5rem,1fr)_1fr] items-start gap-x-2">
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">
                        {MONTH_NAMES[snap.month - 1].slice(0, 3)}
                        {isCurrent && (
                          <span className="ml-1.5 text-[10px] font-medium text-primary">
                            hoy
                          </span>
                        )}
                      </span>
                    </span>

                    {hasActivity ? (
                      <span className="min-w-0 text-right">
                        <span className="block truncate text-sm font-semibold tabular-nums amount-negative">
                          {formatArs(snap.totalArs)}
                        </span>
                        <span className="mt-0.5 block truncate text-[10px] tabular-nums text-[var(--muted-fg)]">
                          {formatUsd(snap.totalUsd)}
                        </span>
                      </span>
                    ) : (
                      <span className="self-center text-right text-xs text-[var(--muted-fg)] dark:text-[var(--muted-fg)]">
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
