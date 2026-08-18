"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFinance } from "@/context/FinanceContext";
import { useDisplayAmount } from "@/hooks/useDisplayAmount";
import { toArs } from "@/lib/currency";
import { filterByMonth } from "@/lib/summary";
import type { Movement } from "@/lib/types";

function formatDayLabel(date: string): string {
  const d = new Date(date + "T12:00:00");
  const today = new Date();
  const isToday =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
  if (isToday) return "Hoy";
  return d.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function groupByDate(movements: Movement[]): Map<string, Movement[]> {
  const groups = new Map<string, Movement[]>();
  for (const m of movements) {
    const list = groups.get(m.date) ?? [];
    list.push(m);
    groups.set(m.date, list);
  }
  return groups;
}

function SharedRow({
  movement,
  arsAmount,
  canManage,
  selected,
  onSelect,
  onDelete,
}: {
  movement: Movement;
  arsAmount: number;
  canManage: boolean;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => Promise<void>;
}) {
  const router = useRouter();
  const fmt = useDisplayAmount();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`¿Eliminar "${movement.description}"?`)) return;
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <li className="py-1">
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full items-center gap-3 py-2 text-left active:opacity-80"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
          ◉
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{movement.description}</p>
          <p className="text-xs text-zinc-500">
            {movement.createdByName ? `${movement.createdByName} · ` : ""}
            {movement.category ?? "compartido"}
          </p>
        </div>
        <div className="text-right">
          <p className="font-semibold tabular-nums text-zinc-800 dark:text-zinc-100">
            −{fmt(arsAmount)}
          </p>
          {movement.currency !== "ARS" && (
            <p className="text-[10px] text-zinc-400">
              {movement.amount} {movement.currency}
            </p>
          )}
        </div>
      </button>

      {selected && canManage && (
        <div className="mb-2 flex gap-2 pl-[3.25rem]">
          <button
            type="button"
            onClick={() => router.push(`/editar/${movement.id}`)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-zinc-100 py-2 text-sm font-medium text-zinc-700 active:scale-[0.98] dark:bg-zinc-800 dark:text-zinc-200"
          >
            <span aria-hidden>✎</span>
            Editar
          </button>
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={deleting}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-50 py-2 text-sm font-medium text-red-600 active:scale-[0.98] disabled:opacity-40 dark:bg-red-950/40"
          >
            <span aria-hidden>×</span>
            {deleting ? "…" : "Eliminar"}
          </button>
        </div>
      )}
    </li>
  );
}

export function SharedMovementList() {
  const { user } = useAuth();
  const { sharedMovements, year, month, rate, deleteMovement, cloudEnabled } =
    useFinance();
  const fmt = useDisplayAmount();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const monthShared = useMemo(
    () =>
      filterByMonth(sharedMovements, year, month).sort((a, b) =>
        b.date.localeCompare(a.date),
      ),
    [sharedMovements, year, month],
  );

  const total = useMemo(
    () =>
      monthShared.reduce(
        (sum, m) => sum + toArs(m.amount, m.currency, rate),
        0,
      ),
    [monthShared, rate],
  );

  if (monthShared.length === 0) {
    return (
      <section className="card animate-slide-up p-8 text-center">
        <p className="text-4xl">👥</p>
        <p className="mt-3 font-medium">Sin gastos compartidos</p>
        <p className="mt-1 text-sm text-zinc-500">
          Tocá + para cargar un gasto del hogar
        </p>
        <Link
          href="/compartido/nuevo"
          className="btn-primary mt-5 inline-block px-6"
        >
          Cargar gasto compartido
        </Link>
      </section>
    );
  }

  const groups = groupByDate(monthShared);

  return (
    <section className="animate-slide-up space-y-3">
      <div className="card flex items-center justify-between px-4 py-3">
        <p className="text-sm text-zinc-500">Total compartido del mes</p>
        <p className="text-lg font-bold tabular-nums text-indigo-600">
          {fmt(total)}
        </p>
      </div>

      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
          Gastos compartidos
        </h2>
        <span className="text-xs text-zinc-400">{monthShared.length} items</span>
      </div>

      <div className="card divide-y divide-zinc-100 px-4 dark:divide-zinc-800">
        {[...groups.entries()].map(([date, items]) => (
          <div key={date}>
            <p className="sticky top-0 bg-white/95 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400 backdrop-blur dark:bg-zinc-900/95">
              {formatDayLabel(date)}
            </p>
            <ul>
              {items.map((m) => (
                <SharedRow
                  key={m.id}
                  movement={m}
                  arsAmount={toArs(m.amount, m.currency, rate)}
                  canManage={
                    !cloudEnabled ||
                    !m.createdByUserId ||
                    m.createdByUserId === user?.id
                  }
                  selected={selectedId === m.id}
                  onSelect={() =>
                    setSelectedId((prev) => (prev === m.id ? null : m.id))
                  }
                  onDelete={async () => {
                    await deleteMovement(m.id);
                    setSelectedId(null);
                  }}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
