"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatMoney, todayIso } from "@/lib/format";
import { useFormatMoney } from "@/hooks/useDisplayAmount";
import {
  eventMyShare,
  formatEventDates,
  formatEventSplitSummary,
  formatIsoDay,
  groupExpensesByDate,
  personName,
  settleEvent,
  splitSharePath,
  type SplitEvent,
} from "@/lib/split-bill";
import { IconClose, IconPlus } from "@/components/ui/Icons";
import { DetailSheet } from "@/components/ui/DetailSheet";

function parsePaid(raw: string): number {
  const n = parseFloat(raw.replace(",", ".").replace(/\s/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function SplitEventDetail({
  event,
  onAddExpense,
  onRemoveExpense,
  onDelete,
}: {
  event: SplitEvent;
  onAddExpense: (input: {
    date: string;
    description: string;
    amount: number;
    paidById: string;
  }) => void;
  onRemoveExpense: (expenseId: string) => void;
  onDelete: () => void;
}) {
  const formatArs = useFormatMoney();
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const result = useMemo(() => settleEvent(event), [event]);
  const dates = formatEventDates(event);
  const groups = useMemo(
    () => groupExpensesByDate(event.expenses),
    [event.expenses],
  );
  const canSettle = result.total > 0 && result.count >= 2;
  const me = event.people.find((p) => p.isMe);
  const myShare = eventMyShare(event, result);
  const shareHref = splitSharePath(event.title, myShare);
  const today = todayIso();

  async function copySummary() {
    const text = formatEventSplitSummary(event, result, formatMoney);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function handleDelete() {
    setConfirmingDelete(false);
    onDelete();
    router.replace("/dividir");
  }

  return (
    <div className="space-y-5">
      <div>
        {dates && <p className="text-sm text-zinc-400">{dates}</p>}
        <p className="mt-1 text-sm leading-relaxed text-zinc-500">
          {event.people.length}{" "}
          {event.people.length === 1 ? "persona" : "personas"}. Cada gasto se
          parte entre todos.
        </p>
      </div>

      <section className="bento space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-zinc-400">Total</p>
            <p className="mt-1 text-3xl font-extrabold tracking-tighter tabular-nums">
              {formatArs(result.total)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-zinc-400">Cada uno</p>
            <p className="mt-1 text-xl font-bold tabular-nums">
              {formatArs(result.share)}
            </p>
          </div>
        </div>

        {!canSettle ? (
          <p className="text-sm text-zinc-400">
            Cargá el primer gasto para ver quién le debe a quién.
          </p>
        ) : result.transfers.length === 0 ? (
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
            Quedaron a mano. Nadie se debe nada.
          </p>
        ) : (
          <ul className="space-y-2">
            {result.transfers.map((t) => (
              <li
                key={`${t.fromId}-${t.toId}`}
                className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--card-muted)] px-3.5 py-3 text-sm"
              >
                <span className="min-w-0 font-medium">
                  <span className="truncate">{t.fromName}</span>
                  <span className="mx-1.5 text-zinc-400">→</span>
                  <span className="truncate">{t.toName}</span>
                </span>
                <span className="shrink-0 font-bold tabular-nums">
                  {formatArs(t.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}

        {canSettle && (
          <div className="flex flex-col gap-2">
            <Link
              href={shareHref}
              className="btn-primary block w-full text-center text-sm"
            >
              Cargar mi parte · {formatArs(myShare)}
            </Link>
            <button
              type="button"
              onClick={() => void copySummary()}
              className="w-full rounded-2xl py-3 text-sm font-semibold text-zinc-600 dark:text-zinc-300"
            >
              {copied ? "Copiado" : "Copiar para WhatsApp"}
            </button>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">
            Gastos
          </p>
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 text-sm font-semibold"
          >
            <IconPlus className="h-4 w-4" />
            Agregar
          </button>
        </div>

        {groups.length === 0 ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="bento w-full space-y-2 py-8 text-center"
          >
            <p className="text-sm font-semibold">Todavía no hay gastos</p>
            <p className="text-sm leading-relaxed text-zinc-500">
              Cuando alguien pague algo, cargalo acá.
            </p>
          </button>
        ) : (
          <div className="space-y-5">
            {groups.map((group) => (
              <div key={group.date} className="space-y-2">
                <p className="px-1 text-[11px] font-semibold tracking-wide text-zinc-400 uppercase">
                  {group.date === today ? "Hoy" : formatIsoDay(group.date)}
                </p>
                <ul className="space-y-2">
                  {group.items.map((expense) => (
                    <li
                      key={expense.id}
                      className="flex items-center gap-3 rounded-2xl bg-[var(--card)] px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {expense.description.trim() || "Gasto"}
                        </p>
                        <p className="truncate text-xs text-zinc-400">
                          Pagó {personName(event, expense.paidById)}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-bold tabular-nums">
                        {formatArs(expense.amount)}
                      </p>
                      <button
                        type="button"
                        onClick={() => onRemoveExpense(expense.id)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-400"
                        aria-label="Quitar gasto"
                      >
                        <IconClose className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <button
        type="button"
        onClick={() => setConfirmingDelete(true)}
        className="w-full py-2 text-center text-sm text-zinc-400"
      >
        Borrar este evento
      </button>

      <DetailSheet
        open={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        title="Borrar evento"
      >
        <div className="space-y-5 pb-2">
          <p className="text-sm leading-relaxed text-zinc-500">
            Se borra {event.title} y todos los gastos. No se puede deshacer.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className="flex-1 rounded-2xl bg-[var(--card-muted)] py-3.5 text-sm font-semibold"
            >
              Mejor no
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="flex-1 rounded-2xl bg-rose-600 py-3.5 text-sm font-semibold text-white transition active:scale-[0.99]"
            >
              Borrar
            </button>
          </div>
        </div>
      </DetailSheet>

      <AddExpenseSheet
        open={adding}
        onClose={() => setAdding(false)}
        event={event}
        defaultPaidById={me?.id ?? event.people[0]?.id ?? ""}
        onSave={(input) => {
          onAddExpense(input);
          setAdding(false);
        }}
      />
    </div>
  );
}

function AddExpenseSheet({
  open,
  onClose,
  event,
  defaultPaidById,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  event: SplitEvent;
  defaultPaidById: string;
  onSave: (input: {
    date: string;
    description: string;
    amount: number;
    paidById: string;
  }) => void;
}) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidById, setPaidById] = useState(defaultPaidById);
  const [date, setDate] = useState(todayIso());

  useEffect(() => {
    if (!open) return;
    setDescription("");
    setAmount("");
    setPaidById(defaultPaidById);
    setDate(todayIso());
  }, [open, defaultPaidById]);

  const paid = parsePaid(amount);
  const canSave = paid > 0;

  function reset() {
    setDescription("");
    setAmount("");
    setPaidById(defaultPaidById);
    setDate(todayIso());
  }

  return (
    <DetailSheet
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Agregar gasto"
    >
      <form
        className="space-y-4 pb-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!canSave) return;
          onSave({
            date: date || todayIso(),
            description,
            amount: paid,
            paidById: paidById || defaultPaidById,
          });
          reset();
        }}
      >
        <p className="text-sm leading-relaxed text-zinc-500">
          ¿Qué se pagó, cuánto y quién puso la plata?
        </p>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input-field"
          placeholder="Nafta, cena, alojamiento…"
        />
        <input
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="input-field text-right font-semibold tabular-nums"
          placeholder="0"
        />
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-zinc-500">Pagó</span>
          <select
            value={paidById}
            onChange={(e) => setPaidById(e.target.value)}
            className="input-field"
          >
            {event.people.map((person, i) => (
              <option key={person.id} value={person.id}>
                {person.name.trim() || (person.isMe ? "Yo" : `Persona ${i + 1}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-zinc-500">Cuándo</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input-field"
          />
        </label>
        <button type="submit" disabled={!canSave} className="btn-primary w-full text-sm">
          Sumar al evento
        </button>
      </form>
    </DetailSheet>
  );
}
