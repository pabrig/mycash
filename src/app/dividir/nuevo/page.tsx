"use client";

import Link from "next/link";
import { SplitEventWizard } from "@/components/SplitEventWizard";

export default function NuevoEventoPage() {
  return (
    <div className="mx-auto w-full max-w-lg pb-4 md:max-w-xl md:pt-2">
      <div className="mb-5 flex items-center gap-3">
        <Link
          href="/dividir"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--card)] text-lg active:scale-95"
          aria-label="Volver"
        >
          ‹
        </Link>
        <div>
          <h1 className="text-lg font-bold md:text-2xl">Nuevo evento</h1>
          <p className="meta text-xs">Dos pasos y listo</p>
        </div>
      </div>
      <SplitEventWizard />
    </div>
  );
}
