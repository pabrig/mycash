"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { FinanceProvider } from "@/context/FinanceContext";
import { BottomNav } from "@/components/BottomNav";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

/** Una sola línea: evita mismatch SSR/client por whitespace en className. */
const SHELL_CLASS =
  "mx-auto flex min-h-full max-w-lg flex-col px-5 pb-40 pt-[max(1rem,env(safe-area-inset-top))]";


/**
 * Envuelve la app en un árbol DOM estable.
 * Hasta hidratar, server y client pintan lo mismo (LoadingScreen) y recién
 * después montan páginas + nav — evita el mismatch div vs whitespace.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return (
    <AuthProvider>
      <FinanceProvider>
        <div className={SHELL_CLASS}>
          <main className="flex-1">
            {hydrated ? children : <LoadingScreen />}
          </main>
        </div>
        {hydrated ? <BottomNav /> : null}
        <ServiceWorkerRegister />
      </FinanceProvider>
    </AuthProvider>
  );
}
