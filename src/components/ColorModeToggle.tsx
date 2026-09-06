"use client";

import { useEffect } from "react";
import {
  COLOR_MODE_LABELS,
  COLOR_MODES,
  type ColorMode,
} from "@/lib/color-mode";
import { startThemeColorGuard } from "@/lib/brand-theme";
import { useColorMode } from "@/hooks/useColorMode";

export function ColorModeToggle() {
  const { mode, setMode } = useColorMode();

  return (
    <section className="bento space-y-4">
      <div>
        <p className="text-sm font-semibold tracking-tight">Apariencia</p>
        <p className="meta mt-1 text-xs leading-relaxed">
          Claro, oscuro, o el mismo del teléfono.
        </p>
      </div>
      <div
        className="flex rounded-full bg-[var(--card-muted)] p-1"
        role="radiogroup"
        aria-label="Apariencia"
      >
        {COLOR_MODES.map((id) => (
          <ModeButton
            key={id}
            id={id}
            selected={mode === id}
            onSelect={() => setMode(id)}
          />
        ))}
      </div>
    </section>
  );
}

function ModeButton({
  id,
  selected,
  onSelect,
}: {
  id: ColorMode;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`flex-1 rounded-full px-3 py-2.5 text-xs font-bold tracking-wide transition-all active:scale-95 ${ selected ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm" : "text-[var(--muted-fg)]" }`}
    >
      {COLOR_MODE_LABELS[id]}
    </button>
  );
}

/** Mantiene suscripción al sistema y el theme-color del notch alineado al fondo. */
export function ColorModeSync() {
  useColorMode();
  useEffect(() => startThemeColorGuard(), []);
  return null;
}
