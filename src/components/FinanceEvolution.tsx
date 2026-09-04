"use client";

import {
  evolutionAxisLabel,
  evolutionBarHeights,
  financeEvolutionCopy,
  type MonthEvolutionPoint,
} from "@/lib/finance-analysis";

export function FinanceEvolution({
  points,
  selectedMonth,
  formatArs,
  onSelectMonth,
}: {
  points: MonthEvolutionPoint[];
  selectedMonth: number;
  formatArs: (amount: number) => string;
  onSelectMonth: (month: number) => void;
}) {
  const copy = financeEvolutionCopy();
  const heights = evolutionBarHeights(points);
  const hasAny = points.some((p) => p.movementCount > 0);

  return (
    <div className="bento space-y-4 !px-4 !py-5 sm:!px-6">
      <div>
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          {copy.title}
        </h2>
        <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">
          {copy.subtitle}
        </p>
      </div>

      {!hasAny ? (
        <p className="text-sm text-zinc-400">{copy.empty}</p>
      ) : (
        <>
          <div
            className="flex items-end gap-1.5 sm:gap-2"
            style={{ minHeight: "8.5rem" }}
            role="img"
            aria-label="Barras de lo que te quedó cada mes"
          >
            {points.map((point, index) => {
              const height = heights[index] ?? 0;
              const active = point.movementCount > 0;
              const selected = point.month === selectedMonth;
              const positive = point.disponible >= 0;
              const barColor = !active
                ? "bg-zinc-100 dark:bg-zinc-800"
                : positive
                  ? "bg-teal-500"
                  : "bg-rose-400";

              return (
                <button
                  key={point.month}
                  type="button"
                  onClick={() => onSelectMonth(point.month)}
                  className={`flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-xl px-0.5 py-1 transition ${
                    selected
                      ? "bg-[var(--card-muted)]"
                      : "active:bg-[var(--card-muted)]"
                  }`}
                  aria-label={
                    active
                      ? `${evolutionAxisLabel(point.month)}: ${formatArs(point.disponible)}`
                      : `${evolutionAxisLabel(point.month)}: sin movimientos`
                  }
                  aria-pressed={selected}
                >
                  <div
                    className="flex w-full flex-col justify-end"
                    style={{ height: "6.5rem" }}
                  >
                    <div
                      className={`mx-auto w-full max-w-[1.75rem] rounded-t-md transition-all ${barColor}`}
                      style={{
                        height: active ? `${height}%` : "0.25rem",
                        opacity: active ? 1 : 0.45,
                      }}
                    />
                  </div>
                  <span
                    className={`text-[10px] font-semibold tracking-wide uppercase ${
                      selected
                        ? "text-teal-700 dark:text-teal-300"
                        : "text-zinc-400"
                    }`}
                  >
                    {evolutionAxisLabel(point.month)}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-teal-500" aria-hidden />
              Te quedó
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-400" aria-hidden />
              Gastaste de más
            </span>
            <span className="text-zinc-300 dark:text-zinc-600">·</span>
            <span>Tocá un mes para verlo</span>
          </div>
        </>
      )}
    </div>
  );
}
