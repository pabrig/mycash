"use client";

import { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { AppHeader } from "@/components/AppHeader";
import { DisponibleHero } from "@/components/DisponibleHero";
import { BalanceBar } from "@/components/BalanceBar";
import { AnnualOverview } from "@/components/AnnualOverview";
import { MovementList } from "@/components/MovementList";
import { CloudBanner } from "@/components/CloudBanner";
import { PeriodToggle } from "@/components/PeriodToggle";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import type { SummaryScope } from "@/lib/types";

export default function HomePage() {
  const { ready } = useFinance();
  const [scope, setScope] = useState<SummaryScope>("month");

  if (!ready) return <LoadingScreen variant="dashboard" />;

  return (
    <div className="flex flex-col gap-4 pb-4 md:gap-6">
      <AppHeader />

      <div className="flex flex-col items-stretch gap-3 md:items-center">
        <CloudBanner />
        <div className="w-full md:mx-auto md:max-w-xs">
          <PeriodToggle scope={scope} onChange={setScope} />
        </div>
      </div>

      {scope === "year" ? (
        <div className="mx-auto grid w-full max-w-5xl gap-4 md:gap-6">
          <DisponibleHero scope={scope} />
          <AnnualOverview onOpenMonth={() => setScope("month")} />
        </div>
      ) : (
        <div className="mx-auto grid w-full grid-cols-1 items-start gap-4 md:grid-cols-12 md:gap-6">
          {/* Macro */}
          <div className="flex flex-col gap-4 md:col-span-7 lg:col-span-8">
            <DisponibleHero scope={scope} />
            <BalanceBar />
            <div className="md:hidden">
              <MovementList />
            </div>
          </div>

          {/* Feed sticky — desde md */}
          <aside className="hidden md:col-span-5 md:block lg:col-span-4">
            <div className="md:sticky md:top-8 md:max-h-[calc(100vh-4rem)] md:overflow-y-auto md:overscroll-contain">
              <MovementList variant="feed" />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
