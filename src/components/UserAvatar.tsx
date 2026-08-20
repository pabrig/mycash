"use client";

import { initials } from "@/lib/format";

const TONES = [
  "bg-teal-500/15 text-teal-700 dark:text-teal-300",
  "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900",
  "bg-rose-500/15 text-rose-700 dark:text-rose-300",
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
    size === "sm" ? "h-8 w-8 text-[10px]" : size === "lg" ? "h-12 w-12 text-sm" : "h-10 w-10 text-xs";

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-bold ${box} ${TONES[tone % TONES.length]} ${className}`}
      title={name ?? undefined}
    >
      {initials(name ?? "")}
    </div>
  );
}
