"use client";

import { useMemo, useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { currentPeriod, isCurrentPeriod } from "@/lib/format";
import { MONTH_NAMES } from "@/lib/types";
import { DetailSheet } from "@/components/ui/DetailSheet";
import { IconChevronLeft, IconChevronRight } from "@/components/ui/Icons";

function monthsWithActivity(dates: string[], year: number): Set<number> {
  const set = new Set<number>();
  const prefix = `${year}-`;
  for (const date of dates) {
    if (!date.startsWith(prefix)) continue;
    set.add(Number(date.slice(5, 7)));
  }
  return set;
}

export function PeriodSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { year, month, setPeriod, movements, sharedMovements } = useFinance();
  const [draftYear, setDraftYear] = useState(year);
  const [resetKey, setResetKey] = useState(`${open}:${year}`);
  const now = currentPeriod();

  const activeMonths = useMemo(
    () =>
      monthsWithActivity(
        [...movements, ...sharedMovements].map((m) => m.date),
        draftYear,
      ),
    [movements, sharedMovements, draftYear],
  );

  const nextResetKey = `${open}:${year}`;
  if (nextResetKey !== resetKey) {
    setResetKey(nextResetKey);
    if (open) setDraftYear(year);
  }

  const showEsteMes = !isCurrentPeriod(year, month) || draftYear !== now.year;

  function selectMonth(m: number) {
    setPeriod(draftYear, m);
    onClose();
  }

  function goThisMonth() {
    setPeriod(now.year, now.month);
    onClose();
  }

  return (
    <DetailSheet open={open} onClose={onClose} title="Elegí el mes">
      <div className="flex items-center justify-between gap-2 py-2">
        <button
          type="button"
          onClick={() => setDraftYear((y) => y - 1)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--card-muted)] text-[var(--muted-fg)] transition active:scale-95"
          aria-label="Año anterior"
        >
          <IconChevronLeft className="h-5 w-5" />
        </button>
        <p className="text-lg font-bold tabular-nums tracking-tight">
          {draftYear}
        </p>
        <button
          type="button"
          onClick={() => setDraftYear((y) => y + 1)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--card-muted)] text-[var(--muted-fg)] transition active:scale-95"
          aria-label="Año siguiente"
        >
          <IconChevronRight className="h-5 w-5" />
        </button>
      </div>

      {showEsteMes && (
        <button
          type="button"
          onClick={goThisMonth}
          className="mb-3 w-full rounded-2xl py-2.5 text-center text-sm font-semibold text-primary"
        >
          Este mes
        </button>
      )}

      <div className="grid grid-cols-3 gap-2 pb-2">
        {MONTH_NAMES.map((name, i) => {
          const m = i + 1;
          const selected = draftYear === year && m === month;
          const isNow = draftYear === now.year && m === now.month;
          const hasActivity = activeMonths.has(m);

          return (
            <button
              key={name}
              type="button"
              onClick={() => selectMonth(m)}
              className={`relative flex flex-col items-center justify-center rounded-2xl py-3.5 text-sm transition-all active:scale-[0.97] ${ selected ? "bg-[var(--cta)] font-semibold text-[var(--cta-fg)]" : hasActivity ? "bg-[var(--card-muted)] font-semibold text-[var(--foreground)] dark:text-[var(--foreground)]" : "bg-[var(--card-muted)] text-[var(--muted-fg)]" }`}
            >
              {name.slice(0, 3)}
              {isNow && (
                <span
                  className={`absolute bottom-1.5 h-1 w-1 rounded-full ${ selected ? "bg-primary/70" : "bg-primary" }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </DetailSheet>
  );
}
