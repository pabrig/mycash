import { sharedCategoryCopy } from "@/lib/shared-copy";
import { expenseCategoryLabel } from "@/lib/labels";
import type { SharedCategorySlice } from "@/lib/types";

const CATEGORY_SWATCH: Record<string, string> = {
  alimentacion: "bg-rose-500",
  transporte: "bg-teal-500",
  salidas: "bg-fuchsia-400",
  servicios: "bg-cyan-400",
  salud: "bg-rose-300",
  streaming: "bg-teal-300",
  seguros: "bg-zinc-400",
  alquiler: "bg-orange-400",
  escuela: "bg-purple-400",
  deportes: "bg-green-400",
  otros: "bg-zinc-300 dark:bg-zinc-500"
};

const FALLBACK_SWATCH = [
  "bg-teal-600",
  "bg-cyan-500",
  "bg-rose-400",
  "bg-amber-300"
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
      <p className="text-[11px] font-semibold tracking-wide text-zinc-400 uppercase">
        {copy.title}
      </p>
      {categories.length === 0 ? (
        <p className="text-xs text-zinc-400">{copy.empty}</p>
      ) : (
        <>
          {headline.length >= 2 && (
            <div className="grid grid-cols-2 gap-3">
              {headline.map((slice, index) => (
                <div key={slice.category}>
                  <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${categorySwatch(slice.category, index)}`}
                    />
                    {expenseCategoryLabel(slice.category)}
                  </p>
                  <p className="mt-0.5 text-3xl font-extrabold tracking-tight tabular-nums text-zinc-900 dark:text-white">
                    {slice.share.toFixed(0)}%
                  </p>
                </div>
              ))}
            </div>
          )}
          <div
            className="flex h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
            aria-hidden
          >
            {categories.map((slice, index) =>
              slice.share > 0 ? (
                <div
                  key={slice.category}
                  className={`${categorySwatch(slice.category, index)} transition-all`}
                  style={{ width: `${slice.share}%` }}
                />
              ) : null
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
                    <span className="block truncate text-sm font-medium text-zinc-700 dark:text-zinc-200">
                      {expenseCategoryLabel(slice.category)}
                    </span>
                    <span className="mt-0.5 block text-[10px] tabular-nums text-zinc-400">
                      {formatUsd(slice.amountUsd)}
                    </span>
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-sm font-bold tabular-nums amount-negative">
                    {formatArs(slice.amountArs)}
                  </span>
                  <span className="mt-0.5 block text-[10px] tabular-nums text-zinc-400">
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
