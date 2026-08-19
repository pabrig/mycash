"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFinance } from "@/context/FinanceContext";
import { useDisplayAmount } from "@/hooks/useDisplayAmount";
import { toArs } from "@/lib/currency";
import { filterByMonth } from "@/lib/summary";
import { DetailSheet } from "@/components/ui/DetailSheet";
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

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const AVATAR_TONES = [
  "bg-teal-500/15 text-teal-700 dark:text-teal-300",
  "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900",
  "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  "bg-amber-500/15 text-amber-800 dark:text-amber-300",
];

function SharedRow({
  movement,
  arsAmount,
  selected,
  onSelect,
}: {
  movement: Movement;
  arsAmount: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const fmt = useDisplayAmount();
  const name = movement.createdByName ?? "?";

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition md:grid md:grid-cols-[minmax(0,1fr)_7rem_6rem_auto] md:items-center ${
          selected ? "bg-[var(--card-muted)]" : "active:bg-[var(--card-muted)]"
        }`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-bold ${AVATAR_TONES[0]}`}
            title={name}
          >
            {initials(name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold tracking-tight">
              {movement.description}
            </p>
            <p className="meta mt-0.5 text-xs md:hidden">
              {movement.createdByName ? `${movement.createdByName} · ` : ""}
              {movement.category ?? "compartido"}
            </p>
          </div>
        </div>
        <p className="meta hidden text-xs md:block">
          {formatDayLabel(movement.date)}
        </p>
        <p className="meta hidden truncate text-xs capitalize md:block">
          {movement.category ?? "—"}
        </p>
        <p className="shrink-0 text-right font-bold tabular-nums tracking-tight">
          −{fmt(arsAmount)}
        </p>
      </button>
    </li>
  );
}

function SharedDetail({
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
        <p className="text-sm font-medium text-zinc-400">Gasto compartido</p>
        <p className="mt-2 text-4xl font-extrabold tracking-tighter tabular-nums">
          −{fmt(arsAmount)}
        </p>
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
        {movement.category && (
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-400">Categoría</dt>
            <dd className="text-right font-medium capitalize">
              {movement.category}
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

export function SharedMovementList() {
  const { user, members } = useAuth();
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

  const contributions = useMemo(() => {
    const map = new Map<string, { name: string; amount: number }>();
    for (const m of monthShared) {
      const key = m.createdByUserId ?? m.createdByName ?? "unknown";
      const name = m.createdByName ?? "Alguien";
      const prev = map.get(key) ?? { name, amount: 0 };
      prev.amount += toArs(m.amount, m.currency, rate);
      map.set(key, prev);
    }
    return [...map.values()].sort((a, b) => b.amount - a.amount);
  }, [monthShared, rate]);

  const selected = monthShared.find((m) => m.id === selectedId) ?? null;

  if (monthShared.length === 0) {
    return (
      <section className="bento animate-slide-up py-12 text-center">
        <p className="text-sm font-semibold text-zinc-400">Sin gastos compartidos</p>
        <p className="meta mt-1">Tocá + para cargar un gasto del hogar</p>
        <Link
          href="/compartido/nuevo"
          className="btn-primary mt-6 inline-block px-8 text-sm"
        >
          Cargar gasto compartido
        </Link>
      </section>
    );
  }

  const groups = groupByDate(monthShared);
  const displayMembers =
    members.length > 0
      ? members
      : contributions.map((c, i) => ({
          userId: String(i),
          displayName: c.name,
          role: "member" as const,
        }));

  return (
    <section className="animate-slide-up space-y-4">
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="bento space-y-5 lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-zinc-400">Total del mes</p>
              <p className="mt-1 text-3xl font-extrabold tracking-tighter tabular-nums">
                {fmt(total)}
              </p>
              <p className="meta mt-1 text-xs">
                Cada uno ve el monto completo en su disponible
              </p>
            </div>
            <div className="flex -space-x-2">
              {displayMembers.slice(0, 4).map((m, i) => (
                <div
                  key={m.userId}
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold ring-2 ring-[var(--card)] ${AVATAR_TONES[i % AVATAR_TONES.length]}`}
                  title={m.displayName}
                >
                  {initials(m.displayName)}
                </div>
              ))}
            </div>
          </div>

          {contributions.length > 0 && total > 0 && (
            <div className="space-y-3">
              <p className="text-[11px] font-semibold tracking-wide text-zinc-400 uppercase">
                Quién cargó
              </p>
              <div className="flex h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                {contributions.map((c, i) => (
                  <div
                    key={c.name + i}
                    className={
                      i % 2 === 0
                        ? "bg-teal-500 transition-all duration-700"
                        : "bg-zinc-400 transition-all duration-700 dark:bg-zinc-500"
                    }
                    style={{ width: `${(c.amount / total) * 100}%` }}
                    title={`${c.name}: ${fmt(c.amount)}`}
                  />
                ))}
              </div>
              <ul className="space-y-2">
                {contributions.map((c, i) => (
                  <li
                    key={c.name + i}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${AVATAR_TONES[i % AVATAR_TONES.length]}`}
                      >
                        {initials(c.name)}
                      </span>
                      <span className="truncate font-medium">{c.name}</span>
                    </span>
                    <span className="shrink-0 font-bold tabular-nums">
                      {fmt(c.amount)}
                      <span className="ml-1.5 text-xs font-medium text-zinc-400">
                        {Math.round((c.amount / total) * 100)}%
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-3 lg:col-span-3">
          <div className="mb-1 flex items-end justify-between">
            <h2 className="text-lg font-bold tracking-tight">Gastos</h2>
            <span className="text-xs font-medium text-zinc-400">
              {monthShared.length}
            </span>
          </div>

          <div className="mb-2 hidden grid-cols-[1fr_7rem_6rem_auto] gap-3 px-5 text-[10px] font-semibold tracking-wide text-zinc-400 uppercase md:grid">
            <span>Descripción</span>
            <span>Fecha</span>
            <span>Categoría</span>
            <span className="text-right">Monto</span>
          </div>

          <div className="bento space-y-5 !px-2 !py-3">
            {[...groups.entries()].map(([date, items]) => (
              <div key={date}>
                <p className="px-3 pb-1 text-[11px] font-semibold tracking-wide text-zinc-400 uppercase md:hidden">
                  {formatDayLabel(date)}
                </p>
                <ul className="space-y-0.5">
                  {items.map((m) => (
                    <SharedRow
                      key={m.id}
                      movement={m}
                      arsAmount={toArs(m.amount, m.currency, rate)}
                      selected={selectedId === m.id}
                      onSelect={() => setSelectedId(m.id)}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <DetailSheet
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        title="Detalle"
      >
        {selected && (
          <SharedDetail
            movement={selected}
            arsAmount={toArs(selected.amount, selected.currency, rate)}
            canManage={
              !cloudEnabled ||
              !selected.createdByUserId ||
              selected.createdByUserId === user?.id
            }
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
