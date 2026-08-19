"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MovementForm } from "@/components/MovementForm";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useFinance } from "@/context/FinanceContext";
import { parseSplitExpensePrefill } from "@/lib/split-bill";

function NuevoBody() {
  const { ready } = useFinance();
  const params = useSearchParams();
  const prefill = parseSplitExpensePrefill(params);

  if (!ready) return <LoadingScreen variant="form" />;

  return (
    <div className="mx-auto w-full max-w-lg pb-4 md:max-w-xl md:pt-2">
      <div className="mb-5 flex items-center gap-3">
        <Link
          href={prefill ? "/dividir" : "/"}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--card)] text-lg active:scale-95"
          aria-label="Volver"
        >
          ‹
        </Link>
        <h1 className="text-lg font-bold md:text-xl">
          {prefill ? "Cargar mi parte" : "Nuevo movimiento"}
        </h1>
      </div>
      <MovementForm
        prefill={prefill ?? undefined}
        redirectTo="/"
      />
    </div>
  );
}

export default function NuevoPage() {
  return (
    <Suspense fallback={<LoadingScreen variant="form" />}>
      <NuevoBody />
    </Suspense>
  );
}
