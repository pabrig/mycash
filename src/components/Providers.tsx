"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { FinanceProvider } from "@/context/FinanceContext";
import { BottomNav } from "@/components/BottomNav";
import { DesktopSidebar } from "@/components/DesktopSidebar";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

/**
 * Mobile: columna centrada max-w-lg.
 * Desktop: sidebar fijo a la izquierda; el contenido se centra en el
 * espacio restante (pl-64 + mx-auto max-w-7xl) sin desalinear.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return (
    <AuthProvider>
      <FinanceProvider>
        {hydrated ? <DesktopSidebar /> : null}
        <div className="min-h-full w-full md:pl-64">
          <div className="mx-auto flex min-h-full w-full max-w-lg flex-col px-5 pb-40 pt-[max(1rem,env(safe-area-inset-top))] md:max-w-7xl md:px-8 md:pb-12 md:pt-8 lg:px-10">
            <main className="mx-auto w-full flex-1 md:mx-0">
              {hydrated ? children : <LoadingScreen />}
            </main>
          </div>
        </div>
        {hydrated ? <BottomNav /> : null}
        <ServiceWorkerRegister />
      </FinanceProvider>
    </AuthProvider>
  );
}
