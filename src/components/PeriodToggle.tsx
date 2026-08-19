"use client";

import type { SummaryScope } from "@/lib/types";

const OPTIONS: { id: SummaryScope; label: string }[] = [
  { id: "month", label: "Mes" },
  { id: "year", label: "Año" },
];

export function PeriodToggle({
  scope,
  onChange,
}: {
  scope: SummaryScope;
  onChange: (scope: SummaryScope) => void;
}) {
  return (
    <div className="flex rounded-full bg-[var(--card-muted)] p-1">
      {OPTIONS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-all active:scale-95 ${
            scope === id
              ? "bg-[var(--card)] text-zinc-900 shadow-sm dark:text-white"
              : "text-zinc-400"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
