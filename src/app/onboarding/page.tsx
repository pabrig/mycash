"use client";

import { OnboardingWizard } from "@/components/OnboardingWizard";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useAuth } from "@/context/AuthContext";
import { useFinance } from "@/context/FinanceContext";

export default function OnboardingPage() {
  const { configured, loading, isAuthenticated } = useAuth();
  const { ready } = useFinance();

  if (!ready || (configured && (loading || !isAuthenticated))) {
    return <LoadingScreen variant="auth" />;
  }

  return <OnboardingWizard />;
}
