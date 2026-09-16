"use client";

import { useState } from "react";
import { DetailSheet } from "@/components/ui/DetailSheet";
import { SavingsLocationEditor } from "@/components/SavingsLocationEditor";
import { SavingsLocationIcon } from "@/components/SavingsLocationIcon";
import { useFinance } from "@/context/FinanceContext";
import { useFormatUsd } from "@/hooks/useDisplayAmount";
import { isFeatureEnabled } from "@/lib/feature-flags";
import {
  locationSharePercent,
  locationsGap,
  sortedLocations,
} from "@/lib/savings-locations";
import type { SavingsLocation } from "@/lib/savings-locations";

export function SavingsLocationsBlock({ ahorroTotal }: { ahorroTotal: number }) {
  const { savingsLocationsEnabled, savingsLocations } = useFinance();
  const formatUsd = useFormatUsd();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<SavingsLocation | null>(null);

  if (!isFeatureEnabled("savingsLocations") || !savingsLocationsEnabled) {
    return null;
  }

  const rows = sortedLocations(savingsLocations);
  const gap = locationsGap(rows, ahorroTotal);
  const gapAbs = Math.abs(gap);

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold tracking-wide text-[var(--muted-fg)] uppercase">
            Dónde está
          </p>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="text-[11px] font-semibold text-primary"
          >
            Agregar
          </button>
        </div>

        {rows.length === 0 ? (
          <p className="text-xs leading-relaxed text-[var(--muted-fg)]">
            Todavía no cargaste lugares. El total de arriba no cambia: esto
            solo explica en qué cuentas está.
          </p>
        ) : (
          <ul className="space-y-1">
            {rows.map((location) => {
              const share = locationSharePercent(location.amount, ahorroTotal);
              return (
                <li key={location.id}>
                  <button
                    type="button"
                    onClick={() => setEditing(location)}
                    className="flex w-full items-center gap-2.5 rounded-2xl px-1 py-1.5 text-left transition active:bg-[var(--card)]/60"
                  >
                    <SavingsLocationIcon name={location.name} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-[var(--foreground)]">
                        {location.name}
                      </span>
                      {ahorroTotal > 0 ? (
                        <span className="text-[11px] text-[var(--muted-fg)]">
                          {share.toFixed(0)}%
                        </span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">
                      {formatUsd(location.amount)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {rows.length > 0 && gapAbs >= 0.5 ? (
          <p className="text-[11px] leading-relaxed text-[var(--muted-fg)]">
            {gap < 0
              ? `Faltan ${formatUsd(gapAbs)} para llegar al total`
              : `Sobran ${formatUsd(gapAbs)} respecto del total`}
          </p>
        ) : rows.length > 0 ? (
          <p className="text-[11px] text-[var(--muted-fg)]">
            Cuadra con el total de Ahorro
          </p>
        ) : null}
      </div>

      {creating ? (
        <DetailSheet
          open
          onClose={() => setCreating(false)}
          title="Nuevo lugar"
        >
          <SavingsLocationEditor
            onDone={() => setCreating(false)}
            onCancel={() => setCreating(false)}
          />
        </DetailSheet>
      ) : null}

      {editing ? (
        <DetailSheet
          open
          onClose={() => setEditing(null)}
          title="Editar lugar"
        >
          <SavingsLocationEditor
            location={editing}
            onDone={() => setEditing(null)}
            onCancel={() => setEditing(null)}
          />
        </DetailSheet>
      ) : null}
    </>
  );
}
