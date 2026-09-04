"use client";

import { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import {
  useDisplayAmount,
  useFormatMoney,
  useFormatUsd,
} from "@/hooks/useDisplayAmount";
import { formatMoney, todayIso } from "@/lib/format";
import { priorMonthsRangeLabel } from "@/lib/carryover-copy";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { IconChevronDown } from "@/components/ui/Icons";

export function DisponibleHero() {
  const {
    walletMode,
    summary,
    monthBalance,
    month,
    sharedEnabled,
    goalsEnabled,
    goalsReservedArs,
  } = useFinance();
  const fmt = useDisplayAmount();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [goalsOpen, setGoalsOpen] = useState(false);

  if (walletMode === "split") {
    return <SplitHero />;
  }

  const { monthDisponible, carryoverDisponible, totalDisponible } = monthBalance;
  const hasCarryover = carryoverDisponible !== 0;
  const positive = totalDisponible >= 0;
  const income = summary.totalIncome;
  const expenses = summary.totalExpenses;
  const shared = summary.sharedExpenses;
  const priorRange = priorMonthsRangeLabel(month);
  const showGoalsReserve =
    isFeatureEnabled("savingsGoals") &&
    goalsEnabled &&
    goalsReservedArs > 0;
  const freeAfterGoals = totalDisponible - goalsReservedArs;

  return (
    <section className="animate-slide-up space-y-3">
      <div className="bento overflow-hidden !p-0">
        <div className="px-6 pt-7 pb-6">
          <p className="text-sm font-medium text-zinc-400">
            {hasCarryover ? "Te queda acumulado" : "Te queda este mes"}
          </p>
          <p
            className={`mt-2 text-5xl font-extrabold tracking-tighter tabular-nums md:text-6xl ${
              positive ? "text-zinc-900 dark:text-white" : "amount-negative"
            }`}
          >
            {fmt(totalDisponible)}
          </p>
          {hasCarryover && priorRange && (
            <p className="meta mt-2 text-sm leading-relaxed">
              <span className="font-medium text-zinc-500 dark:text-zinc-400">
                {priorRange}:
              </span>{" "}
              {fmt(carryoverDisponible)}
              <span className="mx-1.5 text-zinc-300 dark:text-zinc-600">·</span>
              <span className="font-medium text-zinc-500 dark:text-zinc-400">
                Este mes:
              </span>{" "}
              {fmt(monthDisponible)}
            </p>
          )}

          {showGoalsReserve ? (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setGoalsOpen((v) => !v)}
                aria-expanded={goalsOpen}
                className="flex w-full items-center justify-between gap-3 rounded-2xl bg-[var(--card-muted)] px-3.5 py-3 text-left transition active:opacity-80"
              >
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-zinc-400">
                    Tras metas este mes
                  </p>
                  <p
                    className={`mt-0.5 text-sm font-semibold tabular-nums ${
                      freeAfterGoals >= 0
                        ? "text-zinc-800 dark:text-zinc-100"
                        : "amount-negative"
                    }`}
                  >
                    Libre {fmt(freeAfterGoals)}
                  </p>
                </div>
                <IconChevronDown
                  className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${
                    goalsOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {goalsOpen ? (
                <div className="mt-2 space-y-1 px-1">
                  <p className="text-xs text-zinc-500">
                    Contado en metas:{" "}
                    <span className="font-semibold tabular-nums text-zinc-700 dark:text-zinc-200">
                      {fmt(goalsReservedArs)}
                    </span>
                  </p>
                  <p className="text-[11px] leading-snug text-zinc-400">
                    Aportes con “resta del disponible”. El total de arriba no
                    cambia; esto es lo que te queda libre para gastar.
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setDetailsOpen((v) => !v)}
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-500 transition active:opacity-70"
          >
            {detailsOpen ? "Ocultar" : "Ver de dónde sale"}
            <IconChevronDown
              className={`h-4 w-4 transition-transform ${detailsOpen ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        {detailsOpen && (
          <div className="grid grid-cols-2 gap-2 bg-[var(--card-muted)] px-4 py-4 sm:grid-cols-3">
            {hasCarryover && (
              <MacroStat
                label="Meses anteriores"
                value={fmt(carryoverDisponible)}
                tone={carryoverDisponible >= 0 ? "income" : "expense"}
                className="col-span-2 sm:col-span-3"
              />
            )}
            <MacroStat
              label="Ingresos"
              value={fmt(income)}
              tone="income"
            />
            <MacroStat
              label="Gastos"
              value={fmt(expenses)}
              tone="expense"
            />
            {sharedEnabled && (
              <MacroStat
                label="Compartido"
                value={fmt(shared)}
                tone="shared"
                className="col-span-2 sm:col-span-1"
              />
            )}
            {showGoalsReserve && (
              <>
                <MacroStat
                  label="Metas (mes)"
                  value={fmt(goalsReservedArs)}
                  tone="shared"
                />
                <MacroStat
                  label="Libre tras metas"
                  value={fmt(freeAfterGoals)}
                  tone={freeAfterGoals >= 0 ? "income" : "expense"}
                />
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function MacroStat({
  label,
  value,
  detail,
  tone,
  className = "",
}: {
  label: string;
  value: string;
  detail?: string | null;
  tone: "income" | "expense" | "shared";
  className?: string;
}) {
  const color =
    tone === "income"
      ? "amount-positive"
      : tone === "expense"
        ? "amount-negative"
        : "text-teal-600 dark:text-teal-400";

  return (
    <div className={`rounded-2xl bg-[var(--card)] px-3.5 py-3 ${className}`}>
      <p className="text-[11px] font-medium text-zinc-400">{label}</p>
      <p className={`mt-1 text-base font-bold tabular-nums ${color}`}>
        {value}
      </p>
      {detail && (
        <p className="mt-0.5 text-[10px] tabular-nums text-zinc-400">{detail}</p>
      )}
    </div>
  );
}

function SplitHero() {
  const { splitSummary, splitMonthBalance, rate, month } = useFinance();
  const formatArs = useFormatMoney();
  const formatUsd = useFormatUsd();
  const [ahorroOpen, setAhorroOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);

  const cotidiano = splitSummary.vida;
  const ahorro = splitSummary.ahorro;
  const vidaBalance = splitMonthBalance.vida;
  const ahorroBalance = splitMonthBalance.ahorro;
  const priorRange = priorMonthsRangeLabel(month);
  const hasVidaCarryover = vidaBalance.carryoverDisponible !== 0;
  const hasAhorroCarryover = ahorroBalance.carryoverDisponible !== 0;
  const ahorroArs = ahorro.disponible * rate.usdToArs;
  const positive = vidaBalance.totalDisponible >= 0;

  return (
    <section className="animate-slide-up space-y-3">
      <div className="bento !p-0 overflow-hidden">
        <div className="px-6 pt-7 pb-5">
          <p className="text-sm font-medium text-zinc-400">
            {hasVidaCarryover ? "Diario acumulado · ARS" : "Diario · ARS"}
          </p>
          <p
            className={`mt-2 text-5xl font-extrabold tracking-tighter tabular-nums ${
              positive ? "text-zinc-900 dark:text-white" : "amount-negative"
            }`}
          >
            {formatArs(vidaBalance.totalDisponible)}
          </p>
          {hasVidaCarryover && priorRange ? (
            <p className="meta mt-2 text-sm leading-relaxed">
              <span className="font-medium text-zinc-500 dark:text-zinc-400">
                {priorRange}:
              </span>{" "}
              {formatArs(vidaBalance.carryoverDisponible)}
              <span className="mx-1.5 text-zinc-300 dark:text-zinc-600">·</span>
              <span className="font-medium text-zinc-500 dark:text-zinc-400">
                Este mes:
              </span>{" "}
              {formatArs(vidaBalance.monthDisponible)}
            </p>
          ) : (
            <p className="meta mt-2">Lo que te queda este mes</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 bg-[var(--card-muted)] px-4 py-4">
          <MacroStat
            label="Ingresos"
            value={formatArs(cotidiano.income)}
            tone="income"
          />
          <MacroStat
            label="Gastos"
            value={formatArs(cotidiano.expenses)}
            tone="expense"
          />
        </div>
      </div>

      <div className="bento !p-0 overflow-hidden">
        <button
          type="button"
          onClick={() => setAhorroOpen((v) => !v)}
          className="flex w-full items-center gap-4 px-5 py-4 text-left transition active:bg-zinc-50 dark:active:bg-zinc-900/40"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
            <span className="text-lg font-bold">$</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold tracking-wide text-zinc-400 uppercase">
              Ahorro USD
            </p>
            <p className="mt-0.5 text-2xl font-bold tracking-tight tabular-nums">
              {formatUsd(ahorroBalance.totalDisponible)}
            </p>
            {hasAhorroCarryover && priorRange ? (
              <p className="meta text-xs leading-relaxed">
                {priorRange}: {formatUsd(ahorroBalance.carryoverDisponible)} · Este
                mes: {formatUsd(ahorroBalance.monthDisponible)}
              </p>
            ) : (
              <p className="meta text-xs">≈ {formatArs(ahorroArs)}</p>
            )}
          </div>
          <IconChevronDown
            className={`h-5 w-5 shrink-0 text-zinc-400 transition-transform ${ahorroOpen ? "rotate-180" : ""}`}
          />
        </button>

        {ahorroOpen && (
          <div className="space-y-3 bg-[var(--card-muted)] px-4 py-4">
            <div className="grid grid-cols-2 gap-2">
              <MacroStat
                label="Entradas"
                value={formatUsd(ahorro.income)}
                tone="income"
              />
              <MacroStat
                label="Salidas"
                value={formatUsd(ahorro.expenses)}
                tone="expense"
              />
            </div>
            <p className="text-xs leading-relaxed text-zinc-400">
              Reserva en dólares · oficial{" "}
              <span className="font-semibold tabular-nums text-zinc-600 dark:text-zinc-300">
                {formatMoney(rate.usdToArs)}
              </span>
            </p>
            <button
              type="button"
              onClick={() => setConvertOpen((v) => !v)}
              className="btn-primary w-full text-sm"
            >
              {convertOpen ? "Cerrar" : "Ahorrar o usar"}
            </button>
            {convertOpen && (
              <WalletConvertForm onDone={() => setConvertOpen(false)} />
            )}
          </div>
        )}

        {!ahorroOpen && (
          <div className="px-5 pb-4">
            <button
              type="button"
              onClick={() => {
                setAhorroOpen(true);
                setConvertOpen(true);
              }}
              className="w-full text-center text-xs font-semibold text-zinc-400 transition active:text-zinc-700"
            >
              Ahorrar o usar dólares
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

type ConvertAction = "to_usd" | "to_ars" | "spend_usd";

function WalletConvertForm({ onDone }: { onDone: () => void }) {
  const { rate, addConversion, addMovement } = useFinance();
  const formatArs = useFormatMoney();
  const formatUsd = useFormatUsd();
  const [action, setAction] = useState<ConvertAction>("to_usd");
  const [amount, setAmount] = useState("");
  const [spendWhat, setSpendWhat] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const parsed = parseFloat(amount.replace(",", "."));
  const valid = parsed > 0 && (action === "spend_usd" || rate.usdToArs > 0);

  const preview =
    action === "to_usd"
      ? valid
        ? `Van a ahorro ≈ ${formatUsd(parsed / rate.usdToArs)}`
        : "¿Cuántos pesos te sobran?"
      : action === "to_ars"
        ? valid
          ? `Van a diario ≈ ${formatArs(parsed * rate.usdToArs)}`
          : "¿Cuántos dólares?"
        : valid
          ? `Sale del ahorro ${formatUsd(parsed)}`
          : "¿Cuántos dólares gastás?";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    setError("");
    try {
      if (action === "spend_usd") {
        await addMovement({
          type: "expense",
          amount: parsed,
          currency: "USD",
          description: spendWhat.trim() || "Gasté del ahorro",
          scope: "personal",
          kind: "variable",
          category: "extras",
          wallet: "ahorro",
          date: todayIso(),
        });
      } else {
        await addConversion({
          direction: action,
          amount: parsed,
          date: todayIso(),
        });
      }
      setAmount("");
      setSpendWhat("");
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }

  const actions: { id: ConvertAction; label: string }[] = [
    { id: "to_usd", label: "Ahorrar" },
    { id: "to_ars", label: "Volver a pesos" },
    { id: "spend_usd", label: "Gastar USD" },
  ];

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-2xl bg-[var(--card)] p-4"
    >
      <p className="text-xs leading-relaxed text-zinc-400">
        Lo que te sobra va a dólares. Si un mes lo necesitás, lo volvés a pesos o
        lo gastás del ahorro.
      </p>

      <div className="grid grid-cols-3 gap-1.5">
        {actions.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setAction(id)}
            className={`rounded-2xl px-1 py-3 text-[11px] font-semibold leading-tight ${
              action === id
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "bg-[var(--card-muted)] text-zinc-500"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div>
        <label className="mb-1.5 block text-[10px] font-semibold tracking-wide text-zinc-400 uppercase">
          {action === "to_usd" ? "Monto en ARS" : "Monto en USD"}
        </label>
        <input
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          className="input-field"
          required
        />
        <p className="meta mt-1.5 text-xs">{preview}</p>
      </div>

      {action === "spend_usd" && (
        <div>
          <label className="mb-1.5 block text-[10px] font-semibold tracking-wide text-zinc-400 uppercase">
            ¿Qué fue?
          </label>
          <input
            type="text"
            value={spendWhat}
            onChange={(e) => setSpendWhat(e.target.value)}
            placeholder="Ej: pasaje, trámite…"
            className="input-field"
          />
        </div>
      )}

      {error && <p className="text-xs text-rose-500">{error}</p>}

      <button
        type="submit"
        disabled={busy || !valid}
        className="btn-primary w-full text-sm"
      >
        {busy
          ? "Guardando…"
          : action === "to_usd"
            ? "Pasar a ahorro"
            : action === "to_ars"
              ? "Pasar a diario"
              : "Gastar del ahorro"}
      </button>
    </form>
  );
}
