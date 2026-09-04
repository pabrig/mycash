"use client";

import { useState, type ReactNode } from "react";
import { useFinance } from "@/context/FinanceContext";
import { goalFormCopy, goalPlaceLabel } from "@/lib/goals-copy";
import {
  defaultGoalPlace,
  effectiveMonthlyPlan,
  goalCanReserveDisponible,
  goalPlaceOptions,
  normalizeGoalPlace,
  suggestedCurrencyForPlace,
  suggestedMonthlyPlan,
  type GoalPlace,
  type SavingsGoal,
} from "@/lib/goals";
import type { Currency } from "@/lib/types";
import { formatMoney, formatUsd } from "@/lib/format";
import { IconChevronDown } from "@/components/ui/Icons";

function parseAmount(raw: string): number | null {
  const parsed = parseFloat(raw.replace(",", ".").replace(/\s/g, ""));
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

export function GoalEditor({
  goal,
  mode = goal ? "edit" : "create",
  onDone,
  onCancel,
  onEditRequest,
}: {
  goal?: SavingsGoal;
  mode?: "create" | "edit" | "contribute";
  onDone: () => void;
  onCancel: () => void;
  /** Desde el sheet de aportar → abrir editar. */
  onEditRequest?: () => void;
}) {
  if (mode === "contribute" && goal) {
    return (
      <ContributeForm
        goal={goal}
        onDone={onDone}
        onCancel={onCancel}
        onEditRequest={onEditRequest}
      />
    );
  }

  return (
    <GoalConfigForm
      goal={goal}
      onDone={onDone}
      onCancel={onCancel}
    />
  );
}

function ContributeForm({
  goal,
  onDone,
  onCancel,
  onEditRequest,
}: {
  goal: SavingsGoal;
  onDone: () => void;
  onCancel: () => void;
  onEditRequest?: () => void;
}) {
  const { contributeToGoal, walletMode } = useFinance();
  const copy = goalFormCopy(true);
  const place = normalizeGoalPlace(goal.place, walletMode);
  const planAmount = effectiveMonthlyPlan(goal);

  const [contribute, setContribute] = useState(
    planAmount > 0 ? String(planAmount) : "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const moneyLabel =
    goal.currency === "USD"
      ? (n: number) => formatUsd(n)
      : (n: number) => formatMoney(n);

  async function handleContribute() {
    setError(null);
    const amount = parseAmount(contribute);
    if (amount === null || amount <= 0) {
      setError("Poné cuánto acabás de apartar.");
      return;
    }
    setSaving(true);
    try {
      await contributeToGoal(goal.id, amount);
      onDone();
    } catch {
      setError("No se pudo apartar. Probá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 pb-4">
      <div className="space-y-1">
        <p className="text-sm text-zinc-500">
          {moneyLabel(goal.savedAmount)} de {moneyLabel(goal.targetAmount)}
          <span className="mx-1.5 text-zinc-300 dark:text-zinc-600">·</span>
          {goalPlaceLabel(place)}
        </p>
        <p className="text-xs leading-relaxed text-zinc-400">
          {place === "ahorro" ? copy.contributeHintAhorro : copy.contributeHint}
        </p>
      </div>

      <Field label={copy.contribute}>
        <input
          inputMode="decimal"
          value={contribute}
          onChange={(e) => setContribute(e.target.value)}
          placeholder="0"
          className="input-field"
          autoFocus
          aria-label={copy.contribute}
        />
      </Field>

      {planAmount > 0 ? (
        <button
          type="button"
          onClick={() => setContribute(String(planAmount))}
          className="text-sm font-semibold text-teal-700 dark:text-teal-400"
        >
          {copy.contributeUsePlan} ({moneyLabel(planAmount)})
        </button>
      ) : null}

      {error ? (
        <p className="text-sm text-rose-500" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleContribute()}
          className="btn-primary w-full"
        >
          {copy.contributeAction}
        </button>
        {onEditRequest ? (
          <button
            type="button"
            disabled={saving}
            onClick={onEditRequest}
            className="w-full py-3 text-sm font-semibold text-zinc-600 dark:text-zinc-300"
          >
            {copy.editMeta}
          </button>
        ) : null}
        <button
          type="button"
          disabled={saving}
          onClick={onCancel}
          className="w-full py-3 text-sm font-semibold text-zinc-500"
        >
          {copy.cancel}
        </button>
      </div>
    </div>
  );
}

function GoalConfigForm({
  goal,
  onDone,
  onCancel,
}: {
  goal?: SavingsGoal;
  onDone: () => void;
  onCancel: () => void;
}) {
  const {
    usdEnabled,
    walletMode,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
  } = useFinance();
  const isEdit = Boolean(goal);
  const copy = goalFormCopy(isEdit);
  const placeChoices = goalPlaceOptions(walletMode);
  const showPlacePicker = walletMode === "split";

  const [name, setName] = useState(goal?.name ?? "");
  const [target, setTarget] = useState(
    goal ? String(goal.targetAmount) : "",
  );
  const [saved, setSaved] = useState(
    goal && goal.savedAmount > 0 ? String(goal.savedAmount) : "",
  );
  const initialPlace = goal
    ? normalizeGoalPlace(goal.place, walletMode)
    : defaultGoalPlace(walletMode);
  const [place, setPlace] = useState<GoalPlace>(initialPlace);
  const [currency, setCurrency] = useState<Currency>(
    goal?.currency ??
      suggestedCurrencyForPlace(initialPlace, usdEnabled, "ARS"),
  );
  const [targetDate, setTargetDate] = useState(goal?.targetDate ?? "");
  const [monthlyPlan, setMonthlyPlan] = useState(
    goal?.monthlyPlan != null ? String(goal.monthlyPlan) : "",
  );
  const canReserve = goalCanReserveDisponible(place);
  const [deductFromDisponible, setDeductFromDisponible] = useState(
    canReserve ? goal?.deductFromDisponible !== false : false,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(
    Boolean(
      goal &&
        (goal.targetDate ||
          (goal.monthlyPlan != null && goal.monthlyPlan > 0) ||
          goal.savedAmount > 0),
    ),
  );

  const suggested =
    targetDate && parseAmount(target) != null
      ? suggestedMonthlyPlan({
          targetAmount: parseAmount(target) ?? 0,
          savedAmount: parseAmount(saved) ?? goal?.savedAmount ?? 0,
          targetDate,
        })
      : null;

  const suggestedLabel =
    suggested != null && suggested > 0
      ? `${copy.suggestedPrefix} ${
          currency === "USD" ? formatUsd(suggested) : formatMoney(suggested)
        } / mes`
      : null;

  function selectPlace(next: GoalPlace) {
    setPlace(next);
    setCurrency(suggestedCurrencyForPlace(next, usdEnabled, currency));
    if (!goalCanReserveDisponible(next)) {
      setDeductFromDisponible(false);
    } else if (!canReserve) {
      setDeductFromDisponible(true);
    }
  }

  async function handleSave() {
    setError(null);
    const targetAmount = parseAmount(target);
    if (targetAmount === null || targetAmount <= 0) {
      setError("Poné el monto total que querés juntar.");
      return;
    }
    if (!name.trim()) {
      setError("Poné para qué es la meta.");
      return;
    }

    const planRaw = monthlyPlan.trim();
    const plan = planRaw === "" ? null : parseAmount(planRaw);

    if (planRaw !== "" && plan === null) {
      setError("Revisá el plan del mes.");
      return;
    }

    const resolvedPlace = showPlacePicker
      ? place
      : defaultGoalPlace(walletMode);
    const deduct = goalCanReserveDisponible(resolvedPlace)
      ? deductFromDisponible
      : false;

    setSaving(true);
    try {
      if (goal) {
        await updateSavingsGoal(goal.id, {
          name,
          targetAmount,
          currency,
          savedAmount: parseAmount(saved) ?? goal.savedAmount,
          monthlyPlan: plan,
          deductFromDisponible: deduct,
          place: resolvedPlace,
          targetDate: targetDate || null,
        });
      } else {
        await addSavingsGoal({
          name,
          targetAmount,
          currency,
          savedAmount: parseAmount(saved) ?? 0,
          monthlyPlan: plan,
          deductFromDisponible: deduct,
          place: resolvedPlace,
          targetDate: targetDate || null,
        });
      }
      onDone();
    } catch {
      setError("No se pudo guardar. Probá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!goal) return;
    if (!window.confirm(copy.deleteConfirm)) return;
    setSaving(true);
    try {
      await deleteSavingsGoal(goal.id);
      onDone();
    } catch {
      setError("No se pudo borrar. Probá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 pb-4">
      <div className="space-y-4">
        <Field label={copy.nameLabel}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={copy.namePlaceholder}
            className="input-field"
            autoComplete="off"
            autoFocus={!isEdit}
          />
        </Field>

        <Field label={copy.targetLabel}>
          <div className="flex items-stretch gap-2">
            <input
              inputMode="decimal"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="0"
              className="input-field min-w-0 flex-1 !w-auto"
            />
            {usdEnabled ? (
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="w-[4.75rem] shrink-0 rounded-2xl bg-[var(--card-muted)] px-2 py-3.5 text-center text-sm font-semibold outline-none transition focus:ring-2 focus:ring-teal-500/30 dark:bg-zinc-900"
                aria-label="Moneda"
              >
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
            ) : null}
          </div>
        </Field>

        {showPlacePicker ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
              {copy.placeLabel}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {placeChoices.map((option) => (
                <ModeChip
                  key={option}
                  selected={place === option}
                  title={
                    option === "ahorro" ? copy.placeAhorro : copy.placeDiario
                  }
                  onSelect={() => selectPlace(option)}
                />
              ))}
            </div>
            <p className="text-xs leading-relaxed text-zinc-400">
              {place === "ahorro" ? copy.placeAhorroHint : copy.placeDiarioHint}
            </p>
          </div>
        ) : null}
      </div>

      <div>
        <button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          aria-expanded={moreOpen}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-500 transition active:opacity-70"
        >
          {moreOpen ? "Ocultar opciones" : copy.moreOptions}
          <IconChevronDown
            className={`h-4 w-4 transition-transform ${
              moreOpen ? "rotate-180" : ""
            }`}
          />
        </button>
        <p className="mt-1 text-xs text-zinc-400">{copy.moreOptionsHint}</p>

        {moreOpen ? (
          <div className="mt-4 space-y-4">
            {!isEdit ? (
              <Field label={copy.savedLabel} hint={copy.savedHint}>
                <input
                  inputMode="decimal"
                  value={saved}
                  onChange={(e) => setSaved(e.target.value)}
                  placeholder="0"
                  className="input-field"
                />
              </Field>
            ) : (
              <Field
                label={copy.savedLabel}
                hint="Para corregir el total. Lo habitual es usar Apartar."
              >
                <input
                  inputMode="decimal"
                  value={saved}
                  onChange={(e) => setSaved(e.target.value)}
                  placeholder="0"
                  className="input-field"
                />
              </Field>
            )}

            <Field label={copy.dateLabel} hint={copy.dateHint}>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="input-field"
              />
              {suggestedLabel ? (
                <p className="mt-1.5 text-xs font-medium text-teal-700 dark:text-teal-400">
                  {suggestedLabel}
                </p>
              ) : null}
            </Field>

            <Field label={copy.planLabel} hint={copy.planHint}>
              <input
                inputMode="decimal"
                value={monthlyPlan}
                onChange={(e) => setMonthlyPlan(e.target.value)}
                placeholder={suggested != null ? String(suggested) : "0"}
                className="input-field"
              />
            </Field>

            {goalCanReserveDisponible(place) ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                  {copy.planModeLabel}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <ModeChip
                    selected={!deductFromDisponible}
                    title={copy.planModeGuide}
                    onSelect={() => setDeductFromDisponible(false)}
                  />
                  <ModeChip
                    selected={deductFromDisponible}
                    title={copy.planModeDeduct}
                    onSelect={() => setDeductFromDisponible(true)}
                  />
                </div>
                <p className="text-xs leading-relaxed text-zinc-400">
                  {deductFromDisponible
                    ? copy.planModeDeductHint
                    : copy.planModeGuideHint}
                </p>
              </div>
            ) : (
              <p className="text-xs leading-relaxed text-zinc-400">
                {copy.planModeAhorroHint}
              </p>
            )}
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="text-sm text-rose-500" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
          className="btn-primary w-full"
        >
          {copy.save}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={onCancel}
          className="w-full py-3 text-sm font-semibold text-zinc-500"
        >
          {copy.cancel}
        </button>
        {isEdit ? (
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleDelete()}
            className="w-full py-3 text-sm font-semibold text-rose-500"
          >
            {copy.delete}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
        {label}
      </span>
      {children}
      {hint ? (
        <span className="block text-xs leading-relaxed text-zinc-400">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

function ModeChip({
  selected,
  title,
  onSelect,
}: {
  selected: boolean;
  title: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`rounded-2xl px-3 py-3 text-center text-sm font-semibold transition ${
        selected ? "chip-active" : "chip chip-inactive"
      }`}
    >
      {title}
    </button>
  );
}
