"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useAuth } from "@/context/AuthContext";
import { useFinance } from "@/context/FinanceContext";

function OnboardingGate() {
  const searchParams = useSearchParams();
  const guideOnly = searchParams.get("guia") === "1";
  const { configured, loading, isAuthenticated } = useAuth();
  const { ready } = useFinance();

  // FAQ desde Cuenta: no exige sesión (sirve en local sin login / skip-auth).
  if (guideOnly) {
    if (!ready) return <LoadingScreen variant="auth" />;
    return <OnboardingWizard />;
  }

  if (!ready || (configured && (loading || !isAuthenticated))) {
    return <LoadingScreen variant="auth" />;
  }

  return <OnboardingWizard />;
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<LoadingScreen variant="auth" />}>
      <OnboardingGate />
    </Suspense>
  );
}
