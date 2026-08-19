"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MovementForm } from "@/components/MovementForm";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useAuth } from "@/context/AuthContext";
import { useFinance } from "@/context/FinanceContext";

export default function CompartidoNuevoPage() {
  const router = useRouter();
  const { configured, isAuthenticated, loading } = useAuth();
  const { ready, sharedEnabled } = useFinance();

  useEffect(() => {
    if (ready && !sharedEnabled) router.replace("/");
  }, [ready, sharedEnabled, router]);

  if (!ready || (configured && loading) || !sharedEnabled) {
    return <LoadingScreen variant="form" />;
  }

  if (configured && !isAuthenticated) {
    return (
      <div className="card space-y-4 p-6 text-center">
        <p className="font-medium">Iniciá sesión para cargar gastos compartidos</p>
        <Link
          href="/login?next=/compartido/nuevo"
          className="btn-primary inline-block px-6"
        >
          Entrar
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-4">
      <div className="mb-5 flex items-center gap-3">
        <Link
          href="/compartido"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg shadow-sm active:scale-95 dark:bg-zinc-900"
          aria-label="Volver"
        >
          ‹
        </Link>
        <h1 className="text-lg font-bold">Gasto compartido</h1>
      </div>
      <MovementForm mode="shared" redirectTo="/compartido" />
    </div>
  );
}
