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
    <div className="space-y-5 pb-4">
      <AppHeader />

      <div>
        <h2 className="text-lg font-bold">Compartido</h2>
        {configured && isAuthenticated ? (
          <p className="text-sm text-zinc-500">
            {household?.name ?? "Grupo"}
            {members.length > 0 &&
              ` · ${members.map((m) => m.displayName).join(", ")}`}
          </p>
        ) : (
          <p className="text-sm text-zinc-500">
            Gastos del hogar — cada uno ve el monto completo en su disponible
          </p>
        )}
      </div>

      {configured && !isAuthenticated && (
        <Link
          href="/login?next=/compartido"
          className="card block p-4 text-sm text-zinc-600 dark:text-zinc-300"
        >
          <span className="font-medium text-emerald-600">Iniciá sesión</span>{" "}
          para sync compartido con tu pareja →
        </Link>
      )}

      {configured && isAuthenticated && members.length < 2 && (
        <Link
          href="/cuenta"
          className="card block p-4 text-sm text-zinc-600 dark:text-zinc-300"
        >
          Invitá a tu pareja desde{" "}
          <span className="font-medium text-emerald-600">Cuenta</span> para ver
          sus cargas acá →
        </Link>
      )}

      <SharedMovementList />
    </div>
  );
}
