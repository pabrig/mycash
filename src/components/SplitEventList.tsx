"use client";

import Link from "next/link";
import { useFormatMoney } from "@/hooks/useDisplayAmount";
import { formatEventDates, settleEvent, type SplitEvent } from "@/lib/split-bill";
import { IconPlus } from "@/components/ui/Icons";

export function SplitEventList({ events }: { events: SplitEvent[] }) {
  const formatArs = useFormatMoney();

  if (events.length === 0) {
    return (
      <div className="bento space-y-4 py-10 text-center">
        <p className="text-lg font-bold tracking-tight">¿Un asado o un viaje?</p>
        <p className="mx-auto max-w-xs text-sm leading-relaxed text-zinc-500">
          Creá un evento, sumá a la gente y cargá lo que vayan pagando. Al final,
          partes iguales.
        </p>
        <Link href="/dividir/nuevo" className="btn-primary mx-auto block max-w-xs text-sm">
          Nuevo evento
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Link
        href="/dividir/nuevo"
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--card)] py-3.5 text-sm font-semibold transition active:scale-[0.99]"
      >
        <IconPlus className="h-4 w-4" />
        Nuevo evento
      </Link>
      <ul className="space-y-3">
        {events.map((event) => (
          <li key={event.id}>
            <EventCard event={event} formatArs={formatArs} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function EventCard({
  event,
  formatArs,
}: {
  event: SplitEvent;
  formatArs: (n: number) => string;
}) {
  const result = settleEvent(event);
  const dates = formatEventDates(event);
  const count = event.expenses.length;
  const countLabel =
    count === 0 ? "Sin gastos" : count === 1 ? "1 gasto" : `${count} gastos`;

  return (
    <Link
      href={`/dividir/${event.id}`}
      className="bento block space-y-3 p-5 transition active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-lg font-bold tracking-tight">{event.title}</p>
          <p className="mt-0.5 text-xs text-zinc-400">
            {dates ? `${dates} · ${countLabel}` : countLabel}
          </p>
        </div>
        <p className="shrink-0 text-sm font-bold tabular-nums">
          {formatArs(result.total)}
        </p>
      </div>
      <div className="flex items-center justify-between text-sm text-zinc-500">
        <span>
          {event.people.length} {event.people.length === 1 ? "persona" : "personas"}
        </span>
        <span>
          {result.total > 0 ? `${formatArs(result.share)} cada uno` : "Todavía nada"}
        </span>
      </div>
    </Link>
  );
}
