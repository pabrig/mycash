"use client";

import { useCallback, useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { AppHeader } from "@/components/AppHeader";
import { DisponibleHero } from "@/components/DisponibleHero";
import { GoalsHomeCard } from "@/components/GoalsHomeCard";
import { BalanceBar } from "@/components/BalanceBar";
import { YearReview } from "@/components/YearReview";
import { MovementList } from "@/components/MovementList";
import { CloudBanner } from "@/components/CloudBanner";
import { PeriodToggle } from "@/components/PeriodToggle";
import { CurrencyToggle } from "@/components/CurrencyToggle";
import { ExportStatementSheet } from "@/components/ExportStatementSheet";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { IconDownload } from "@/components/ui/Icons";
import { useMonthSwipe } from "@/hooks/useMonthSwipe";
import { shiftPeriod } from "@/lib/format";
import type { SummaryScope } from "@/lib/types";

export default function HomePage() {
  const { ready, walletMode, year, month, setPeriod } = useFinance();
  const [scope, setScope] = useState<SummaryScope>("month");
  const [exportOpen, setExportOpen] = useState(false);

  const shiftMonth = useCallback(
    (delta: number) => {
      const next = shiftPeriod(year, month, delta);
      setPeriod(next.year, next.month);
    },
    [year, month, setPeriod],
  );

  const monthSwipe = useMonthSwipe(shiftMonth);

  if (!ready) return <LoadingScreen variant="dashboard" />;

  return (
    <div className="flex flex-col gap-4 pb-4 md:gap-6">
      <AppHeader />

      <div className="flex flex-col items-stretch gap-3 md:items-center">
        <CloudBanner />
        <div className="flex w-full items-center gap-2 md:mx-auto md:max-w-xs">
          <div className="min-w-0 flex-1">
            <PeriodToggle scope={scope} onChange={setScope} />
          </div>
          {walletMode === "unified" && scope === "month" && (
            <div className="shrink-0 md:hidden">
              <CurrencyToggle />
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setExportOpen(true)}
          className="inline-flex items-center gap-1.5 self-center text-sm font-semibold text-zinc-500 transition active:scale-95"
        >
          <IconDownload className="h-4 w-4" />
          Descargar
        </button>
      </div>

      {scope === "year" ? (
        <YearReview onOpenMonth={() => setScope("month")} />
      ) : (
        <div
          className="mx-auto grid w-full touch-pan-y grid-cols-1 items-start gap-4 md:grid-cols-12 md:gap-6"
          {...monthSwipe}
        >
          <div className="flex flex-col gap-4 md:col-span-7 lg:col-span-8">
            <DisponibleHero />
            <GoalsHomeCard />
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

      <ExportStatementSheet
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        initialScope={scope}
      />
    </div>
  );
}
