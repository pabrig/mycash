"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { SharedSpendHero } from "@/components/SharedSpendHero";
import { useAuth } from "@/context/AuthContext";
import { useFinance } from "@/context/FinanceContext";
import {
  useDisplayAmount,
  useFormatMoney,
  useFormatUsd,
} from "@/hooks/useDisplayAmount";
import { toArs } from "@/lib/currency";
import { sharedMonthHeroCopy } from "@/lib/shared-copy";
import {
  computeSharedPeriodSummary,
  householdSharedMovements,
} from "@/lib/shared-summary";
import { filterByMonth } from "@/lib/summary";
import { DetailSheet } from "@/components/ui/DetailSheet";
import { UserAvatar } from "@/components/UserAvatar";
import { canManageMovement } from "@/lib/movement-access";
import { expenseCategoryLabel } from "@/lib/labels";
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
          <UserAvatar name={name} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold tracking-tight">
              {movement.description}
            </p>
        <p className="meta mt-0.5 text-xs md:hidden">
              {movement.createdByName ? `${movement.createdByName} · ` : ""}
              {movement.householdName
                ? `${movement.householdName}`
                : expenseCategoryLabel(movement.category) || "Compartido"}
            </p>
          </div>
        </div>
        <p className="meta hidden text-xs md:block">
          {formatDayLabel(movement.date)}
        </p>
        <p className="meta hidden truncate text-xs md:block">
          {expenseCategoryLabel(movement.category) || "—"}
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
        {!canManage && (
          <p className="meta mt-2 text-xs">
            Esto lo cargó otra persona. No resta de tu plata.
          </p>
        )}
      </div>
      <dl className="space-y-3 text-sm">
        <div className="flex justify-between gap-4">
            <dt className="text-zinc-400">Qué fue</dt>
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
            <dt className="text-zinc-400">Tipo</dt>
            <dd className="text-right font-medium">
              {expenseCategoryLabel(movement.category)}
            </dd>
          </div>
        )}
        {movement.householdName && (
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-400">Grupo</dt>
            <dd className="text-right font-medium">{movement.householdName}</dd>
          </div>
        )}
        {movement.createdByName && (
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-400">Lo cargó</dt>
            <dd className="text-right font-medium">{movement.createdByName}</dd>
          </div>
        )}
      </dl>
      {!canManage && (
        <p className="text-xs leading-relaxed text-zinc-400">
          Esto lo cargó otra persona. No resta de tu plata.
        </p>
      )}
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
  const { user, household } = useAuth();
  const {
    sharedMovements,
    year,
    month,
    rate,
    rates,
    deleteMovement,
    cloudEnabled,
  } = useFinance();
  const formatArs = useFormatMoney();
  const formatUsd = useFormatUsd();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const monthShared = useMemo(() => {
    const ofGroup = householdSharedMovements(
      sharedMovements,
      household?.id,
      cloudEnabled,
    );
    return filterByMonth(ofGroup, year, month).sort((a, b) =>
      b.date.localeCompare(a.date),
    );
  }, [sharedMovements, year, month, cloudEnabled, household?.id]);

  const categorySummary = useMemo(
    () => computeSharedPeriodSummary(monthShared, rates),
    [monthShared, rates],
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
      <section className="bento animate-slide-up mx-auto max-w-5xl py-12 text-center">
        <p className="text-sm font-semibold text-zinc-400">Todavía no hay gastos del grupo</p>
        <p className="meta mt-1">Cuando alguien pague algo de todos, cargalo acá</p>
        <Link
          href="/compartido/nuevo"
          className="btn-primary mt-6 inline-block px-8 text-sm"
        >
          Cargar gasto del grupo
        </Link>
      </section>
    );
  }

  const groups = groupByDate(monthShared);
  const total = categorySummary.totalArs;
  const monthCopy = sharedMonthHeroCopy(year, month);

  return (
    <section className="animate-slide-up mx-auto grid w-full max-w-5xl gap-4 md:gap-6">
      <SharedSpendHero
        copy={monthCopy}
        totalArs={categorySummary.totalArs}
        totalUsd={categorySummary.totalUsd}
        categories={categorySummary.categories}
        formatArs={formatArs}
        formatUsd={formatUsd}
      >
        {contributions.length > 0 && total > 0 ? (
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
                      title={`${c.name}: ${formatArs(c.amount)}`}
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
                    <UserAvatar name={c.name} size="sm" tone={i} />
                    <span className="truncate font-medium">{c.name}</span>
                  </span>
                      <span className="shrink-0 font-bold tabular-nums">
                        {formatArs(c.amount)}
                        <span className="ml-1.5 text-xs font-medium text-zinc-400">
                          {Math.round((c.amount / total) * 100)}%
                        </span>
                      </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </SharedSpendHero>

      <div>
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          Gastos
        </h2>
        <p className="mt-0.5 text-xs text-zinc-400">
          {monthShared.length === 1
            ? "1 movimiento"
            : `${monthShared.length} movimientos`}
        </p>
      </div>

      <div className="mb-2 hidden grid-cols-[1fr_7rem_6rem_auto] gap-3 px-5 text-[10px] font-semibold tracking-wide text-zinc-400 uppercase md:grid">
        <span>Qué fue</span>
        <span>Fecha</span>
        <span>Tipo</span>
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

      <DetailSheet
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        title="Detalle"
      >
        {selected && (
          <SharedDetail
            movement={selected}
            arsAmount={toArs(selected.amount, selected.currency, rate)}
            canManage={canManageMovement(
              selected,
              cloudEnabled,
              user?.id,
            )}
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
