"use client";

import Link from "next/link";
import { SplitBill } from "@/components/SplitBill";

export default function DividirPage() {
  return (
    <div className="mx-auto w-full max-w-lg pb-4 md:max-w-xl md:pt-2">
      <div className="mb-5 flex items-center gap-3">
        <Link
          href="/"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--card)] text-lg active:scale-95 md:hidden"
          aria-label="Volver"
        >
          ‹
        </Link>
        <div>
          <h1 className="text-lg font-bold md:text-2xl">Dividir</h1>
          <p className="meta text-xs">En partes iguales</p>
        </div>
      </div>
      <SplitBill />
    </div>
  );
}
