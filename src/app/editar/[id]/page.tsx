"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { MovementForm } from "@/components/MovementForm";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useFinance } from "@/context/FinanceContext";

export default function EditarPage() {
  const params = useParams<{ id: string }>();
  const { ready, getMovementById } = useFinance();
  const id = params.id;

  if (!ready) return <LoadingScreen variant="form" />;

  const movement = getMovementById(id);

  if (!movement) {
    return (
      <div className="bento mx-auto max-w-lg space-y-4 p-6 text-center">
        <p className="font-medium">Movimiento no encontrado</p>
        <Link href="/" className="text-sm font-semibold text-zinc-900 dark:text-white">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const isShared = movement.scope === "shared";
  const redirectTo = isShared ? "/compartido" : "/";

  return (
    <div className="mx-auto w-full max-w-lg pb-4 md:max-w-xl md:pt-2">
      <div className="mb-5 flex items-center gap-3">
        <Link
          href={redirectTo}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--card)] text-lg active:scale-95"
          aria-label="Volver"
        >
          ‹
        </Link>
        <h1 className="text-lg font-bold md:text-xl">
          {isShared ? "Editar compartido" : "Editar movimiento"}
        </h1>
      </div>
      <MovementForm
        mode={isShared ? "shared" : "full"}
        redirectTo={redirectTo}
        initial={movement}
      />
    </div>
  );
}
