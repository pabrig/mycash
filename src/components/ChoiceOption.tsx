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
      className={`flex w-full items-start gap-3 rounded-2xl text-left transition-all active:scale-[0.99] ${comfortable ? "p-4" : "p-3.5"} ${selected ? "bg-[var(--cta)] text-[var(--cta-fg)]" : "bg-[var(--card-muted)]"}`}
    >
      <span className="min-w-0 flex-1">
        <p
          className={
            comfortable ? "text-base font-semibold" : "text-sm font-semibold"
          }
        >
          {title}
        </p>
        <p
          className={`mt-0.5 leading-relaxed ${comfortable ? "text-sm" : "text-xs"} ${selected ? "opacity-70" : "text-[var(--muted-fg)]"}`}
        >
          {description}
        </p>
        {example ? (
          <p
            className={`mt-1.5 leading-relaxed ${comfortable ? "text-sm" : "text-xs"} ${selected ? "opacity-55" : "text-[var(--muted-fg)]"}`}
          >
            {example}
          </p>
        ) : null}
      </span>
      <span
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
          selected
            ? "border-[var(--cta-fg)] bg-[var(--cta-fg)] text-[var(--cta)]"
            : "border-[var(--card-border)]"
        }`}
        aria-hidden
      >
        {selected ? <IconCheck className="h-3.5 w-3.5" /> : null}
      </span>
    </button>
  );
}
