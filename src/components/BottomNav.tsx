"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fab } from "@/components/Fab";
import { useFinance } from "@/context/FinanceContext";
import { formatMoney, formatMonth, formatRateUpdatedAt, isCurrentPeriod } from "@/lib/format";

const HIDE_NAV_PREFIXES = ["/nuevo", "/compartido/nuevo", "/editar", "/login", "/join"];

export function BottomNav() {
  const pathname = usePathname();
  const { sharedEnabled, usdEnabled } = useFinance();
  const hideNav = HIDE_NAV_PREFIXES.some((p) => pathname.startsWith(p));

  if (hideNav) return null;

  const homeActive = pathname === "/" || pathname === "/mes";
  const sharedActive = pathname.startsWith("/compartido");

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="relative mx-auto max-w-lg border-t border-zinc-200/80 bg-white/90 backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-950/90">
        {usdEnabled && <RateFooter />}
        <Fab />
        {sharedEnabled ? (
          <ul className="grid grid-cols-3 items-end px-6 pt-3 pb-2">
            <li>
              <NavLink href="/" label="Inicio" active={homeActive} icon="home" />
            </li>
            <li aria-hidden />
            <li>
              <NavLink
                href="/compartido"
                label="Compartido"
                active={sharedActive}
                icon="shared"
              />
            </li>
          </ul>
        ) : (
          <ul className="flex items-end justify-center px-6 pt-3 pb-2">
            <li>
              <NavLink href="/" label="Inicio" active={homeActive} icon="home" />
            </li>
          </ul>
        )}
      </div>
    </nav>
  );
}

function RateFooter() {
  const { rate, year, month, ready } = useFinance();
  const isCurrent = isCurrentPeriod(year, month);
  const updatedLabel = formatRateUpdatedAt(rate.updatedAt);

  if (!ready) {
    return (
      <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-2 text-[11px] dark:border-zinc-800">
        <div className="min-w-0">
          <p className="font-medium text-zinc-600 dark:text-zinc-300">USD oficial</p>
          <p className="text-zinc-400">…</p>
        </div>
        <p className="shrink-0 text-sm font-semibold tabular-nums text-emerald-600">—</p>
      </div>
    );
  }

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
          <p className="truncate text-zinc-400" suppressHydrationWarning>
            Actualizado {updatedLabel}
          </p>
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
  icon,
}: {
  href: string;
  label: string;
  active: boolean;
  icon: "home" | "shared";
}) {
  const color = active ? "text-emerald-600" : "text-zinc-400";

  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-0.5 py-2 text-xs ${
        active ? "font-semibold text-emerald-600" : "text-zinc-500"
      }`}
    >
      {icon === "home" ? (
        <svg className={`h-6 w-6 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10" />
        </svg>
      ) : (
        <svg className={`h-6 w-6 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )}
      <span>{label}</span>
    </Link>
  );
}
