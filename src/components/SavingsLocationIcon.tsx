"use client";

import { useState } from "react";
import { IconCash, IconSafe } from "@/components/ui/Icons";
import {
  resolveLocationIcon,
  type LocationIconKind,
} from "@/lib/savings-location-icons";

function GenericMark({
  kind,
  className,
}: {
  kind: Extract<LocationIconKind, "cash" | "safe">;
  className: string;
}) {
  if (kind === "cash") return <IconCash className={className} />;
  return <IconSafe className={className} />;
}

export function SavingsLocationIcon({
  name,
  className = "h-9 w-9",
}: {
  name: string;
  className?: string;
}) {
  const resolved = resolveLocationIcon(name);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = Boolean(resolved.src) && failedSrc !== resolved.src;

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--card-muted)] text-[var(--muted-fg)] ${className}`}
      aria-hidden
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={resolved.src}
          src={resolved.src ?? undefined}
          alt=""
          className="h-full w-full object-contain p-1"
          onError={() => setFailedSrc(resolved.src)}
        />
      ) : resolved.kind === "cash" || resolved.kind === "safe" ? (
        <GenericMark kind={resolved.kind} className="h-[55%] w-[55%]" />
      ) : (
        <span className="text-[11px] font-bold leading-none">
          {resolved.letter}
        </span>
      )}
    </span>
  );
}
