import type { ReactNode } from "react";
import { SharedCategoryMix } from "@/components/SharedCategoryMix";
import type { SharedCategorySlice } from "@/lib/types";

export function SharedSpendHero({
  copy,
  totalArs,
  totalUsd,
  categories,
  formatArs,
  formatUsd,
  children,
}: {
  copy: { label: string; asOf: string; fx: string; hint: string };
  totalArs: number;
  totalUsd: number;
  categories: SharedCategorySlice[];
  formatArs: (amount: number) => string;
  formatUsd: (amount: number) => string;
  children?: ReactNode;
}) {
  return (
    <div className="bento overflow-hidden !p-0">
      <div className="px-6 pt-7 pb-6">
        <p className="text-sm font-medium text-zinc-400">{copy.label}</p>
        <p
          className={`mt-2 text-5xl font-extrabold tracking-tighter tabular-nums md:text-6xl ${
            totalArs > 0
              ? "amount-negative"
              : "text-zinc-900 dark:text-white"
          }`}
        >
          {formatArs(totalArs)}
        </p>
        <p className="mt-2 text-xl font-semibold tabular-nums text-zinc-500 dark:text-zinc-400">
          {formatUsd(totalUsd)}
        </p>
        <p className="meta mt-2">{copy.asOf}</p>
        <p className="meta mt-0.5">{copy.fx}</p>
        <p className="mt-3 text-xs leading-relaxed text-zinc-400">{copy.hint}</p>
      </div>

      <div className="space-y-5 border-t border-zinc-100 px-4 py-5 dark:border-zinc-800/80 sm:px-6">
        <SharedCategoryMix
          categories={categories}
          formatArs={formatArs}
          formatUsd={formatUsd}
        />
        {children ? (
          <div className="border-t border-zinc-100 pt-5 dark:border-zinc-800/80">
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}
