"use client";

import { type ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { FinanceProvider, useFinance } from "@/context/FinanceContext";
import { BottomNav } from "@/components/BottomNav";
import { DesktopSidebar } from "@/components/DesktopSidebar";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import {
  LoadingScreen,
  variantFromPath,
} from "@/components/ui/LoadingScreen";
import { useIsClient } from "@/hooks/useIsClient";
import { isAuthShellPath, isOnboardingPath } from "@/lib/auth-routes";

function isStandaloneDisplay() {
  const nav = navigator as Navigator & { standalone?: boolean };
  return (
    nav.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches
  );
}

/**
 * Mobile: columna centrada max-w-lg.
 * Desktop: sidebar fijo a la izquierda; el contenido se centra en el
 * espacio restante (pl-64 + mx-auto max-w-7xl) sin desalinear.
 */
export function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hydrated = useIsClient();

  useEffect(() => {
    if (isStandaloneDisplay()) {
      document.documentElement.dataset.display = "standalone";
    }
  }, []);

  return (
    <AuthProvider>
      <FinanceProvider>
        {/* iOS PWA: theme-color no pinta el notch; esta franja sí. */}
        <div
          className="h-[env(safe-area-inset-top,0px)] shrink-0 bg-[var(--primary)] md:hidden"
          aria-hidden
        />
        <AppFrame pathname={pathname} hydrated={hydrated}>
          {children}
        </AppFrame>
        <ServiceWorkerRegister />
      </FinanceProvider>
    </AuthProvider>
  );
}

function AppFrame({
  children,
  pathname,
  hydrated,
}: {
  children: ReactNode;
  pathname: string;
  hydrated: boolean;
}) {
  const router = useRouter();
  const { configured, isAuthenticated } = useAuth();
  const { ready, onboardingCompleted } = useFinance();

  const onOnboarding = isOnboardingPath(pathname);
  const onJoin = pathname.startsWith("/join/");
  const needsOnboarding =
    configured && isAuthenticated && ready && !onboardingCompleted;
  const blockApp = needsOnboarding && !onOnboarding && !onJoin;
  const hideChrome = isAuthShellPath(pathname) || blockApp;

  useEffect(() => {
    if (!needsOnboarding || onOnboarding || onJoin) return;
    router.replace("/onboarding");
  }, [needsOnboarding, onOnboarding, onJoin, router]);

  useEffect(() => {
    if (!onOnboarding || !configured || !isAuthenticated) return;
    if (!ready || !onboardingCompleted) return;
    router.replace("/");
  }, [
    onOnboarding,
    configured,
    isAuthenticated,
    ready,
    onboardingCompleted,
    router,
  ]);

  return (
    <>
      {hydrated && !hideChrome ? <DesktopSidebar /> : null}
      <div className={`min-h-full w-full ${hideChrome ? "" : "md:pl-64"}`}>
        <div
          className={`mx-auto flex min-h-full w-full max-w-lg flex-col px-5 ${
            hideChrome
              ? "pb-12 pt-8"
              : "pb-44 pt-4 md:max-w-7xl md:px-8 md:pb-12 md:pt-8 lg:px-10"
          }`}
        >
          <main className="mx-auto w-full flex-1 md:mx-0">
            {!hydrated ? (
              <LoadingScreen variant={variantFromPath(pathname)} />
            ) : blockApp ? (
              <LoadingScreen variant="auth" />
            ) : (
              children
            )}
          </main>
        </div>
      </div>
      {hydrated && !hideChrome ? <BottomNav /> : null}
    </>
  );
}
