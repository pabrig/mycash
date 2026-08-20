"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { SplitEventDetail } from "@/components/SplitEventDetail";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useSplitEvents } from "@/hooks/useSplitEvents";

export default function SplitEventPage() {
  const params = useParams<{ id: string }>();
  const { ready, getEvent, addExpense, removeExpense, deleteEvent } =
    useSplitEvents();
  const id = params.id;
  const event = getEvent(id);

  if (!ready) return <LoadingScreen variant="account" />;

  if (!event) {
    return (
      <div className="bento mx-auto max-w-lg space-y-4 p-6 text-center">
        <p className="font-medium">No encontramos este evento</p>
        <Link
          href="/dividir"
          className="text-sm font-semibold text-zinc-900 dark:text-white"
        >
          Volver a Dividir
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg pb-4 md:max-w-xl md:pt-2">
      <div className="mb-5 flex items-center gap-3">
        <Link
          href="/dividir"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--card)] text-lg active:scale-95"
          aria-label="Volver"
        >
          ‹
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold md:text-2xl">{event.title}</h1>
          <p className="meta text-xs">En partes iguales</p>
        </div>
      </div>
      <SplitEventDetail
        event={event}
        onAddExpense={(input) => addExpense(event.id, input)}
        onRemoveExpense={(expenseId) => removeExpense(event.id, expenseId)}
        onDelete={() => deleteEvent(event.id)}
      />
    </div>
  );
}
