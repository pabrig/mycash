"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fab } from "@/components/Fab";
import { useFinance } from "@/context/FinanceContext";
import { formatMoney, formatMonth, formatRateUpdatedAt, isCurrentPeriod } from "@/lib/format";

export function BottomNav() {
  const pathname = usePathname();
  const hideNav = pathname === "/nuevo";

  if (hideNav) return null;

  const homeActive = pathname === "/" || pathname === "/mes";

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="relative mx-auto max-w-lg border-t border-zinc-200/80 bg-white/90 backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-950/90">
        <RateFooter />
        <Fab />
        <ul className="grid grid-cols-2 items-end px-6 pt-3 pb-2">
          <li>
            <NavLink href="/" label="Inicio" active={homeActive} />
          </li>
          <li aria-hidden />
        </ul>
      </div>
    </nav>
  );
}

function RateFooter() {
  const { rate, year, month } = useFinance();
  const isCurrent = isCurrentPeriod(year, month);
  const updatedLabel = formatRateUpdatedAt(rate.updatedAt);

  return (
    <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-2 text-[11px] dark:border-zinc-800">
      <div className="min-w-0">
        <p className="font-medium text-zinc-600 dark:text-zinc-300">
          USD oficial
          {!isCurrent && (
            <span className="font-normal text-zinc-400">
              {" "}
              · {formatMonth(year, month)}
            </span>
          )}
        </p>
        {updatedLabel ? (
          <p className="truncate text-zinc-400">Actualizado {updatedLabel}</p>
        ) : (
          <p className="text-zinc-400">
            {isCurrent ? "Sin actualizar aún" : "Tipo de cambio del mes"}
          </p>
        )}
      </div>
      <p className="shrink-0 text-sm font-semibold tabular-nums text-emerald-600">
        {formatMoney(rate.usdToArs)}
      </p>
    </div>
  );
}

function NavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  const color = active ? "text-emerald-600" : "text-zinc-400";

  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-0.5 py-2 text-xs ${
        active ? "font-semibold text-emerald-600" : "text-zinc-500"
      }`}
    >
      <svg className={`h-6 w-6 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10" />
      </svg>
      <span>{label}</span>
    </Link>
  );
}
