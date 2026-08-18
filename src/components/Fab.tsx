"use client";

import Link from "next/link";

export function Fab() {
  return (
    <Link
      href="/nuevo"
      className="absolute -top-7 left-1/2 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-emerald-600 text-3xl font-light text-white shadow-lg shadow-emerald-600/30 transition-transform active:scale-95"
      aria-label="Nuevo movimiento"
    >
      +
    </Link>
  );
}
