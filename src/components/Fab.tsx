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
      className="absolute -top-14 left-1/2 z-20 -translate-x-1/2"
      aria-label="Cargar un gasto o ingreso"
    >
      <span className="fab-add relative flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg shadow-zinc-900/25 dark:bg-white dark:text-zinc-900 dark:shadow-white/10">
        <IconPlus className="fab-add-icon h-6 w-6" />
      </span>
    </Link>
  );
}
