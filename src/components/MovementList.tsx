"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFinance } from "@/context/FinanceContext";
import { toArs } from "@/lib/currency";
import { useDisplayAmount } from "@/hooks/useDisplayAmount";
import type { Movement } from "@/lib/types";

type Filter = "all" | "income" | "personal" | "shared";

const ALL_FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "income", label: "Ingresos" },
  { id: "personal", label: "Personal" },
  { id: "shared", label: "Compartido" },
];

const PERSONAL_FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "income", label: "Ingresos" },
  { id: "personal", label: "Gastos" },
];

function matchesFilter(movement: Movement, filter: Filter): boolean {
  switch (filter) {
    case "all":
      return true;
    case "income":
      return movement.type === "income";
    case "personal":
      return movement.type === "expense" && movement.scope !== "shared";
    case "shared":
      return movement.type === "expense" && movement.scope === "shared";
  }
}

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

function canManageMovement(
  movement: Movement,
  cloudEnabled: boolean,
  userId: string | undefined,
): boolean {
  if (!cloudEnabled) return true;
  if (movement.scope === "shared") {
    return !movement.createdByUserId || movement.createdByUserId === userId;
  }
  return true;
}

function MovementRow({
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
  const isIncome = movement.type === "income";
  const isShared = movement.scope === "shared";
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
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
            isIncome
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
              : isShared
                ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
                : "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
          }`}
        >
          {isIncome ? "↑" : isShared ? "◉" : "↓"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{movement.description}</p>
          <p className="text-xs text-zinc-500">
            {isShared
              ? movement.createdByName
                ? `${movement.createdByName} · Compartido`
                : "Compartido"
              : isIncome
                ? "Ingreso"
                : "Personal"}
            {movement.category && ` · ${movement.category}`}
          </p>
        </div>
        <div className="text-right">
          <p
            className={`font-semibold tabular-nums ${
              isIncome ? "text-emerald-600" : "text-zinc-800 dark:text-zinc-100"
            }`}
          >
            {isIncome ? "+" : "−"}
            {fmt(arsAmount)}
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

export function MovementList() {
  const { user } = useAuth();
  const { monthMovements, rate, deleteMovement, cloudEnabled, sharedEnabled } =
    useFinance();
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filters = sharedEnabled ? ALL_FILTERS : PERSONAL_FILTERS;
  const activeFilter =
    !sharedEnabled && filter === "shared" ? "all" : filter;

  const filtered = monthMovements
    .filter((m) => matchesFilter(m, activeFilter))
    .sort((a, b) => b.date.localeCompare(a.date));

  if (monthMovements.length === 0) {
    return (
      <section className="card animate-slide-up p-8 text-center">
        <p className="text-4xl">📝</p>
        <p className="mt-3 font-medium">Sin movimientos</p>
        <p className="mt-1 text-sm text-zinc-500">
          Tocá + para cargar tu primer ticket
        </p>
        <Link href="/nuevo" className="btn-primary mt-5 inline-block px-6">
          Cargar movimiento
        </Link>
      </section>
    );
  }

  const groups = groupByDate(filtered);

  return (
    <section className="animate-slide-up">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
          Movimientos
        </h2>
        <span className="text-xs text-zinc-400">{filtered.length} items</span>
      </div>

      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {filters.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`chip shrink-0 ${activeFilter === id ? "chip-active" : "chip-inactive"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">
          Nada con este filtro
        </p>
      ) : (
        <div className="card divide-y divide-zinc-100 px-4 dark:divide-zinc-800">
          {[...groups.entries()].map(([date, items]) => (
            <div key={date}>
              <p className="sticky top-0 bg-white/95 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400 backdrop-blur dark:bg-zinc-900/95">
                {formatDayLabel(date)}
              </p>
              <ul>
                {items.map((m) => (
                  <MovementRow
                    key={m.id}
                    movement={m}
                    arsAmount={toArs(m.amount, m.currency, rate)}
                    canManage={canManageMovement(m, cloudEnabled, user?.id)}
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
      )}
    </section>
  );
}
