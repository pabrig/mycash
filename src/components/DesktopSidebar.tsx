"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AmountsToggle } from "@/components/AmountsToggle";
import { CurrencyToggle } from "@/components/CurrencyToggle";
import { UserAvatar } from "@/components/UserAvatar";
import { useAuth } from "@/context/AuthContext";
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
  const { isAuthenticated, profile, user } = useAuth();

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
          <p className="text-xl font-bold tracking-tight">Tu plata</p>
        </div>
      </div>

      <Link
        href="/cuenta"
        className={`mt-8 flex items-center gap-3 rounded-2xl px-3 py-2.5 transition ${
          cuentaActive
            ? "bg-[var(--card-muted)]"
            : "hover:bg-[var(--card-muted)]/70"
        }`}
      >
        {isAuthenticated ? (
          <UserAvatar name={profile?.displayName} size="sm" />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--card-muted)] text-zinc-400">
            <IconUser className="h-4 w-4" />
          </span>
        )}
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">
            {isAuthenticated ? profile?.displayName || "Vos" : "Entrá"}
          </span>
          <span className="block truncate text-[11px] text-zinc-400">
            {isAuthenticated ? user?.email : "Con tu email"}
          </span>
        </span>
      </Link>

      <nav className="mt-6 flex flex-1 flex-col gap-1.5">
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

        <div className="flex items-center justify-between px-1">
          <p className="text-[10px] font-semibold tracking-wide text-zinc-400 uppercase">
            Montos
          </p>
          <AmountsToggle className="bg-[var(--card-muted)]" />
        </div>

        <Link
          href={nuevoHref}
          className="btn-primary flex w-full items-center justify-center gap-2 text-sm"
        >
          <IconPlus className="h-4 w-4" />
          Cargar
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
        Dólar oficial
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
