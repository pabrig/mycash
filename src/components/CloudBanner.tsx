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
