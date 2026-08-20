"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fab } from "@/components/Fab";
import { useFinance } from "@/context/FinanceContext";
import { formatMoney, formatMonth, formatRateUpdatedAt, isCurrentPeriod } from "@/lib/format";
import { IconHome, IconSplit, IconUsers } from "@/components/ui/Icons";

const HIDE_NAV_PREFIXES = [
  "/nuevo",
  "/compartido/nuevo",
  "/editar",
  "/login",
  "/join",
  "/dividir/nuevo",
];

type NavItem = {
  href: string;
  label: string;
  active: boolean;
  icon: "home" | "shared" | "split";
};

/** Solo mobile — oculto desde md (lo reemplaza DesktopSidebar). */
export function BottomNav() {
  const pathname = usePathname();
  const { sharedEnabled, usdEnabled } = useFinance();
  const hideNav = HIDE_NAV_PREFIXES.some((p) => pathname.startsWith(p));

  if (hideNav) return null;

  const home: NavItem = {
    href: "/",
    label: "Inicio",
    active: pathname === "/" || pathname === "/mes",
    icon: "home",
  };
  const shared: NavItem = {
    href: "/compartido",
    label: "Compartido",
    active: pathname.startsWith("/compartido"),
    icon: "shared",
  };
  const split: NavItem = {
    href: "/dividir",
    label: "Dividir",
    active: pathname.startsWith("/dividir"),
    icon: "split",
  };

  return (
    <nav className="pointer-events-none fixed bottom-0 inset-x-0 z-50 pb-[var(--app-bottom-gap)] md:hidden">
      <div className="pointer-events-auto relative mx-auto max-w-lg px-4">
        {usdEnabled && <RatePill />}
        <div className="relative mt-5 rounded-[1.75rem] bg-[var(--card)]/95 shadow-[var(--surface-elevated)] backdrop-blur-xl dark:bg-zinc-950/90">
          <Fab />
          <ul className="grid grid-cols-3 items-end px-2 pt-3.5 pb-3.5">
            <li className="flex justify-center">
              <NavLink {...home} />
            </li>
            <li className="flex justify-center">
              {sharedEnabled ? <NavLink {...shared} /> : null}
            </li>
            <li className="flex justify-center">
              <NavLink {...split} />
            </li>
          </ul>
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
    <div className="mx-auto flex max-w-sm items-center justify-between gap-3 rounded-2xl bg-[var(--card)]/90 px-4 py-2 text-[11px] shadow-[var(--surface-elevated)] backdrop-blur-md">
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

function NavLink({ href, label, active, icon }: NavItem) {
  const color = active ? "text-zinc-900 dark:text-white" : "text-zinc-400";
  const Icon = icon === "home" ? IconHome : icon === "shared" ? IconUsers : IconSplit;

  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-0.5 px-1 py-1.5 text-[11px] font-semibold whitespace-nowrap ${
        active ? "text-zinc-900 dark:text-white" : "text-zinc-400"
      }`}
    >
      <Icon className={`h-6 w-6 ${color}`} />
      <span>{label}</span>
    </Link>
  );
}
