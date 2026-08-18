"use client";

import Link from "next/link";
import { MovementForm } from "@/components/MovementForm";

export default function NuevoPage() {
  return (
    <div className="pb-4">
      <div className="mb-5 flex items-center gap-3">
        <Link
          href="/"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg shadow-sm active:scale-95 dark:bg-zinc-900"
          aria-label="Volver"
        >
          ‹
        </Link>
        <h1 className="text-lg font-bold">Nuevo movimiento</h1>
      </div>
      <MovementForm />
    </div>
  );
}
