"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { SharedMovementList } from "@/components/SharedMovementList";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useAuth } from "@/context/AuthContext";
import { useFinance } from "@/context/FinanceContext";

export default function CompartidoPage() {
  const router = useRouter();
  const { configured, isAuthenticated, loading, household, members } = useAuth();
  const { ready, sharedEnabled } = useFinance();

  useEffect(() => {
    if (ready && !sharedEnabled) router.replace("/");
  }, [ready, sharedEnabled, router]);

  if (!ready || (configured && loading) || !sharedEnabled) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex flex-col gap-4 pb-4 md:gap-6">
      <AppHeader />

      <div className="animate-fade-in flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">
            Compartido
          </h2>
          {configured && isAuthenticated ? (
            <p className="meta mt-1">
              {household?.name ?? "Grupo"}
              {members.length > 0 &&
                ` · ${members.map((m) => m.displayName).join(", ")}`}
            </p>
          ) : (
            <p className="meta mt-1">
              Gastos del hogar — monto completo en el disponible de cada uno
            </p>
          )}
        </div>
      </div>

      {configured && !isAuthenticated && (
        <Link
          href="/login?next=/compartido"
          className="bento block text-sm text-zinc-500 md:max-w-md"
        >
          <span className="font-semibold text-zinc-900 dark:text-white">
            Iniciá sesión
          </span>{" "}
          para sync compartido →
        </Link>
      )}

      {configured && isAuthenticated && members.length < 2 && (
        <Link
          href="/cuenta"
          className="bento block text-sm text-zinc-500 md:max-w-md"
        >
          Invitá a tu pareja desde{" "}
          <span className="font-semibold text-zinc-900 dark:text-white">
            Cuenta
          </span>{" "}
          →
        </Link>
      )}

      <SharedMovementList />
    </div>
  );
}
