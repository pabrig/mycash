"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fab } from "@/components/Fab";
import { useFinance } from "@/context/FinanceContext";
import {
  formatMoney,
  formatMonth,
  formatRateUpdatedAt,
  isCurrentPeriod,
} from "@/lib/format";
import { showOfficialRate } from "@/lib/money-profile";
import { IconHome, IconSplit, IconUsers } from "@/components/ui/Icons";

const HIDE_NAV_PREFIXES = [
  "/nuevo",
  "/compartido/nuevo",
  "/editar",
  "/login",
  "/join",
  "/onboarding",
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
  const { sharedEnabled, usdEnabled, walletMode } = useFinance();
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
    <nav className="pointer-events-none fixed bottom-0 inset-x-0 z-50 bg-gradient-to-t from-[var(--background-deep)] via-[var(--background)] to-transparent pb-[var(--app-bottom-gap)] md:hidden">
      <div className="pointer-events-auto relative mx-auto max-w-lg px-4">
        {showOfficialRate(usdEnabled, walletMode) && <RatePill />}
        <div className="relative mt-5 rounded-[1.75rem] border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--card)_94%,transparent)] shadow-[var(--surface-elevated)] backdrop-blur-xl">
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
        <p className="font-semibold text-[var(--muted-fg)]">
          Dólar oficial
          {!isCurrent && (
            <span className="font-normal opacity-80">
              {" "}
              · {formatMonth(year, month)}
            </span>
          )}
        </p>
        {ready ? (
          updatedLabel ? (
            <p
              className="truncate text-[var(--muted-fg)] opacity-80"
              suppressHydrationWarning
            >
              {updatedLabel}
            </p>
          ) : (
            <p className="text-[var(--muted-fg)] opacity-80">
              {isCurrent ? "Todavía no hay cotización" : "Dólar de ese mes"}
            </p>
          )
        ) : (
          <p className="text-[var(--muted-fg)] opacity-80">…</p>
        )}
      </div>
      <p className="shrink-0 text-sm font-bold tabular-nums text-[var(--foreground)]">
        {ready ? formatMoney(rate.usdToArs) : "—"}
      </p>
    </div>
  );
}

function NavLink({ href, label, active, icon }: NavItem) {
  const Icon =
    icon === "home" ? IconHome : icon === "shared" ? IconUsers : IconSplit;

  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-0.5 px-1 py-1.5 text-[11px] font-semibold whitespace-nowrap transition-colors ${ active ? "text-[var(--primary)]" : "text-[var(--muted-fg)] hover:text-[var(--primary-soft)]" }`}
    >
      <Icon className="h-6 w-6" />
      <span>{label}</span>
    </Link>
  );
}
