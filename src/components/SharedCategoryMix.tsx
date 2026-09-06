import { sharedCategoryCopy } from "@/lib/shared-copy";
import { expenseCategoryLabel } from "@/lib/labels";
import type { SharedCategorySlice } from "@/lib/types";

const CATEGORY_SWATCH: Record<string, string> = {
  alimentacion: "bg-[var(--expense)]",
  servicios: "bg-cyan-400",
  transporte: "bg-sky-500",
  educacion: "bg-purple-400",
  deporte: "bg-green-400",
  cultura: "bg-violet-400",
  entretenimiento: "bg-pink-400",
  salud: "bg-[var(--expense)]/70",
  streaming: "bg-sky-300",
  seguros: "bg-[var(--muted-fg)]/50",
  alquiler: "bg-orange-400",
  salidas: "bg-fuchsia-400",
  extras: "bg-amber-400",
  otros: "bg-[var(--muted-fg)]/40",
  /** Ids viejos en datos guardados */
  escuela: "bg-purple-400",
  deportes: "bg-green-400",
};

const FALLBACK_SWATCH = [
  "bg-primary",
  "bg-cyan-500",
  "bg-[var(--expense)]",
  "bg-amber-300",
] as const;

export function categorySwatch(category: string, index: number): string {
  return (
    CATEGORY_SWATCH[category] ?? FALLBACK_SWATCH[index % FALLBACK_SWATCH.length]
  );
}

export function SharedCategoryMix({
  categories,
  formatArs,
  formatUsd,
  title,
  empty,
}: {
  categories: SharedCategorySlice[];
  formatArs: (amount: number) => string;
  formatUsd: (amount: number) => string;
  title?: string;
  empty?: string;
}) {
  const defaults = sharedCategoryCopy();
  const copy = {
    title: title ?? defaults.title,
    empty: empty ?? defaults.empty,
  };
  const headline = categories.slice(0, 2);

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold tracking-wide text-[var(--muted-fg)] uppercase">
        {copy.title}
      </p>
      {categories.length === 0 ? (
        <p className="text-xs text-[var(--muted-fg)]">{copy.empty}</p>
      ) : (
        <>
          {headline.length >= 2 && (
            <div className="grid grid-cols-2 gap-3">
              {headline.map((slice, index) => (
                <div key={slice.category}>
                  <p className="flex items-center gap-1.5 text-xs font-medium text-[var(--muted-fg)]">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${categorySwatch(slice.category, index)}`}
                    />
                    {expenseCategoryLabel(slice.category)}
                  </p>
                  <p className="mt-0.5 text-3xl font-extrabold tracking-tight tabular-nums text-[var(--foreground)]">
                    {slice.share.toFixed(0)}%
                  </p>
                </div>
              ))}
            </div>
          )}
          <div
            className="flex h-2 overflow-hidden rounded-full bg-[var(--card-muted)]"
            aria-hidden
          >
            {categories.map((slice, index) =>
              slice.share > 0 ? (
                <div
                  key={slice.category}
                  className={`${categorySwatch(slice.category, index)} transition-all`}
                  style={{ width: `${slice.share}%` }}
                />
              ) : null,
            )}
          </div>
          <ul className="space-y-3">
            {categories.map((slice, index) => (
              <li
                key={slice.category}
                className="flex items-start justify-between gap-3"
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${categorySwatch(slice.category, index)}`}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-[var(--foreground)] dark:text-[var(--foreground)]">
                      {expenseCategoryLabel(slice.category)}
                    </span>
                    <span className="mt-0.5 block text-[10px] tabular-nums text-[var(--muted-fg)]">
                      {formatUsd(slice.amountUsd)}
                    </span>
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-sm font-bold tabular-nums amount-negative">
                    {formatArs(slice.amountArs)}
                  </span>
                  <span className="mt-0.5 block text-[10px] tabular-nums text-[var(--muted-fg)]">
                    {slice.share.toFixed(0)}%
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
