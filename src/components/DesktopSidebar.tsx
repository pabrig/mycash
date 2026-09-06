"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AmountsToggle } from "@/components/AmountsToggle";
import { CurrencyToggle } from "@/components/CurrencyToggle";
import { UserAvatar } from "@/components/UserAvatar";
import { useAuth } from "@/context/AuthContext";
import { useFinance } from "@/context/FinanceContext";
import {
  formatMoney,
  formatMonth,
  formatRateUpdatedAt,
  isCurrentPeriod,
} from "@/lib/format";
import { showOfficialRate } from "@/lib/money-profile";
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
    <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:w-64 md:flex-col md:border-r md:border-[var(--card-border)] md:bg-[color-mix(in_srgb,var(--card)_92%,transparent)] md:px-5 md:py-7 md:backdrop-blur-xl">
      <div className="flex items-center gap-3 px-2">
        <IconMyCash className="h-9 w-9 shrink-0 text-[var(--foreground)]" />
        <div>
          <p className="text-[11px] font-semibold tracking-[0.18em] text-[var(--muted-fg)] uppercase">
            Myca$h
          </p>
          <p className="brand-wordmark text-xl tracking-tight text-[var(--foreground)]">
            Tu plata
          </p>
        </div>
      </div>

      <Link
        href="/cuenta"
        className={`mt-8 flex items-center gap-3 rounded-2xl px-3 py-2.5 transition ${ cuentaActive ? "bg-[var(--card-muted)]" : "hover:bg-[var(--card-muted)]/70" }`}
      >
        {isAuthenticated ? (
          <UserAvatar name={profile?.displayName} size="sm" />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--card-muted)] text-[var(--muted-fg)]">
            <IconUser className="h-4 w-4" />
          </span>
        )}
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">
            {isAuthenticated ? profile?.displayName || "Vos" : "Entrá"}
          </span>
          <span className="block truncate text-[11px] text-[var(--muted-fg)]">
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
        <SideLink
          href="/dividir"
          label="Dividir"
          active={dividirActive}
          icon="split"
        />
        <SideLink
          href="/cuenta"
          label="Cuenta"
          active={cuentaActive}
          icon="cuenta"
        />
      </nav>

      <div className="mt-auto space-y-4">
        {walletMode === "unified" && usdEnabled && (
          <div>
            <p className="mb-2 px-2 text-[10px] font-semibold tracking-wide text-[var(--muted-fg)] uppercase">
              Moneda
            </p>
            <CurrencyToggle />
          </div>
        )}

        {showOfficialRate(usdEnabled, walletMode) && <SidebarRate />}

        <div className="flex items-center justify-between px-1">
          <p className="text-[10px] font-semibold tracking-wide text-[var(--muted-fg)] uppercase">
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
      <p className="text-[10px] font-semibold tracking-wide text-[var(--muted-fg)] uppercase">
        Dólar oficial
        {!isCurrent && (
          <span className="font-normal"> · {formatMonth(year, month)}</span>
        )}
      </p>
      <p className="mt-1 text-lg font-bold tabular-nums tracking-tight">
        {ready ? formatMoney(rate.usdToArs) : "—"}
      </p>
      {ready && updatedLabel && (
        <p
          className="mt-0.5 text-[10px] text-[var(--muted-fg)]"
          suppressHydrationWarning
        >
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
      className={`flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition ${ active ? "bg-[var(--cta)] text-[var(--cta-fg)]" : "text-[var(--muted-fg)] hover:bg-[var(--card-muted)] hover:text-[var(--foreground)]" }`}
    >
      <Icon className="h-5 w-5 shrink-0 opacity-90" />
      {label}
    </Link>
  );
}
