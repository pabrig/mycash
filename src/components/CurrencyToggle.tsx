"use client";

import { useFinance } from "@/context/FinanceContext";

export function CurrencyToggle() {
  const { displayCurrency, setDisplayCurrency } = useFinance();

  return (
    <div className="flex rounded-full bg-zinc-100 p-0.5 dark:bg-zinc-800">
      {(["ARS", "USD"] as const).map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => setDisplayCurrency(c)}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition-all active:scale-95 ${
            displayCurrency === c
              ? "bg-white text-emerald-700 shadow-sm dark:bg-zinc-900 dark:text-emerald-400"
              : "text-zinc-500"
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
