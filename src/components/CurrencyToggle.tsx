"use client";

import { useFinance } from "@/context/FinanceContext";

export function CurrencyToggle() {
  const { displayCurrency, setDisplayCurrency, usdEnabled } = useFinance();

  if (!usdEnabled) return null;

  return (
    <div className="flex rounded-full bg-[var(--card-muted)] p-1">
      {(["ARS", "USD"] as const).map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => setDisplayCurrency(c)}
          className={`rounded-full px-3 py-2 text-xs font-bold tracking-wide transition-all active:scale-95 ${
            displayCurrency === c
              ? "bg-[var(--card)] text-zinc-900 shadow-sm dark:text-white"
              : "text-zinc-400"
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
