"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fab } from "@/components/Fab";
import { useFinance } from "@/context/FinanceContext";
import { formatMoney, formatMonth, formatRateUpdatedAt, isCurrentPeriod } from "@/lib/format";
import { IconHome, IconUsers } from "@/components/ui/Icons";

const HIDE_NAV_PREFIXES = ["/nuevo", "/compartido/nuevo", "/editar", "/login", "/join"];

/** Solo mobile — oculto desde md (lo reemplaza DesktopSidebar). */
export function BottomNav() {
  const pathname = usePathname();
  const { sharedEnabled, usdEnabled } = useFinance();
  const hideNav = HIDE_NAV_PREFIXES.some((p) => pathname.startsWith(p));

  if (hideNav) return null;

  const homeActive = pathname === "/" || pathname === "/mes";
  const sharedActive = pathname.startsWith("/compartido");

  return (
    <nav className="pointer-events-none fixed bottom-0 inset-x-0 z-50 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <div className="pointer-events-auto relative mx-auto max-w-lg px-4">
        {usdEnabled && <RatePill />}
        <div className="relative mt-2 rounded-[1.75rem] bg-[var(--card)]/95 shadow-[var(--surface-elevated)] backdrop-blur-xl dark:bg-zinc-950/90">
          <Fab />
          {sharedEnabled ? (
            <ul className="grid grid-cols-3 items-end px-4 pt-3 pb-2.5">
              <li>
                <NavLink href="/" label="Inicio" active={homeActive} icon="home" />
              </li>
              <li aria-hidden className="h-12" />
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
            <ul className="flex items-end justify-center px-4 pt-3 pb-2.5">
              <li>
                <NavLink href="/" label="Inicio" active={homeActive} icon="home" />
              </li>
            </ul>
          )}
        </div>
      </div>
    </nav>
  );
}

function RatePill() {
  const { rate, year, month, ready } = useFinance();
  const isCurrent = isCurrentPeriod(year, month);
  const updatedLabel = formatRateUpdatedAt(rate.updatedAt);

  return (
    <div className="mx-auto flex max-w-sm items-center justify-between gap-3 rounded-2xl bg-[var(--card)]/90 px-4 py-2.5 text-[11px] shadow-[var(--surface-elevated)] backdrop-blur-md">
      <div className="min-w-0">
        <p className="font-semibold text-zinc-500">
          Dólar oficial
          {!isCurrent && (
            <span className="font-normal text-zinc-400">
              {" "}
              · {formatMonth(year, month)}
            </span>
          )}
        </p>
        {ready ? (
          updatedLabel ? (
            <p className="truncate text-zinc-400" suppressHydrationWarning>
              {updatedLabel}
            </p>
          ) : (
            <p className="text-zinc-400">
              {isCurrent ? "Todavía no hay cotización" : "Dólar de ese mes"}
            </p>
          )
        ) : (
          <p className="text-zinc-400">…</p>
        )}
      </div>
      <p className="shrink-0 text-sm font-bold tabular-nums text-zinc-900 dark:text-white">
        {ready ? formatMoney(rate.usdToArs) : "—"}
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
  const color = active ? "text-zinc-900 dark:text-white" : "text-zinc-400";
  const Icon = icon === "home" ? IconHome : IconUsers;

  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-0.5 py-1.5 text-[11px] font-semibold ${
        active ? "text-zinc-900 dark:text-white" : "text-zinc-400"
      }`}
    >
      <Icon className={`h-6 w-6 ${color}`} />
      <span>{label}</span>
    </Link>
  );
}
