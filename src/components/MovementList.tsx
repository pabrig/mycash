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
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={`flex w-full items-center gap-3.5 rounded-2xl px-3 py-3 text-left transition ${
          selected ? "bg-[var(--card-muted)]" : "active:bg-[var(--card-muted)]"
        }`}
      >
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${
            isIncome
              ? "bg-emerald-500/10 text-emerald-600"
              : isShared
                ? "bg-teal-500/10 text-teal-600"
                : "bg-rose-500/10 text-rose-500"
          }`}
        >
          {isIncome ? "↑" : isShared ? "◎" : "↓"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold tracking-tight">
            {movement.description}
          </p>
          <p className="meta mt-0.5 text-xs">
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
            className={`font-bold tabular-nums tracking-tight ${
              isIncome ? "amount-positive" : "text-zinc-900 dark:text-white"
            }`}
          >
            {isIncome ? "+" : "−"}
            {fmt(arsAmount)}
          </p>
          {movement.currency !== "ARS" && (
            <p className="mt-0.5 text-[10px] text-zinc-400">
              {movement.amount} {movement.currency}
            </p>
          )}
        </div>
      </button>

      {selected && canManage && (
        <div className="mb-1 flex gap-2 px-3 pb-2 pl-[3.75rem]">
          <button
            type="button"
            onClick={() => router.push(`/editar/${movement.id}`)}
            className="flex flex-1 items-center justify-center rounded-xl bg-[var(--card-muted)] py-2.5 text-sm font-semibold text-zinc-700 active:scale-[0.98] dark:text-zinc-200"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={deleting}
            className="flex flex-1 items-center justify-center rounded-xl bg-rose-500/10 py-2.5 text-sm font-semibold text-rose-600 active:scale-[0.98] disabled:opacity-40"
          >
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
      <section className="bento animate-slide-up-delay-2 py-12 text-center">
        <p className="text-sm font-semibold text-zinc-400">Sin movimientos</p>
        <p className="meta mt-1">Tocá + para cargar el primero</p>
        <Link href="/nuevo" className="btn-primary mt-6 inline-block px-8 text-sm">
          Cargar movimiento
        </Link>
      </section>
    );
  }

  const groups = groupByDate(filtered);

  return (
    <section className="animate-slide-up-delay-2">
      <div className="mb-4 flex items-end justify-between">
        <h2 className="text-lg font-bold tracking-tight">Movimientos</h2>
        <span className="text-xs font-medium text-zinc-400">
          {filtered.length}
        </span>
      </div>

      <div className="mb-4 flex gap-1 overflow-x-auto pb-0.5">
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
        <p className="py-10 text-center text-sm text-zinc-400">
          Nada con este filtro
        </p>
      ) : (
        <div className="bento space-y-5 !px-2 !py-3">
          {[...groups.entries()].map(([date, items]) => (
            <div key={date}>
              <p className="px-3 pb-1 text-[11px] font-semibold tracking-wide text-zinc-400 uppercase">
                {formatDayLabel(date)}
              </p>
              <ul className="space-y-0.5">
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
