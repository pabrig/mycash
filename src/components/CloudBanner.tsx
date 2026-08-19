"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useFinance } from "@/context/FinanceContext";

export function CloudBanner() {
  const { configured, isAuthenticated, loading } = useAuth();
  const { sharedEnabled, syncError, clearSyncError, refreshData } =
    useFinance();

  if (loading || !configured) return null;

  if (syncError && isAuthenticated) {
    return (
      <div className="bento flex w-full items-start justify-between gap-3 animate-fade-in text-sm md:mx-auto md:max-w-md">
        <p className="text-amber-700 dark:text-amber-400">{syncError}</p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => void refreshData()}
            className="text-xs font-semibold text-zinc-900 dark:text-white"
          >
            Reintentar
          </button>
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

  if (isAuthenticated) return null;

  return (
    <Link
      href="/login"
      className="bento block w-full animate-fade-in text-sm text-zinc-500 transition active:opacity-80 md:mx-auto md:max-w-md"
    >
      <span className="font-semibold text-zinc-900 dark:text-white">
        Iniciá sesión
      </span>{" "}
      {sharedEnabled
        ? "para sync y gastos compartidos →"
        : "para sincronizar en la nube →"}
    </Link>
  );
}
