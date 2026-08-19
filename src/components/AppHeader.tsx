"use client";

import { useState } from "react";
import Link from "next/link";
import { useFinance } from "@/context/FinanceContext";
import { formatMonth, shiftPeriod } from "@/lib/format";
import { CurrencyToggle } from "@/components/CurrencyToggle";
import { PeriodSheet } from "@/components/PeriodSheet";
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconMyCash,
  IconSplit,
  IconUser,
} from "@/components/ui/Icons";

export function AppHeader() {
  const { year, month, setPeriod, walletMode } = useFinance();
  const [periodOpen, setPeriodOpen] = useState(false);

  function shift(delta: number) {
    const next = shiftPeriod(year, month, delta);
    setPeriod(next.year, next.month);
  }

  return (
    <header className="mb-4 animate-fade-in md:mb-2">
      {/* Mobile */}
      <div className="flex items-center justify-between gap-3 md:hidden">
        <div className="flex min-w-0 items-center gap-2.5">
          <IconMyCash className="h-8 w-8 shrink-0" />
          <button
            type="button"
            onClick={() => setPeriodOpen(true)}
            className="flex min-w-0 items-center gap-1 rounded-full py-1 pr-1.5 transition active:scale-[0.98] active:bg-zinc-200/60 dark:active:bg-zinc-800"
            aria-haspopup="dialog"
            aria-label={`Periodo ${formatMonth(year, month)}. Cambiar mes`}
          >
            <h1 className="truncate text-xl font-bold tracking-tight">
              {formatMonth(year, month)}
            </h1>
            <IconChevronDown className="h-4 w-4 shrink-0 text-zinc-400" />
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {walletMode === "unified" && <CurrencyToggle />}
          <Link
            href="/dividir"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--card)] text-zinc-500 transition active:scale-95"
            aria-label="Dividir cuenta"
          >
            <IconSplit className="h-5 w-5" />
          </Link>
          <Link
            href="/cuenta"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--card)] text-zinc-500 transition active:scale-95"
            aria-label="Cuenta"
          >
            <IconUser className="h-5 w-5" />
          </Link>
        </div>
      </div>

      <PeriodSheet open={periodOpen} onClose={() => setPeriodOpen(false)} />

      {/* Desktop — stepper centrado */}
      <div className="hidden md:flex md:flex-col md:items-center md:gap-1">
        <p className="text-xs font-medium text-zinc-400">Periodo</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shift(-1)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--card)] text-zinc-500 transition hover:text-zinc-900 active:scale-95 dark:hover:text-white"
            aria-label="Mes anterior"
          >
            <IconChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="min-w-[12rem] text-center text-2xl font-bold tracking-tight lg:text-3xl">
            {formatMonth(year, month)}
          </h1>
          <button
            type="button"
            onClick={() => shift(1)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--card)] text-zinc-500 transition hover:text-zinc-900 active:scale-95 dark:hover:text-white"
            aria-label="Mes siguiente"
          >
            <IconChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
