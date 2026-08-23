"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { CurrencyToggle } from "@/components/CurrencyToggle";
import { PeriodToggle } from "@/components/PeriodToggle";
import { SharedMovementList } from "@/components/SharedMovementList";
import { SharedYearReview } from "@/components/SharedYearReview";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useAuth } from "@/context/AuthContext";
import { useFinance } from "@/context/FinanceContext";
import type { SummaryScope } from "@/lib/types";

export default function CompartidoPage() {
  const router = useRouter();
  const { loading, members, user, households, household, setActiveHousehold } =
    useAuth();
  const { ready, sharedEnabled, walletMode } = useFinance();
  const [scope, setScope] = useState<SummaryScope>("month");

  useEffect(() => {
    if (ready && !sharedEnabled) router.replace("/");
  }, [ready, sharedEnabled, router]);

  if (!ready || loading || !sharedEnabled) {
    return <LoadingScreen variant="shared" />;
  }

  const paired = members.length > 1;
  const otherNames = members
    .filter((m) => m.userId !== user?.id)
    .map((m) => m.displayName);

  return (
    <div className="flex flex-col gap-4 pb-4 md:gap-6">
      <AppHeader />

      <div className="animate-fade-in flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">
            {household?.name ?? "Compartido"}
          </h2>
          <p className="meta mt-1">
            {paired
              ? `Con ${otherNames.join(", ")}. Cada gasto resta de quien lo cargó.`
              : "Acá van a ver los gastos de todos. Cada uno sigue con su plata."}
          </p>
        </div>
        {walletMode === "unified" && scope === "month" && (
          <div className="md:hidden">
            <CurrencyToggle />
          </div>
        )}
      </div>

      {households.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {households.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => void setActiveHousehold(h.id)}
              className={`chip ${
                h.id === household?.id ? "chip-active" : "chip-inactive"
              }`}
            >
              {h.name}
            </button>
          ))}
        </div>
      )}

      <div className="flex w-full items-center gap-2 md:mx-auto md:max-w-xs">
        <div className="min-w-0 flex-1">
          <PeriodToggle scope={scope} onChange={setScope} />
        </div>
      </div>

      {!paired && (
        <div className="bento space-y-3 md:max-w-md">
          <p className="text-sm font-semibold">Todavía no hay nadie más</p>
          <p className="text-sm leading-relaxed text-zinc-500">
            Invitá a alguien o usá un código para compartir la lista.
          </p>
          <Link href="/cuenta" className="btn-primary inline-block px-6 text-sm">
            Invitar o unirme
          </Link>
        </div>
      )}

      {scope === "year" ? (
        <SharedYearReview onOpenMonth={() => setScope("month")} />
      ) : (
        <SharedMovementList />
      )}
    </div>
  );
}
