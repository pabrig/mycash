"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useFinance } from "@/context/FinanceContext";
import { useAuth } from "@/context/AuthContext";
import { currentPeriod, formatMonth, todayIso } from "@/lib/format";
import {
  addDaysIso,
  defaultDateForPeriod,
  expandMonthlyDates,
  installmentLabel,
  MAX_REPEAT_COUNT,
  notesInPeriodLabel,
  seriesPreview,
  type RepeatMode,
} from "@/lib/schedule";
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
  expenseCategoryIcon,
  expenseCategoryLabel,
  incomeSourceLabel,
  normalizeIncomeSource,
} from "@/lib/labels";
import { friendlyError } from "@/lib/errors";

const CURRENCIES: Currency[] = ["ARS", "USD"];

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
  householdId,
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
  householdId?: string;
}): Omit<Movement, "id" | "createdAt" | "createdByUserId" | "createdByName"> {
  const wallet = walletChoice === "auto" ? undefined : walletChoice;
  const sharedHousehold =
    mode === "shared" || scope === "shared" ? householdId : undefined;

  if (mode === "shared" || scope === "shared") {
    if (type === "income") {
      return {
        type: "income",
        date,
        amount,
        currency,
        description,
        scope: "shared",
        incomeKind,
        source,
        ...(wallet ? { wallet } : {}),
        ...(sharedHousehold ? { householdId: sharedHousehold } : {}),
      };
    }
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
      ...(sharedHousehold ? { householdId: sharedHousehold } : {}),
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
  const {
    addMovement,
    addMovements,
    updateMovement,
    walletMode,
    sharedEnabled,
    sharedFunding,
    usdEnabled,
    year,
    month,
    setPeriod,
  } = useFinance();
  const { households, household, configured } = useAuth();
  const isEdit = Boolean(initial);

  const [type, setType] = useState<MovementType>(initial?.type ?? "expense");
  const [date, setDate] = useState(
    initial?.date ?? defaultDateForPeriod(year, month),
  );
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
    mode === "shared" ? "shared" : (initial?.scope ?? "personal"),
  );
  const [kind, setKind] = useState<ExpenseKind>(initial?.kind ?? "variable");
  const [category, setCategory] = useState(
    initial?.category ?? prefill?.category ?? "otros",
  );
  const [incomeKind, setIncomeKind] = useState<IncomeKind>(
    initial?.incomeKind ?? "active",
  );
  const [source, setSource] = useState(
    normalizeIncomeSource(initial?.source ?? "otros"),
  );
  const [walletChoice, setWalletChoice] = useState<WalletChoice>(
    initial?.wallet ?? "auto",
  );
  const [householdId, setHouseholdId] = useState(initial?.householdId ?? "");
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("once");
  const [repeatCount, setRepeatCount] = useState(12);
  const [firstInstallment, setFirstInstallment] = useState(1);
  const [totalInstallments, setTotalInstallments] = useState(12);
  const [showMore, setShowMore] = useState(Boolean(initial));
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const isSharedMode = mode === "shared";
  const selectedHouseholdId = householdId || household?.id || "";
  const selectedGroupFunding =
    households.find((h) => h.id === selectedHouseholdId)?.sharedFunding ??
    sharedFunding;
  const allowSharedIncome =
    selectedGroupFunding === "pool" ||
    (isEdit && initial?.scope === "shared" && initial?.type === "income");
  const isSharedMovement =
    isSharedMode ||
    (type === "expense" && scope === "shared") ||
    (type === "income" && scope === "shared");
  const canRepeat = !isEdit;
  const effectiveRepeat: RepeatMode =
    !canRepeat || (type === "income" && repeatMode === "installments")
      ? "once"
      : repeatMode;
  const seriesCount =
    effectiveRepeat === "once"
      ? 1
      : effectiveRepeat === "installments"
        ? Math.max(1, totalInstallments - firstInstallment + 1)
        : repeatCount;
  const repeating = effectiveRepeat !== "once";
  const preview = repeating
    ? seriesPreview({
        mode: effectiveRepeat,
        startIso: date,
        count: seriesCount,
        firstInstallment,
        totalInstallments,
      })
    : "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount.replace(",", "."));
    if (!parsed || parsed <= 0 || !description.trim()) return;
    if (seriesCount > MAX_REPEAT_COUNT) return;

    const effectiveKind: ExpenseKind = repeating ? "fixed" : kind;
    const dates = repeating ? expandMonthlyDates(date, seriesCount) : [date];

    const payloads = dates.map((entryDate, index) => {
      const label =
        effectiveRepeat === "installments"
          ? installmentLabel(
              description.trim(),
              firstInstallment + index,
              totalInstallments,
            )
          : description.trim();
      return buildPayload({
        mode,
        type,
        date: entryDate,
        amount: parsed,
        currency: usdEnabled ? currency : (initial?.currency ?? "ARS"),
        description: label,
        scope,
        kind: effectiveKind,
        category,
        incomeKind,
        source,
        walletChoice: usdEnabled ? walletChoice : (initial?.wallet ?? "auto"),
        householdId: isSharedMovement ? selectedHouseholdId : undefined,
      });
    });

    setSubmitting(true);
    setFormError("");
    try {
      if (initial) {
        await updateMovement(initial.id, payloads[0]);
      } else if (payloads.length === 1) {
        await addMovement(payloads[0]);
      } else {
        await addMovements(payloads);
      }
      const now = currentPeriod();
      setPeriod(now.year, now.month);
      router.push(redirectTo);
    } catch (err) {
      setFormError(friendlyError(err, "No se pudo guardar."));
    } finally {
      setSubmitting(false);
    }
  }

  const hasMore =
    (type === "expense" && !repeating) ||
    type === "income" ||
    (walletMode === "split" && usdEnabled);

  return (
    <form onSubmit={handleSubmit} className="animate-slide-up space-y-6">
      {(!isSharedMode || allowSharedIncome) && (
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[var(--card-muted)] p-1 dark:bg-[var(--card-muted)]">
          {(["expense", "income"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setType(t);
                if (isSharedMode) setScope("shared");
                else if (t === "income" && !allowSharedIncome) {
                  setScope("personal");
                }
              }}
              className={`rounded-xl py-3 text-sm font-semibold transition-all active:scale-95 ${ type === t ? t === "expense" ? "bg-[var(--card)] text-red-600 shadow-sm dark:bg-[var(--card)]" : "bg-[var(--card)] text-primary shadow-sm dark:bg-[var(--card)]" : "text-[var(--muted-fg)]" }`}
            >
              {t === "expense" ? "↓ Gasto" : "↑ Ingreso"}
            </button>
          ))}
        </div>
      )}

      <div className="card p-5 text-center">
        <label className="text-xs font-medium uppercase tracking-wide text-[var(--muted-fg)]">
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

      {(type === "expense" || (type === "income" && allowSharedIncome)) &&
        !isSharedMode &&
        sharedEnabled && (
          <div className="flex gap-2">
            {(["personal", "shared"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScope(s)}
                className={`flex-1 rounded-xl py-3 text-sm font-medium transition-all active:scale-95 ${ scope === s ? s === "shared" ? "bg-[var(--shared)] text-[var(--cta-fg)]" : "bg-[var(--cta)] text-[var(--cta-fg)]" : "bg-[var(--card-muted)] text-[var(--muted-fg)] dark:bg-[var(--card-muted)]" }`}
              >
                {s === "personal" ? "Mío" : "Compartido"}
              </button>
            ))}
          </div>
        )}

      {isSharedMovement && configured && !isEdit && households.length > 1 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-[var(--muted-fg)]">Grupo</p>
          <div className="flex flex-wrap gap-2">
            {households.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => {
                  setHouseholdId(h.id);
                  const nextFunding = h.sharedFunding ?? sharedFunding;
                  if (type === "income" && nextFunding !== "pool") {
                    setType("expense");
                    if (!isSharedMode) setScope("shared");
                  }
                }}
                className={`chip ${ selectedHouseholdId === h.id ? "chip-active" : "chip-inactive" }`}
              >
                {h.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {isSharedMovement && configured && !isEdit && households.length === 1 && (
        <p className="text-center text-xs text-[var(--muted-fg)]">
          Va a {households[0]?.name ?? "el grupo"}
        </p>
      )}

      {isSharedMovement && configured && households.length === 0 && (
        <p className="text-center text-sm text-[var(--muted-fg)]">
          Primero creá o uníte a un grupo en{" "}
          <Link href="/cuenta" className="font-semibold text-primary">
            Cuenta
          </Link>
        </p>
      )}

      {type === "expense" && (
        <div className="flex flex-wrap gap-2">
          {EXPENSE_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`chip ${category === c ? "chip-active" : "chip-inactive"}`}
            >
              {expenseCategoryIcon(c)} {expenseCategoryLabel(c)}
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
                className={`flex-1 rounded-xl py-3 text-sm font-medium active:scale-95 ${ incomeKind === k ? "chip-active" : "chip-inactive" }`}
              >
                {INCOME_KIND_LABELS[k]}
              </button>
            ))}
          </div>
          <p className="text-center text-xs text-[var(--muted-fg)]">
            {incomeKind === "active"
              ? "Sueldo, freelance, changas"
              : "Alquileres u otra plata que entra sola"}
          </p>
        </div>
      )}

      <DateField date={date} onChange={setDate} year={year} month={month} />

      {canRepeat && (
        <RepeatField
          type={type}
          repeatMode={repeatMode}
          onRepeatMode={setRepeatMode}
          repeatCount={repeatCount}
          onRepeatCount={setRepeatCount}
          firstInstallment={firstInstallment}
          onFirstInstallment={setFirstInstallment}
          totalInstallments={totalInstallments}
          onTotalInstallments={setTotalInstallments}
          preview={preview}
        />
      )}

      {hasMore && (
        <button
          type="button"
          onClick={() => setShowMore(!showMore)}
          className="w-full text-center text-sm text-[var(--muted-fg)]"
        >
          {showMore ? "Menos" : "Más opciones"}
        </button>
      )}

      {hasMore && showMore && (
        <div className="card space-y-4 p-4 animate-fade-in">
          {type === "expense" && !repeating && (
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
              <label className="mb-1 block text-xs text-[var(--muted-fg)]">
                De dónde sale
              </label>
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
              <label className="mb-1 block text-xs text-[var(--muted-fg)]">
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

      {formError && (
        <p className="text-center text-sm text-red-500">{formError}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="btn-primary w-full"
      >
        {submitting
          ? "Guardando…"
          : isEdit
            ? "Guardar cambios"
            : repeating && effectiveRepeat === "installments"
              ? seriesCount === 1
                ? "Cargar 1 cuota"
                : `Cargar ${seriesCount} cuotas`
              : repeating
                ? `Cargar ${seriesCount} meses`
                : "Cargar"}
      </button>

      <Link
        href={redirectTo}
        className="block w-full py-2 text-center text-sm text-[var(--muted-fg)]"
      >
        Cancelar
      </Link>
    </form>
  );
}

function DateField({
  date,
  onChange,
  year,
  month,
}: {
  date: string;
  onChange: (value: string) => void;
  year: number;
  month: number;
}) {
  const today = todayIso();
  const periodStart = defaultDateForPeriod(year, month, today);
  const chips = [
    ...(periodStart !== today && year > 0
      ? [{ label: formatMonth(year, month), value: periodStart }]
      : []),
    { label: "Ayer", value: addDaysIso(today, -1) },
    { label: "Hoy", value: today },
    { label: "Mañana", value: addDaysIso(today, 1) },
  ];

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium uppercase tracking-wide text-[var(--muted-fg)]">
        Fecha
      </label>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <button
            key={chip.label}
            type="button"
            onClick={() => onChange(chip.value)}
            className={`chip ${date === chip.value ? "chip-active" : "chip-inactive"}`}
          >
            {chip.label}
          </button>
        ))}
      </div>
      <input
        type="date"
        required
        value={date}
        onChange={(e) => onChange(e.target.value)}
        className="input-field"
      />
      <p className="text-xs text-[var(--muted-fg)]">
        {notesInPeriodLabel(date)}
      </p>
    </div>
  );
}

