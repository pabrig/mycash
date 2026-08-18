"use client";

import { useFinance } from "@/context/FinanceContext";
import { formatMonth } from "@/lib/format";
import { CurrencyToggle } from "@/components/CurrencyToggle";
import Link from "next/link";

export function AppHeader() {
  const { year, month, setPeriod, walletMode } = useFinance();

  function shift(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    setPeriod(y, m);
  }

  return (
    <header className="mb-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
            Myca$h
          </p>
          <div className="mt-0.5 flex items-center gap-1">
            <button
              type="button"
              onClick={() => shift(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg shadow-sm active:scale-95 dark:bg-zinc-900"
              aria-label="Mes anterior"
            >
              ‹
            </button>
            <h1 className="min-w-[8rem] text-center text-lg font-bold">
              {formatMonth(year, month)}
            </h1>
            <button
              type="button"
              onClick={() => shift(1)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg shadow-sm active:scale-95 dark:bg-zinc-900"
              aria-label="Mes siguiente"
            >
              ›
            </button>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {walletMode === "unified" && <CurrencyToggle />}
          <Link
            href="/cuenta"
            className="rounded-lg bg-white px-2.5 py-1 text-xs text-zinc-500 shadow-sm active:scale-95 dark:bg-zinc-900"
          >
            Cuenta
          </Link>
        </div>
      </div>
    </header>
  );
}
