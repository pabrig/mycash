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
        <p className="text-sm font-medium text-[var(--muted-fg)]">
          {copy.label}
        </p>
        <p
          className={`mt-2 text-5xl font-extrabold tracking-tighter tabular-nums md:text-6xl ${ totalArs > 0 ? "amount-negative" : "text-[var(--foreground)]" }`}
        >
          {formatArs(totalArs)}
        </p>
        <p className="mt-2 text-xl font-semibold tabular-nums text-[var(--muted-fg)] dark:text-[var(--muted-fg)]">
          {formatUsd(totalUsd)}
        </p>
        <p className="meta mt-2">{copy.asOf}</p>
        <p className="meta mt-0.5">{copy.fx}</p>
        <p className="mt-3 text-xs leading-relaxed text-[var(--muted-fg)]">
          {copy.hint}
        </p>
      </div>

      <div className="space-y-5 border-t border-[var(--card-border)] px-4 py-5 dark:border-[var(--card-border)]/80 sm:px-6">
        <SharedCategoryMix
          categories={categories}
          formatArs={formatArs}
          formatUsd={formatUsd}
        />
        {children ? (
          <div className="border-t border-[var(--card-border)] pt-5 dark:border-[var(--card-border)]/80">
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}
