"use client";

import { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { AppHeader } from "@/components/AppHeader";
import { DisponibleHero } from "@/components/DisponibleHero";
import { BalanceBar } from "@/components/BalanceBar";
import { AnnualOverview } from "@/components/AnnualOverview";
import { MovementList } from "@/components/MovementList";
import { PeriodToggle } from "@/components/PeriodToggle";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import type { SummaryScope } from "@/lib/types";

export default function HomePage() {
  const { ready } = useFinance();
  const [scope, setScope] = useState<SummaryScope>("month");

  if (!ready) return <LoadingScreen />;

  return (
    <div className="space-y-5 pb-4">
      <AppHeader />
      <PeriodToggle scope={scope} onChange={setScope} />
      <DisponibleHero scope={scope} />
      {scope === "year" ? (
        <AnnualOverview onOpenMonth={() => setScope("month")} />
      ) : (
        <>
          <BalanceBar />
          <MovementList />
        </>
      )}
    </div>
  );
}
