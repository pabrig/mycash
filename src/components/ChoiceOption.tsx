"use client";

import { IconCheck } from "@/components/ui/Icons";

export function ChoiceOption({
  title,
  description,
  example,
  selected,
  onSelect,
  size = "compact",
}: {
  title: string;
  description: string;
  example?: string;
  selected: boolean;
  onSelect: () => void;
  size?: "compact" | "comfortable";
}) {
  const comfortable = size === "comfortable";

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`flex w-full items-start gap-3 rounded-2xl text-left transition-all active:scale-[0.99] ${
        comfortable ? "p-4" : "p-3.5"
      } ${
        selected
          ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
          : "bg-[var(--card-muted)]"
      }`}
    >
      <span className="min-w-0 flex-1">
        <p className={comfortable ? "text-base font-semibold" : "text-sm font-semibold"}>
          {title}
        </p>
        <p
          className={`mt-0.5 leading-relaxed ${
            comfortable ? "text-sm" : "text-xs"
          } ${selected ? "text-white/70 dark:text-zinc-600" : "text-zinc-400"}`}
        >
          {description}
        </p>
        {example ? (
          <p
            className={`mt-1.5 leading-relaxed ${
              comfortable ? "text-sm" : "text-xs"
            } ${selected ? "text-white/55 dark:text-zinc-500" : "text-zinc-400"}`}
          >
            {example}
          </p>
        ) : null}
      </span>
      <span
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
          selected
            ? "border-white bg-white text-zinc-900 dark:border-zinc-900 dark:bg-zinc-900 dark:text-white"
            : "border-zinc-300 dark:border-zinc-600"
        }`}
        aria-hidden
      >
        {selected ? <IconCheck className="h-3.5 w-3.5" /> : null}
      </span>
    </button>
  );
}
