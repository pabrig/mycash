"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFinance } from "@/context/FinanceContext";
import { toArs } from "@/lib/currency";
import { useDisplayAmount } from "@/hooks/useDisplayAmount";
import { DetailSheet } from "@/components/ui/DetailSheet";
import {
  IconArrowDown,
  IconArrowUp,
  IconShared,
} from "@/components/ui/Icons";
import {
  canManageMovement,
  matchesMovementFilter,
  type MovementListFilter,
} from "@/lib/movement-access";
import type { Movement } from "@/lib/types";

type Filter = MovementListFilter;

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

function formatFullDate(date: string): string {
  return new Date(date + "T12:00:00").toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
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

function scopeLabel(movement: Movement): string {
  if (movement.scope === "shared") {
    return movement.createdByName
      ? `${movement.createdByName} · Compartido`
      : "Compartido";
  }
  return movement.type === "income" ? "Ingreso" : "Personal";
}

function MovementRow({
  movement,
  arsAmount,
  selected,
  onSelect,
  dense,
}: {
  movement: Movement;
  arsAmount: number;
  selected: boolean;
  onSelect: () => void;
  dense?: boolean;
}) {
  const fmt = useDisplayAmount();
  const isIncome = movement.type === "income";
  const isShared = movement.scope === "shared";

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={`flex w-full items-center gap-3 rounded-2xl px-3 text-left transition md:grid md:grid-cols-[minmax(0,1fr)_7rem_6rem_auto] md:items-center ${
          dense ? "py-2.5" : "py-3"
        } ${selected ? "bg-[var(--card-muted)]" : "active:bg-[var(--card-muted)]"}`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div
            className={`flex shrink-0 items-center justify-center rounded-2xl ${
              dense ? "h-9 w-9" : "h-11 w-11"
            } ${
              isIncome
                ? "bg-teal-500/10 text-teal-600"
                : isShared
                  ? "bg-teal-500/10 text-teal-600"
                  : "bg-rose-500/10 text-rose-500"
            }`}
          >
            {isIncome ? (
              <IconArrowUp className="h-4 w-4" />
            ) : isShared ? (
              <IconShared className="h-4 w-4" />
            ) : (
              <IconArrowDown className="h-4 w-4" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold tracking-tight">
              {movement.description}
            </p>
            <p className="meta mt-0.5 truncate text-xs md:hidden">
              {scopeLabel(movement)}
              {movement.category && ` · ${movement.category}`}
            </p>
          </div>
        </div>

        <p className="meta hidden text-xs md:block">
          {formatDayLabel(movement.date)}
        </p>
        <p className="meta hidden truncate text-xs capitalize md:block">
          {movement.category ?? movement.source ?? "—"}
        </p>

        <div className="shrink-0 text-right">
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
    </li>
  );
}

function MovementDetail({
  movement,
  arsAmount,
  canManage,
  onDelete,
  onClose,
}: {
  movement: Movement;
  arsAmount: number;
  canManage: boolean;
  onDelete: () => Promise<void>;
  onClose: () => void;
}) {
  const router = useRouter();
  const fmt = useDisplayAmount();
  const [deleting, setDeleting] = useState(false);
  const isIncome = movement.type === "income";

  async function handleDelete() {
    if (!confirm(`¿Eliminar "${movement.description}"?`)) return;
    setDeleting(true);
    try {
      await onDelete();
      onClose();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6 pb-4">
      <div>
        <p className="text-sm font-medium text-zinc-400">
          {isIncome ? "Ingreso" : "Gasto"}
          {movement.scope === "shared" ? " · Compartido" : ""}
        </p>
        <p
          className={`mt-2 text-4xl font-extrabold tracking-tighter tabular-nums ${
            isIncome ? "amount-positive" : "text-zinc-900 dark:text-white"
          }`}
        >
          {isIncome ? "+" : "−"}
          {fmt(arsAmount)}
        </p>
        {movement.currency !== "ARS" && (
          <p className="meta mt-1">
            {movement.amount} {movement.currency}
          </p>
        )}
      </div>

      <dl className="space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-zinc-400">Descripción</dt>
          <dd className="max-w-[60%] text-right font-semibold">
            {movement.description}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-zinc-400">Fecha</dt>
          <dd className="text-right font-medium capitalize">
            {formatFullDate(movement.date)}
          </dd>
        </div>
        {(movement.category || movement.source) && (
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-400">
              {movement.type === "income" ? "Fuente" : "Categoría"}
            </dt>
            <dd className="text-right font-medium capitalize">
              {movement.category ?? movement.source}
            </dd>
          </div>
        )}
        {movement.createdByName && (
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-400">Cargado por</dt>
            <dd className="text-right font-medium">{movement.createdByName}</dd>
          </div>
        )}
      </dl>

      {canManage && (
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => router.push(`/editar/${movement.id}`)}
            className="flex flex-1 items-center justify-center rounded-2xl bg-[var(--card-muted)] py-3.5 text-sm font-semibold"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={deleting}
            className="flex flex-1 items-center justify-center rounded-2xl bg-rose-500/10 py-3.5 text-sm font-semibold text-rose-600 disabled:opacity-40"
          >
            {deleting ? "…" : "Eliminar"}
          </button>
        </div>
      )}
    </div>
  );
}

export function MovementList({
  variant = "default",
}: {
  /** feed: columna sticky desktop con tipografía más densa */
  variant?: "default" | "feed";
}) {
  const { user } = useAuth();
  const { monthMovements, rate, deleteMovement, cloudEnabled, sharedEnabled } =
    useFinance();
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filters = sharedEnabled ? ALL_FILTERS : PERSONAL_FILTERS;
  const activeFilter =
    !sharedEnabled && filter === "shared" ? "all" : filter;
  const dense = variant === "feed";

  const filtered = monthMovements
    .filter((m) => matchesMovementFilter(m, activeFilter))
    .sort((a, b) => b.date.localeCompare(a.date));

  const selected = filtered.find((m) => m.id === selectedId) ?? null;

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
    <section className={dense ? "animate-fade-in" : "animate-slide-up-delay-2"}>
      <div className="mb-4 flex items-end justify-between">
        <h2 className={`font-bold tracking-tight ${dense ? "text-base" : "text-lg"}`}>
          {dense ? "Últimos movimientos" : "Movimientos"}
        </h2>
        <span className="text-xs font-medium text-zinc-400">{filtered.length}</span>
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

      {/* Header columnas desktop */}
      <div className="mb-2 hidden grid-cols-[1fr_7rem_6rem_auto] gap-3 px-5 text-[10px] font-semibold tracking-wide text-zinc-400 uppercase md:grid">
        <span>Descripción</span>
        <span>Fecha</span>
        <span>Categoría</span>
        <span className="text-right">Monto</span>
      </div>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-zinc-400">
          Nada con este filtro
        </p>
      ) : (
        <div className="bento space-y-5 !px-2 !py-3">
          {[...groups.entries()].map(([date, items]) => (
            <div key={date}>
              <p className="px-3 pb-1 text-[11px] font-semibold tracking-wide text-zinc-400 uppercase md:hidden">
                {formatDayLabel(date)}
              </p>
              <ul className="space-y-0.5">
                {items.map((m) => (
                  <MovementRow
                    key={m.id}
                    movement={m}
                    arsAmount={toArs(m.amount, m.currency, rate)}
                    selected={selectedId === m.id}
                    dense={dense}
                    onSelect={() => setSelectedId(m.id)}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <DetailSheet
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        title="Detalle"
      >
        {selected && (
          <MovementDetail
            movement={selected}
            arsAmount={toArs(selected.amount, selected.currency, rate)}
            canManage={canManageMovement(selected, cloudEnabled, user?.id)}
            onClose={() => setSelectedId(null)}
            onDelete={async () => {
              await deleteMovement(selected.id);
            }}
          />
        )}
      </DetailSheet>
    </section>
  );
}
