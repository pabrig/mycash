"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { SharedMovementList } from "@/components/SharedMovementList";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useAuth } from "@/context/AuthContext";
import { useFinance } from "@/context/FinanceContext";

export default function CompartidoPage() {
  const router = useRouter();
  const { loading, members, user } = useAuth();
  const { ready, sharedEnabled } = useFinance();

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
            Compartido
          </h2>
          <p className="meta mt-1">
            {paired
              ? `Con ${otherNames.join(", ")}. Cada gasto resta de quien lo cargó.`
              : "Acá van a ver los gastos de todos. Cada uno sigue con su plata."}
          </p>
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

      <SharedMovementList />
    </div>
  );
}
