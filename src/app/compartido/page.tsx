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
  const { configured, isAuthenticated, loading, members, user } = useAuth();
  const { ready, sharedEnabled } = useFinance();

  useEffect(() => {
    if (ready && !sharedEnabled) router.replace("/");
  }, [ready, sharedEnabled, router]);

  if (!ready || (configured && loading) || !sharedEnabled) {
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
            {configured && isAuthenticated && paired
              ? `Con ${otherNames.join(", ")} · cada gasto resta de quien lo cargó`
              : "Lista compartida. El saldo de cada persona sigue siendo propio."}
          </p>
        </div>
      </div>

      {configured && !isAuthenticated && (
        <div className="bento space-y-3 md:max-w-md">
          <p className="text-sm font-semibold">Falta tu usuario</p>
          <p className="text-sm leading-relaxed text-zinc-500">
            Lo que cargues acá queda en este teléfono. Para que el resto del
            grupo vea los mismos gastos, entrá con tu email.
          </p>
          <Link
            href="/login?next=/compartido&reason=shared"
            className="btn-primary inline-block px-6 text-sm"
          >
            Entrar con email
          </Link>
        </div>
      )}

      {configured && isAuthenticated && !paired && (
        <div className="bento space-y-3 md:max-w-md">
          <p className="text-sm font-semibold">Todavía estás solo</p>
          <p className="text-sm leading-relaxed text-zinc-500">
            Tu usuario está listo. Invitá a alguien o uníte con un código
            para ver la misma lista.
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