function RepeatField({
  type,
  repeatMode,
  onRepeatMode,
  repeatCount,
  onRepeatCount,
  firstInstallment,
  onFirstInstallment,
  totalInstallments,
  onTotalInstallments,
  preview,
}: {
  type: MovementType;
  repeatMode: RepeatMode;
  onRepeatMode: (mode: RepeatMode) => void;
  repeatCount: number;
  onRepeatCount: (count: number) => void;
  firstInstallment: number;
  onFirstInstallment: (n: number) => void;
  totalInstallments: number;
  onTotalInstallments: (n: number) => void;
  preview: string;
}) {
  const modes: { id: RepeatMode; label: string }[] =
    type === "income"
      ? [
          { id: "once", label: "Una vez" },
          { id: "monthly", label: "Todos los meses" },
        ]
      : [
          { id: "once", label: "Una vez" },
          { id: "monthly", label: "Todos los meses" },
          { id: "installments", label: "En cuotas" },
        ];

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--muted-fg)]">
          ¿Se repite?
        </p>
        <div className="flex flex-wrap gap-2">
          {modes.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => onRepeatMode(id)}
              className={`chip ${repeatMode === id ? "chip-active" : "chip-inactive"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs leading-relaxed text-[var(--muted-fg)]">
          {repeatMode === "monthly"
            ? type === "income"
              ? "Sueldo u otra entrada que llega todos los meses."
              : "Luz, internet, impuestos, alquiler. Se carga un gasto por mes."
            : repeatMode === "installments"
              ? "Tarjeta o crédito. Se carga cada cuota en su mes, con 3/12, 4/12…"
              : "Solo esta fecha. Puede ser pasado o futuro."}
        </p>
      </div>

      {repeatMode === "monthly" && (
        <div>
          <p className="mb-2 text-xs text-[var(--muted-fg)]">¿Cuántos meses?</p>
          <div className="flex flex-wrap gap-2">
            {[3, 6, 12, 24].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onRepeatCount(n)}
                className={`chip ${repeatCount === n ? "chip-active" : "chip-inactive"}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {repeatMode === "installments" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-[var(--muted-fg)]">
              Cuotas en total
            </label>
            <input
              type="number"
              min={2}
              max={MAX_REPEAT_COUNT}
              value={totalInstallments}
              onChange={(e) => {
                const next = Math.min(
                  MAX_REPEAT_COUNT,
                  Math.max(2, Number(e.target.value) || 2),
                );
                onTotalInstallments(next);
                if (firstInstallment > next) onFirstInstallment(1);
              }}
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--muted-fg)]">
              Esta es la n°
            </label>
            <input
              type="number"
              min={1}
              max={totalInstallments}
              value={firstInstallment}
              onChange={(e) =>
                onFirstInstallment(
                  Math.min(
                    totalInstallments,
                    Math.max(1, Number(e.target.value) || 1),
                  ),
                )
              }
              className="input-field"
            />
          </div>
        </div>
      )}

      {preview && (
        <p className="text-xs font-medium leading-relaxed text-[var(--muted-fg)]">
          {preview}
        </p>
      )}
    </div>
  );
}
