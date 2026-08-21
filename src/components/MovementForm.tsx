"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useFinance } from "@/context/FinanceContext";
import { todayIso } from "@/lib/format";
import {
  EXPENSE_CATEGORIES,
  INCOME_SOURCES,
  type Currency,
  type ExpenseKind,
  type ExpenseScope,
  type IncomeKind,
  type Movement,
  type MovementType,
  type Wallet,
} from "@/lib/types";
import {
  EXPENSE_KIND_LABELS,
  INCOME_KIND_LABELS,
  expenseCategoryLabel,
  incomeSourceLabel,
} from "@/lib/labels";

const CURRENCIES: Currency[] = ["ARS", "USD"];

const CATEGORY_ICONS: Record<string, string> = {
  alimentacion: "🛒",
  transporte: "⛽",
  salidas: "🍽️",
  servicios: "💡",
  salud: "🏥",
  streaming: "📺",
  seguros: "🛡️",
  alquiler: "🏠",
  extras: "📦",
  otros: "•••",
};

type WalletChoice = "auto" | Wallet;

function buildPayload({
  mode,
  type,
  date,
  amount,
  currency,
  description,
  scope,
  kind,
  category,
  incomeKind,
  source,
  walletChoice,
}: {
  mode: "full" | "shared";
  type: MovementType;
  date: string;
  amount: number;
  currency: Currency;
  description: string;
  scope: ExpenseScope;
  kind: ExpenseKind;
  category: string;
  incomeKind: IncomeKind;
  source: string;
  walletChoice: WalletChoice;
}): Omit<Movement, "id" | "createdAt" | "createdByUserId" | "createdByName"> {
  const wallet =
    walletChoice === "auto" ? undefined : walletChoice;

  if (mode === "shared" || (type === "expense" && scope === "shared")) {
    return {
      type: "expense",
      date,
      amount,
      currency,
      description,
      scope: "shared",
      kind,
      category,
      ...(wallet ? { wallet } : {}),
    };
  }

  if (type === "expense") {
    return {
      type: "expense",
      date,
      amount,
      currency,
      description,
      scope,
      kind,
      category,
      ...(wallet ? { wallet } : {}),
    };
  }

  return {
    type: "income",
    date,
    amount,
    currency,
    description,
    incomeKind,
    source,
    ...(wallet ? { wallet } : {}),
  };
}

