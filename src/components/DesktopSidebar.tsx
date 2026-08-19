"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CurrencyToggle } from "@/components/CurrencyToggle";
import { useFinance } from "@/context/FinanceContext";
import { formatMoney, formatMonth, formatRateUpdatedAt, isCurrentPeriod } from "@/lib/format";
import {
  IconHome,
  IconPlus,
  IconMyCash,
  IconSplit,
  IconUser,
  IconUsers,
} from "@/components/ui/Icons";

export function DesktopSidebar() {
  const pathname = usePathname();
  const { sharedEnabled, usdEnabled, walletMode } = useFinance();

  const homeActive = pathname === "/" || pathname === "/mes";
  const sharedActive = pathname.startsWith("/compartido");
  const cuentaActive = pathname.startsWith("/cuenta");
  const dividirActive = pathname.startsWith("/dividir");
  const nuevoHref = pathname.startsWith("/compartido")
    ? "/compartido/nuevo"
    : "/nuevo";

  return (
    <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:w-64 md:flex-col md:bg-[var(--card)] md:px-5 md:py-7 dark:md:bg-zinc-950">
      <div className="flex items-center gap-3 px-2">
        <IconMyCash className="h-9 w-9 shrink-0" />
        <div>
          <p className="text-[11px] font-semibold tracking-[0.18em] text-zinc-400 uppercase">
            Myca$h
          </p>
          <p className="text-xl font-bold tracking-tight">Finanzas</p>
        </div>
      </div>

      <nav className="mt-10 flex flex-1 flex-col gap-1.5">
        <SideLink href="/" label="Inicio" active={homeActive} icon="home" />
        {sharedEnabled && (
          <SideLink
            href="/compartido"
            label="Compartido"
            active={sharedActive}
            icon="shared"
          />
        )}
        <SideLink href="/dividir" label="Dividir" active={dividirActive} icon="split" />
        <SideLink href="/cuenta" label="Cuenta" active={cuentaActive} icon="cuenta" />
      </nav>

      <div className="mt-auto space-y-4">
        {walletMode === "unified" && usdEnabled && (
          <div>
            <p className="mb-2 px-2 text-[10px] font-semibold tracking-wide text-zinc-400 uppercase">
              Moneda
            </p>
            <CurrencyToggle />
          </div>
        )}

        {usdEnabled && <SidebarRate />}

        <Link
          href={nuevoHref}
          className="btn-primary flex w-full items-center justify-center gap-2 text-sm"
        >
          <IconPlus className="h-4 w-4" />
          Nueva transacción
        </Link>
      </div>
    </aside>
  );
}

function SidebarRate() {
  const { rate, year, month, ready } = useFinance();
  const isCurrent = isCurrentPeriod(year, month);
  const updatedLabel = formatRateUpdatedAt(rate.updatedAt);

  return (
    <div className="rounded-2xl bg-[var(--card-muted)] px-3.5 py-3.5">
      <p className="text-[10px] font-semibold tracking-wide text-zinc-400 uppercase">
        USD oficial
        {!isCurrent && (
          <span className="font-normal"> · {formatMonth(year, month)}</span>
        )}
      </p>
      <p className="mt-1 text-lg font-bold tabular-nums tracking-tight">
        {ready ? formatMoney(rate.usdToArs) : "—"}
      </p>
      {ready && updatedLabel && (
        <p className="mt-0.5 text-[10px] text-zinc-400" suppressHydrationWarning>
          {updatedLabel}
        </p>
      )}
    </div>
  );
}

function SideLink({
  href,
  label,
  active,
  icon,
}: {
  href: string;
  label: string;
  active: boolean;
  icon: "home" | "shared" | "cuenta" | "split";
}) {
  const Icon =
    icon === "home"
      ? IconHome
      : icon === "shared"
        ? IconUsers
        : icon === "split"
          ? IconSplit
          : IconUser;

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition ${
        active
          ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
          : "text-zinc-500 hover:bg-[var(--card-muted)] hover:text-zinc-900 dark:hover:text-white"
      }`}
    >
      <Icon className="h-5 w-5 shrink-0 opacity-90" />
      {label}
    </Link>
  );
}
