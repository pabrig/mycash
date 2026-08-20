"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { IconClose } from "@/components/ui/Icons";
import { useIsClient } from "@/hooks/useIsClient";

/**
 * Mobile: drawer desde abajo.
 * Desktop (md+): slide-over desde la derecha.
 * Se porta a document.body para que `position: fixed` no quede atrapado
 * por ancestros con `transform` (p.ej. animate-slide-up).
 */
export function DetailSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const mounted = useIsClient();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60]"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[2px]"
        aria-label="Cerrar"
        onClick={onClose}
      />

      {/* Mobile bottom sheet */}
      <div className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col overflow-hidden animate-slide-up rounded-t-3xl bg-[var(--card)] shadow-2xl md:hidden">
        <div className="flex shrink-0 justify-center pt-3">
          <div className="h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-600" />
        </div>
        <div className="flex shrink-0 items-center justify-between px-5 pt-3 pb-2">
          <h2 className="text-lg font-bold tracking-tight">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--card-muted)] text-zinc-500"
            aria-label="Cerrar"
          >
            <IconClose className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>

      {/* Desktop slide-over */}
      <div className="absolute inset-y-0 right-0 hidden w-full max-w-md animate-fade-in bg-[var(--card)] shadow-2xl md:flex md:flex-col">
        <div className="flex items-center justify-between px-6 py-5">
          <h2 className="text-xl font-bold tracking-tight">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--card-muted)] text-zinc-500 transition hover:text-zinc-900"
            aria-label="Cerrar"
          >
            <IconClose className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
