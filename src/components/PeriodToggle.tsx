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
    <div className="flex rounded-full bg-zinc-100 p-0.5 dark:bg-zinc-800">
      {OPTIONS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={`flex-1 rounded-full px-4 py-1.5 text-xs font-semibold transition-all active:scale-95 ${
            scope === id
              ? "bg-white text-emerald-700 shadow-sm dark:bg-zinc-900 dark:text-emerald-400"
              : "text-zinc-500"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
