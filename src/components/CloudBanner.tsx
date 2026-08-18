"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useFinance } from "@/context/FinanceContext";

export function CloudBanner() {
  const { configured, isAuthenticated, loading } = useAuth();
  const { sharedEnabled } = useFinance();

  if (loading || !configured || isAuthenticated) return null;

  return (
    <Link
      href="/login"
      className="card block p-3 text-sm text-zinc-600 transition-colors active:bg-zinc-50 dark:text-zinc-300 dark:active:bg-zinc-800/50"
    >
      <span className="font-medium text-emerald-600">Iniciá sesión</span> para
      {sharedEnabled
        ? " sync en la nube y gastos compartidos con tu pareja →"
        : " sincronizar tus movimientos en la nube →"}
    </Link>
  );
}
