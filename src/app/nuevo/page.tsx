"use client";

import Link from "next/link";
import { MovementForm } from "@/components/MovementForm";

export default function NuevoPage() {
  return (
    <div className="mx-auto w-full max-w-lg pb-4 md:max-w-xl md:pt-2">
      <div className="mb-5 flex items-center gap-3">
        <Link
          href="/"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--card)] text-lg active:scale-95"
          aria-label="Volver"
        >
          ‹
        </Link>
        <h1 className="text-lg font-bold md:text-xl">Nuevo movimiento</h1>
      </div>
      <MovementForm />
    </div>
  );
}