export function MovementForm({
  mode = "full",
  redirectTo = "/",
  initial,
  prefill,
}: {
  mode?: "full" | "shared";
  redirectTo?: string;
  /** Si viene, el form edita en lugar de crear */
  initial?: Movement;
  /** Prefill de alta (p.ej. parte de una cuenta dividida) */
  prefill?: {
    amount?: string;
    description?: string;
    category?: string;
  };
}) {
  const router = useRouter();
  const { addMovement, updateMovement, walletMode, sharedEnabled, usdEnabled } =
    useFinance();
  const isEdit = Boolean(initial);

  const [type, setType] = useState<MovementType>(
    initial?.type ?? "expense",
  );
  const [date, setDate] = useState(initial?.date ?? todayIso());
  const [amount, setAmount] = useState(
    initial ? String(initial.amount) : (prefill?.amount ?? ""),
  );
  const [currency, setCurrency] = useState<Currency>(
    initial?.currency ?? "ARS",
  );
  const [description, setDescription] = useState(
    initial?.description ?? prefill?.description ?? "",
  );
  const [scope, setScope] = useState<ExpenseScope>(
    mode === "shared"
      ? "shared"
      : (initial?.scope ?? "personal"),
  );
  const [kind, setKind] = useState<ExpenseKind>(
    initial?.kind ?? "variable",
  );
  const [category, setCategory] = useState(
    initial?.category ?? prefill?.category ?? "otros",
  );
  const [incomeKind, setIncomeKind] = useState<IncomeKind>(
    initial?.incomeKind ?? "active",
  );
  const [source, setSource] = useState(initial?.source ?? "otros");
  const [walletChoice, setWalletChoice] = useState<WalletChoice>(
    initial?.wallet ?? "auto",
  );
  const [showMore, setShowMore] = useState(Boolean(initial));
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount.replace(",", "."));
    if (!parsed || parsed <= 0 || !description.trim()) return;

    const payload = buildPayload({
      mode,
      type,
      date,
      amount: parsed,
      currency: usdEnabled ? currency : (initial?.currency ?? "ARS"),
      description: description.trim(),
      scope,
      kind,
      category,
      incomeKind,
      source,
      walletChoice: usdEnabled ? walletChoice : (initial?.wallet ?? "auto"),
    });

    setSubmitting(true);
    try {
      if (initial) {
        await updateMovement(initial.id, payload);
      } else {
        await addMovement(payload);
      }
      router.push(redirectTo);
    } finally {
      setSubmitting(false);
    }
  }

  const isSharedMode = mode === "shared";

  return (
    <form onSubmit={handleSubmit} className="animate-slide-up space-y-6">
      {!isSharedMode && (
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-zinc-100 p-1 dark:bg-zinc-800">
          {(["expense", "income"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`rounded-xl py-3 text-sm font-semibold transition-all active:scale-95 ${
                type === t
                  ? t === "expense"
                    ? "bg-white text-red-600 shadow-sm dark:bg-zinc-900"
                    : "bg-white text-teal-600 shadow-sm dark:bg-zinc-900"
                  : "text-zinc-500"
              }`}
            >
              {t === "expense" ? "↓ Gasto" : "↑ Ingreso"}
            </button>
          ))}
        </div>
      )}

      <div className="card p-5 text-center">
        <label className="text-xs font-medium uppercase tracking-wide text-zinc-400">
          Monto
        </label>
        <div className="mt-2 flex items-center justify-center gap-2">
          <input
            type="text"
            inputMode="decimal"
            required
            autoFocus={!isEdit}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="w-full max-w-[200px] border-none bg-transparent text-center text-4xl font-bold tabular-nums outline-none"
          />
        </div>
        {usdEnabled && (
          <div className="mt-4 flex justify-center gap-2">
            {CURRENCIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                className={`chip ${currency === c ? "chip-active" : "chip-inactive"}`}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <input
          type="text"
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input-field text-lg"
          placeholder="¿Qué fue? Ej: súper, sueldo, luz…"
        />
      </div>

      {type === "expense" && !isSharedMode && sharedEnabled && (
        <div className="flex gap-2">
          {(["personal", "shared"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScope(s)}
              className={`flex-1 rounded-xl py-3 text-sm font-medium transition-all active:scale-95 ${
                scope === s
                  ? s === "shared"
                    ? "bg-indigo-600 text-white"
                    : "bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800"
              }`}
            >
              {s === "personal" ? "Mío" : "Con otros"}
            </button>
          ))}
        </div>
      )}

      {(type === "expense" || isSharedMode) && (
        <div className="flex flex-wrap gap-2">
          {EXPENSE_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`chip ${category === c ? "chip-active" : "chip-inactive"}`}
            >
              {CATEGORY_ICONS[c]} {expenseCategoryLabel(c)}
            </button>
          ))}
        </div>
      )}

      {type === "income" && (
        <div className="space-y-2">
          <div className="flex gap-2">
            {(["active", "passive"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setIncomeKind(k)}
                className={`flex-1 rounded-xl py-3 text-sm font-medium active:scale-95 ${
                  incomeKind === k ? "chip-active" : "chip-inactive"
                }`}
              >
                {INCOME_KIND_LABELS[k]}
              </button>
            ))}
          </div>
          <p className="text-center text-xs text-zinc-400">
            {incomeKind === "active"
              ? "Sueldo, freelance, changas"
              : "Alquileres u otra plata que entra sola"}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowMore(!showMore)}
        className="w-full text-center text-sm text-zinc-500"
      >
        {showMore ? "Menos" : "Fecha y más"}
      </button>

      {showMore && (
        <div className="card space-y-4 p-4 animate-fade-in">
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Fecha</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input-field"
            />
          </div>

          {(type === "expense" || isSharedMode) && (
            <div className="flex gap-2">
              {(["fixed", "variable"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={`flex-1 rounded-xl py-2.5 text-sm ${kind === k ? "chip-active" : "chip-inactive"}`}
                >
                  {EXPENSE_KIND_LABELS[k]}
                </button>
              ))}
            </div>
          )}

          {type === "income" && (
            <div>
              <label className="mb-1 block text-xs text-zinc-500">De dónde sale</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="input-field"
              >
                {INCOME_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {incomeSourceLabel(s)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {walletMode === "split" && usdEnabled && (
            <div>
              <label className="mb-1 block text-xs text-zinc-500">
                ¿A qué bolsillo va?
              </label>
              <div className="flex gap-2">
                {(
                  [
                    { id: "auto" as const, label: "Según moneda" },
                    { id: "vida" as const, label: "Diario" },
                    { id: "ahorro" as const, label: "Ahorro USD" },
                  ] as const
                ).map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setWalletChoice(id)}
                    className={`flex-1 rounded-xl py-2.5 text-xs font-medium ${walletChoice === id ? "chip-active" : "chip-inactive"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <button type="submit" disabled={submitting} className="btn-primary w-full">
        {submitting
          ? "Guardando…"
            : isEdit
            ? "Guardar cambios"
            : "Cargar"}
      </button>

      <Link
        href={redirectTo}
        className="block w-full py-2 text-center text-sm text-zinc-500"
      >
        Cancelar
      </Link>
    </form>
  );
}
