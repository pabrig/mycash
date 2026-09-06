"use client";

import { initials } from "@/lib/format";

const TONES = [
  "bg-primary/15 text-primary",
  "bg-[var(--cta)] text-[var(--cta-fg)]",
  "bg-[var(--expense)]/15 text-[var(--expense)]",
  "bg-amber-500/15 text-amber-800 dark:text-amber-300",
];

export function UserAvatar({
  name,
  size = "md",
  tone = 0,
  className = "",
}: {
  name?: string | null;
  size?: "sm" | "md" | "lg";
  tone?: number;
  className?: string;
}) {
  const box =
    size === "sm"
      ? "h-8 w-8 text-[10px]"
      : size === "lg"
        ? "h-12 w-12 text-sm"
        : "h-10 w-10 text-xs";

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-bold ${box} ${TONES[tone % TONES.length]} ${className}`}
      title={name ?? undefined}
    >
      {initials(name ?? "")}
    </div>
  );
}
