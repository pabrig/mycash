"use client";

import { useFinance } from "@/context/FinanceContext";
import { IconEye, IconEyeOff } from "@/components/ui/Icons";

export function AmountsToggle({
  className = "",
}: {
  className?: string;
}) {
  const { amountsHidden, setAmountsHidden } = useFinance();

  return (
    <button
      type="button"
      onClick={() => setAmountsHidden(!amountsHidden)}
      className={`flex h-10 w-10 items-center justify-center rounded-full bg-[var(--card)] text-zinc-500 transition active:scale-95 ${className}`}
      aria-label={amountsHidden ? "Mostrar montos" : "Ocultar montos"}
      aria-pressed={amountsHidden}
      title={amountsHidden ? "Mostrar montos" : "Ocultar montos"}
    >
      {amountsHidden ? (
        <IconEyeOff className="h-5 w-5" />
      ) : (
        <IconEye className="h-5 w-5" />
      )}
    </button>
  );
}
