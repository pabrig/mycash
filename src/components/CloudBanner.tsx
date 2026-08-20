"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useFinance } from "@/context/FinanceContext";

export function CloudBanner() {
  const { isAuthenticated, loading } = useAuth();
  const { syncError, clearSyncError, refreshData } = useFinance();

  if (loading || !syncError || !isAuthenticated) return null;

  const sessionExpired = /venció el acceso|Sesión vencida/i.test(syncError);

  return (
    <div className="bento flex w-full items-start justify-between gap-3 animate-fade-in text-sm md:mx-auto md:max-w-md">
      <p className="text-amber-700 dark:text-amber-400">{syncError}</p>
      <div className="flex shrink-0 gap-2">
        {sessionExpired ? (
          <Link
            href="/login"
            className="text-xs font-semibold text-zinc-900 dark:text-white"
          >
            Entrar
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => void refreshData()}
            className="text-xs font-semibold text-zinc-900 dark:text-white"
          >
            Reintentar
          </button>
        )}
        <button
          type="button"
          onClick={clearSyncError}
          className="text-xs text-zinc-400"
          aria-label="Cerrar"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
