"use client";

import { type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AuthProvider } from "@/context/AuthContext";
import { FinanceProvider } from "@/context/FinanceContext";
import { BottomNav } from "@/components/BottomNav";
import { DesktopSidebar } from "@/components/DesktopSidebar";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import {
  LoadingScreen,
  variantFromPath,
} from "@/components/ui/LoadingScreen";
import { useIsClient } from "@/hooks/useIsClient";

/**
 * Mobile: columna centrada max-w-lg.
 * Desktop: sidebar fijo a la izquierda; el contenido se centra en el
 * espacio restante (pl-64 + mx-auto max-w-7xl) sin desalinear.
 */
export function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hydrated = useIsClient();

  return (
    <AuthProvider>
      <FinanceProvider>
        {/* iOS PWA: theme-color no pinta el notch; esta franja sí. */}
        <div
          className="h-[env(safe-area-inset-top,0px)] shrink-0 bg-[var(--primary)] md:hidden"
          aria-hidden
        />
        {hydrated ? <DesktopSidebar /> : null}
        <div className="min-h-full w-full md:pl-64">
          <div className="mx-auto flex min-h-full w-full max-w-lg flex-col px-5 pb-40 pt-4 md:max-w-7xl md:px-8 md:pb-12 md:pt-8 lg:px-10">
            <main className="mx-auto w-full flex-1 md:mx-0">
              {hydrated ? (
                children
              ) : (
                <LoadingScreen variant={variantFromPath(pathname)} />
              )}
            </main>
          </div>
        </div>
        {hydrated ? <BottomNav /> : null}
        <ServiceWorkerRegister />
      </FinanceProvider>
    </AuthProvider>
  );
}
