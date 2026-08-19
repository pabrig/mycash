"use client";

import Link from "next/link";
import { useFinance } from "@/context/FinanceContext";
import { formatMonth } from "@/lib/format";
import { CurrencyToggle } from "@/components/CurrencyToggle";
import {
  IconChevronLeft,
  IconChevronRight,
  IconUser,
} from "@/components/ui/Icons";

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
    <header className="mb-4 animate-fade-in md:mb-2">
      {/* Mobile */}
      <div className="flex items-center justify-between gap-3 md:hidden">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
            Myca$h
          </p>
          <div className="mt-1 flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => shift(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-400 transition active:scale-95 active:bg-zinc-200/60 dark:active:bg-zinc-800"
              aria-label="Mes anterior"
            >
              <IconChevronLeft className="h-5 w-5" />
            </button>
            <h1 className="min-w-[9rem] text-center text-xl font-bold tracking-tight">
              {formatMonth(year, month)}
            </h1>
            <button
              type="button"
              onClick={() => shift(1)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-400 transition active:scale-95 active:bg-zinc-200/60 dark:active:bg-zinc-800"
              aria-label="Mes siguiente"
            >
              <IconChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {walletMode === "unified" && <CurrencyToggle />}
          <Link
            href="/cuenta"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--card)] text-zinc-500 transition active:scale-95"
            aria-label="Cuenta"
          >
            <IconUser className="h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* Desktop — periodo centrado en el área de contenido */}
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
