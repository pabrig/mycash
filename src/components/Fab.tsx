"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconPlus } from "@/components/ui/Icons";

export function Fab() {
  const pathname = usePathname();
  const href = pathname.startsWith("/compartido")
    ? "/compartido/nuevo"
    : "/nuevo";

  return (
    <Link
      href={href}
      className="absolute -top-6 left-1/2 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg shadow-zinc-900/25 transition-transform active:scale-95 dark:bg-white dark:text-zinc-900 dark:shadow-white/10"
      aria-label="Cargar un gasto o ingreso"
    >
      <IconPlus className="h-6 w-6" />
    </Link>
  );
}
