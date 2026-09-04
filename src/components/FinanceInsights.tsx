import type { FinanceInsight } from "@/lib/finance-analysis";
import { financeInsightsCopy } from "@/lib/finance-analysis";

const TONE_DOT: Record<FinanceInsight["tone"], string> = {
  positive: "bg-teal-500",
  warning: "bg-rose-400",
  neutral: "bg-zinc-300 dark:bg-zinc-500",
};

export function FinanceInsights({ insights }: { insights: FinanceInsight[] }) {
  if (insights.length === 0) return null;

  const copy = financeInsightsCopy();

  return (
    <div className="bento space-y-3 !px-4 !py-5 sm:!px-6">
      <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
        {copy.title}
      </h2>
      <ul className="space-y-3">
        {insights.map((insight) => (
          <li key={insight.id} className="flex items-start gap-2.5">
            <span
              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${TONE_DOT[insight.tone]}`}
              aria-hidden
            />
            <p className="text-sm leading-snug text-zinc-700 dark:text-zinc-200">
              {insight.text}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
