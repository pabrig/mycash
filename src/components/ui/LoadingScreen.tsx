import type { ReactNode } from "react";

export type LoadingVariant =
  | "dashboard"
  | "form"
  | "shared"
  | "account"
  | "auth";

export function variantFromPath(pathname: string): LoadingVariant {
  if (
    pathname.startsWith("/nuevo") ||
    pathname.startsWith("/editar") ||
    pathname.startsWith("/compartido/nuevo")
  ) {
    return "form";
  }
  if (pathname.startsWith("/compartido")) return "shared";
  if (pathname.startsWith("/cuenta")) return "account";
  if (pathname.startsWith("/dividir")) return "account";
  if (pathname.startsWith("/login") || pathname.startsWith("/join")) {
    return "auth";
  }
  return "dashboard";
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden />;
}

function PageShell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`animate-fade-in ${className}`}
      aria-busy="true"
      aria-label="Cargando"
      role="status"
    >
      {children}
    </div>
  );
}

function MovementRows({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-3 rounded-3xl bg-[var(--card)] px-4 py-3.5"
        >
          <div className="flex min-w-0 items-center gap-3">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-28 rounded-full" />
              <Skeleton className="h-2.5 w-16 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-4 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function HeaderSkeleton() {
  return (
    <>
      <div className="flex items-center justify-between gap-3 md:hidden">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-8 w-8 shrink-0 rounded-[7px]" />
          <Skeleton className="h-7 w-36 rounded-full" />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>
      <div className="hidden flex-col items-center gap-2 md:flex">
        <Skeleton className="h-3 w-16 rounded-full" />
        <Skeleton className="h-9 w-48 rounded-full" />
      </div>
    </>
  );
}

/** Esqueleto del dashboard: misma silueta que el home. */
export function DashboardSkeleton() {
  return (
    <PageShell className="flex flex-col gap-4 pb-4 md:gap-6">
      <HeaderSkeleton />

      <Skeleton className="h-10 w-full rounded-full md:mx-auto md:max-w-xs" />

      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-12 md:gap-6">
        <div className="flex flex-col gap-4 md:col-span-7 lg:col-span-8">
          <Skeleton className="h-52 w-full rounded-3xl md:h-60" />
          <Skeleton className="h-28 w-full rounded-3xl" />
          <div className="space-y-3 md:hidden">
            <Skeleton className="h-4 w-28 rounded-full" />
            <MovementRows />
          </div>
        </div>
        <aside className="hidden md:col-span-5 md:block lg:col-span-4">
          <div className="space-y-3">
            <div className="flex items-end justify-between">
              <Skeleton className="h-4 w-36 rounded-full" />
              <Skeleton className="h-3 w-6 rounded-full" />
            </div>
            <Skeleton className="h-8 w-full rounded-full" />
            <MovementRows count={5} />
          </div>
        </aside>
      </div>
    </PageShell>
  );
}

/** Formulario de movimiento (nuevo / editar / compartido). */
export function FormSkeleton() {
  return (
    <PageShell className="mx-auto w-full max-w-lg pb-4 md:max-w-xl md:pt-2">
      <div className="mb-5 flex items-center gap-3">
        <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
        <Skeleton className="h-6 w-44 rounded-full" />
      </div>

      <div className="space-y-6">
        <Skeleton className="h-14 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-3xl" />
        <Skeleton className="h-14 w-full rounded-2xl" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-28 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-20 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-full" />
        </div>
        <Skeleton className="h-12 w-full rounded-2xl" />
      </div>
    </PageShell>
  );
}

/** Pestaña Compartido. */
export function SharedSkeleton() {
  return (
    <PageShell className="flex flex-col gap-4 pb-4 md:gap-6">
      <HeaderSkeleton />

      <div className="space-y-2">
        <Skeleton className="h-8 w-40 rounded-full" />
        <Skeleton className="h-4 w-56 rounded-full" />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-4 rounded-3xl bg-[var(--card)] p-5 lg:col-span-2">
          <Skeleton className="h-3.5 w-24 rounded-full" />
          <Skeleton className="h-9 w-36 rounded-full" />
          <Skeleton className="h-2 w-full rounded-full" />
          <div className="space-y-2 pt-2">
            <Skeleton className="h-4 w-full rounded-full" />
            <Skeleton className="h-4 w-4/5 rounded-full" />
          </div>
        </div>
        <div className="lg:col-span-3">
          <MovementRows count={4} />
        </div>
      </div>
    </PageShell>
  );
}

/** Pantalla Cuenta. */
export function AccountSkeleton() {
  return (
    <PageShell className="mx-auto w-full max-w-lg space-y-5 pb-4 md:max-w-2xl md:pt-2">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 shrink-0 rounded-full md:hidden" />
        <Skeleton className="h-6 w-24 rounded-full md:h-8 md:w-32" />
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-3 rounded-3xl bg-[var(--card)] p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <Skeleton className="h-4 w-36 rounded-full" />
              <Skeleton className="h-3 w-52 rounded-full" />
              <Skeleton className="h-3 w-40 rounded-full" />
            </div>
            <Skeleton className="h-7 w-12 shrink-0 rounded-full" />
          </div>
        </div>
      ))}
    </PageShell>
  );
}

/** Login / unirse a grupo. */
export function AuthSkeleton() {
  return (
    <PageShell className="mx-auto w-full max-w-lg space-y-6 py-8">
      <div className="flex flex-col items-center gap-2">
        <Skeleton className="h-7 w-48 rounded-full" />
        <Skeleton className="h-4 w-56 rounded-full" />
      </div>
      <div className="space-y-4 rounded-3xl bg-[var(--card)] p-5">
        <Skeleton className="h-3 w-16 rounded-full" />
        <Skeleton className="h-14 w-full rounded-2xl" />
        <Skeleton className="h-12 w-full rounded-2xl" />
      </div>
    </PageShell>
  );
}

export function LoadingScreen({
  variant = "dashboard",
}: {
  variant?: LoadingVariant;
}) {
  switch (variant) {
    case "form":
      return <FormSkeleton />;
    case "shared":
      return <SharedSkeleton />;
    case "account":
      return <AccountSkeleton />;
    case "auth":
      return <AuthSkeleton />;
    default:
      return <DashboardSkeleton />;
  }
}
