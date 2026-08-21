"use client";

import { useMemo, useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import {
  useDisplayAmount,
  useFormatMoney,
  useFormatUsd,
} from "@/hooks/useDisplayAmount";
import { formatMoney, todayIso } from "@/lib/format";
import { computeSplitMonthlyBreakdown } from "@/lib/wallet";
import type { SummaryScope } from "@/lib/types";
import { IconChevronDown } from "@/components/ui/Icons";

export function DisponibleHero({ scope }: { scope: SummaryScope }) {
  const {
    walletMode,
    summary,
    annualSummary,
    annualSummaryArs,
    sharedEnabled,
    usdEnabled,
    displayCurrency,
  } = useFinance();
  const fmt = useDisplayAmount();
  const formatArs = useFormatMoney();
  const formatUsd = useFormatUsd();
  const [detailsOpen, setDetailsOpen] = useState(false);

  if (walletMode === "split") {
    return <SplitHero scope={scope} />;
  }

  const isYear = scope === "year";
  const preferUsd = isYear && usdEnabled && displayCurrency === "USD";
  const yearPrimary = preferUsd ? annualSummary : annualSummaryArs;
  const yearSecondary = preferUsd ? annualSummaryArs : annualSummary;
  const yearFmt = preferUsd ? formatUsd : formatArs;
  const yearOtherFmt = preferUsd ? formatArs : formatUsd;

  const disponible = isYear ? yearPrimary.disponible : summary.disponible;
  const positive = disponible >= 0;
  const show = isYear ? yearFmt : fmt;

  const monthLabel =
    annualSummary.activeMonths === 1
      ? "1 mes"
      : `${annualSummary.activeMonths} meses`;

  const income = isYear ? yearPrimary.totalIncome : summary.totalIncome;
  const expenses = isYear ? yearPrimary.totalExpenses : summary.totalExpenses;
  const shared = isYear ? yearPrimary.sharedExpenses : summary.sharedExpenses;
  const incomeDetail = isYear ? yearOtherFmt(yearSecondary.totalIncome) : null;
  const expensesDetail = isYear ? yearOtherFmt(yearSecondary.totalExpenses) : null;
  const sharedDetail = isYear ? yearOtherFmt(yearSecondary.sharedExpenses) : null;

  const yearCaption = isYear
    ? preferUsd
      ? `${formatArs(annualSummaryArs.disponible)} en pesos · ${monthLabel} · al dólar de cada mes`
      : `${formatUsd(annualSummary.disponible)} · ${monthLabel} · al dólar de cada mes`
    : null;

  return (
    <section className="animate-slide-up space-y-3">
      <div className="bento overflow-hidden !p-0">
        <div className="px-6 pt-7 pb-6">
          <p className="text-sm font-medium text-zinc-400">
            {isYear ? `En ${annualSummary.year}` : "Te queda este mes"}
          </p>
          <p
            className={`mt-2 text-5xl font-extrabold tracking-tighter tabular-nums md:text-6xl ${
              positive ? "text-zinc-900 dark:text-white" : "amount-negative"
            }`}
          >
            {show(disponible)}
          </p>
          {yearCaption && <p className="meta mt-2">{yearCaption}</p>}

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
            <MacroStat
              label="Ingresos"
              value={show(income)}
              detail={incomeDetail}
              tone="income"
            />
            <MacroStat
              label="Gastos"
              value={show(expenses)}
              detail={expensesDetail}
              tone="expense"
            />
            {sharedEnabled && (
              <MacroStat
                label="Compartido"
                value={show(shared)}
                detail={sharedDetail}
                tone="shared"
                className="col-span-2 sm:col-span-1"
              />
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

function SplitHero({ scope }: { scope: SummaryScope }) {
  const { splitSummary, splitAnnualSummary, year, rate, ownMovements, rates } =
    useFinance();
  const formatArs = useFormatMoney();
  const formatUsd = useFormatUsd();
  const isYear = scope === "year";
  const [ahorroOpen, setAhorroOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);

  const cotidiano = isYear ? splitAnnualSummary.vida : splitSummary.vida;
  const ahorro = isYear ? splitAnnualSummary.ahorro : splitSummary.ahorro;
  const showCotidiano = isYear ? formatUsd : formatArs;
  const ahorroArs = isYear ? null : ahorro.disponible * rate.usdToArs;
  const splitBreakdown = useMemo(
    () =>
      isYear ? computeSplitMonthlyBreakdown(ownMovements, year, rates) : [],
    [isYear, ownMovements, year, rates],
  );
  const vidaArsYear = useMemo(
    () =>
      splitBreakdown.reduce(
        (acc, snap) => ({
          income: acc.income + snap.split.vida.income,
          expenses: acc.expenses + snap.split.vida.expenses,
          disponible: acc.disponible + snap.split.vida.disponible,
        }),
        { income: 0, expenses: 0, disponible: 0 },
      ),
    [splitBreakdown],
  );
  const positive = isYear
    ? vidaArsYear.disponible >= 0
    : cotidiano.disponible >= 0;

  return (
    <section className="animate-slide-up space-y-3">
      <div className="bento !p-0 overflow-hidden">
        <div className="px-6 pt-7 pb-5">
          <p className="text-sm font-medium text-zinc-400">
            Cotidiano · {isYear ? `${year}` : "ARS"}
          </p>
          <p
            className={`mt-2 text-5xl font-extrabold tracking-tighter tabular-nums ${
              positive ? "text-zinc-900 dark:text-white" : "amount-negative"
            }`}
          >
            {isYear
              ? formatArs(vidaArsYear.disponible)
              : showCotidiano(cotidiano.disponible)}
          </p>
          <p className="meta mt-2">
            {isYear
              ? `${formatUsd(cotidiano.disponible)} · al dólar de cada mes`
              : "Lo que te queda este mes"}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 bg-[var(--card-muted)] px-4 py-4">
          <MacroStat
            label="Ingresos"
            value={
              isYear ? formatArs(vidaArsYear.income) : showCotidiano(cotidiano.income)
            }
            detail={isYear ? formatUsd(cotidiano.income) : null}
            tone="income"
          />
          <MacroStat
            label="Gastos"
            value={
              isYear
                ? formatArs(vidaArsYear.expenses)
                : showCotidiano(cotidiano.expenses)
            }
            detail={isYear ? formatUsd(cotidiano.expenses) : null}
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
              Ahorro USD{isYear && ` · ${year}`}
            </p>
            <p className="mt-0.5 text-2xl font-bold tracking-tight tabular-nums">
              {formatUsd(ahorro.disponible)}
            </p>
            {ahorroArs !== null && (
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

            {!isYear && (
              <>
                <button
                  type="button"
                  onClick={() => setConvertOpen((v) => !v)}
                  className="btn-primary w-full text-sm"
                >
                  {convertOpen ? "Cerrar" : "Pasar plata"}
                </button>
                {convertOpen && (
                  <WalletConvertForm onDone={() => setConvertOpen(false)} />
                )}
              </>
            )}
          </div>
        )}

        {!ahorroOpen && !isYear && (
          <div className="px-5 pb-4">
            <button
              type="button"
              onClick={() => {
                setAhorroOpen(true);
                setConvertOpen(true);
              }}
              className="w-full text-center text-xs font-semibold text-zinc-400 transition active:text-zinc-700"
            >
              Pasar plata entre bolsillos
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

type ConvertDirection = "to_usd" | "to_ars";

function WalletConvertForm({ onDone }: { onDone: () => void }) {
  const { rate, addConversion } = useFinance();
  const formatArs = useFormatMoney();
  const formatUsd = useFormatUsd();
  const [direction, setDirection] = useState<ConvertDirection>("to_usd");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const parsed = parseFloat(amount.replace(",", "."));
  const valid = parsed > 0 && rate.usdToArs > 0;

  const preview =
    direction === "to_usd"
      ? valid
        ? `Van a ahorro ≈ ${formatUsd(parsed / rate.usdToArs)}`
        : "¿Cuántos pesos?"
      : valid
        ? `Van a cotidiano ≈ ${formatArs(parsed * rate.usdToArs)}`
        : "¿Cuántos dólares?";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    setError("");
    try {
      await addConversion({
        direction,
        amount: parsed,
        date: todayIso()
      });
      setAmount("");
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo convertir");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-2xl bg-[var(--card)] p-4"
    >
      <p className="text-xs leading-relaxed text-zinc-400">
        Pasás plata de un bolsillo al otro, al dólar oficial.
      </p>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setDirection("to_usd")}
          className={`rounded-2xl py-3 text-xs font-semibold ${
            direction === "to_usd"
              ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
              : "bg-[var(--card-muted)] text-zinc-500"
          }`}
        >
          ARS → USD
        </button>
        <button
          type="button"
          onClick={() => setDirection("to_ars")}
          className={`rounded-2xl py-3 text-xs font-semibold ${
            direction === "to_ars"
              ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
              : "bg-[var(--card-muted)] text-zinc-500"
          }`}
        >
          USD → ARS
        </button>
      </div>

      <div>
        <label className="mb-1.5 block text-[10px] font-semibold tracking-wide text-zinc-400 uppercase">
          {direction === "to_usd" ? "Monto en ARS" : "Monto en USD"}
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

      {error && <p className="text-xs text-rose-500">{error}</p>}

      <button
        type="submit"
        disabled={busy || !valid}
        className="btn-primary w-full text-sm"
      >
        {busy
          ? "Guardando…"
          : direction === "to_usd"
            ? "Pasar a ahorro"
            : "Pasar a cotidiano"}
      </button>
    </form>
  );
}
