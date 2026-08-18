"use client";

import { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { useDisplayAmount } from "@/hooks/useDisplayAmount";
import { formatMoney, formatUsd, todayIso } from "@/lib/format";
import type { SummaryScope } from "@/lib/types";

export function DisponibleHero({ scope }: { scope: SummaryScope }) {
  const { walletMode, summary, annualSummary, sharedEnabled } = useFinance();
  const fmt = useDisplayAmount();

  if (walletMode === "split") {
    return <SplitHero scope={scope} />;
  }

  const isYear = scope === "year";
  const positive = isYear
    ? annualSummary.averages.disponible >= 0
    : summary.disponible >= 0;

  const monthLabel =
    annualSummary.activeMonths === 1
      ? "1 mes"
      : `${annualSummary.activeMonths} meses`;

  const cols = sharedEnabled ? "grid-cols-3" : "grid-cols-2";

  return (
    <section className="card animate-slide-up overflow-hidden p-0">
      <div
        className={`px-5 py-6 ${positive ? "bg-gradient-to-br from-emerald-600 to-emerald-700" : "bg-gradient-to-br from-red-500 to-red-600"} text-white`}
      >
        {isYear ? (
          <>
            <p className="text-sm font-medium text-white/80">
              Prom. mensual {annualSummary.year}
            </p>
            <p className="mt-1 text-4xl font-bold tracking-tight tabular-nums">
              {fmt(annualSummary.averages.disponible)}
            </p>
            <p className="mt-1 text-xs text-white/70">
              Acumulado {fmt(annualSummary.disponible)} · {monthLabel} con
              movimientos
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-white/80">Disponible del mes</p>
            <p className="mt-1 text-4xl font-bold tracking-tight tabular-nums">
              {fmt(summary.disponible)}
            </p>
          </>
        )}
      </div>
      <div className={`grid ${cols} divide-x divide-zinc-100 dark:divide-zinc-800`}>
        {isYear ? (
          <>
            <StatCell
              label="Prom. ingresos"
              value={annualSummary.averages.totalIncome}
              fmt={fmt}
              tone="income"
            />
            <StatCell
              label="Prom. egresos"
              value={annualSummary.averages.totalExpenses}
              fmt={fmt}
              tone="expense"
            />
            {sharedEnabled && (
              <StatCell
                label="Prom. compart."
                value={annualSummary.averages.sharedExpenses}
                fmt={fmt}
                tone="shared"
              />
            )}
          </>
        ) : (
          <>
            <StatCell label="Ingresos" value={summary.totalIncome} fmt={fmt} tone="income" />
            <StatCell label="Gastos" value={summary.totalExpenses} fmt={fmt} tone="expense" />
            {sharedEnabled && (
              <StatCell label="Compart." value={summary.sharedExpenses} fmt={fmt} tone="shared" />
            )}
          </>
        )}
      </div>
    </section>
  );
}

function SplitHero({ scope }: { scope: SummaryScope }) {
  const { splitSummary, splitAnnualSummary, year, rate } = useFinance();
  const isYear = scope === "year";
  const [ahorroOpen, setAhorroOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);

  const cotidiano = isYear ? splitAnnualSummary.averages.vida : splitSummary.vida;
  const ahorro = isYear ? splitAnnualSummary.averages.ahorro : splitSummary.ahorro;
  const ahorroArs = ahorro.disponible * rate.usdToArs;
  const positive = cotidiano.disponible >= 0;

  return (
    <section className="animate-slide-up space-y-3">
      {/* Cotidiano — protagonista */}
      <div className="card overflow-hidden p-0">
        <div
          className={`px-5 py-6 ${positive ? "bg-gradient-to-br from-emerald-600 to-emerald-700" : "bg-gradient-to-br from-red-500 to-red-600"} text-white`}
        >
          <div className="flex items-center gap-2 text-white/85">
            <WalletIcon className="h-4 w-4" />
            <p className="text-sm font-medium">
              Cotidiano · ARS
              {isYear && ` · prom. ${year}`}
            </p>
          </div>
          <p className="mt-1 text-4xl font-bold tracking-tight tabular-nums">
            {formatMoney(cotidiano.disponible)}
          </p>
          <p className="mt-1 text-xs text-white/70">
            {isYear
              ? "Lo que te queda para el día a día, en promedio"
              : "Lo que te queda para el día a día este mes"}
          </p>
        </div>
        <div className="grid grid-cols-2 divide-x divide-zinc-100 dark:divide-zinc-800">
          <NativeStat
            icon="↑"
            label="Ingresos"
            value={cotidiano.income}
            formatter={formatMoney}
            tone="income"
          />
          <NativeStat
            icon="↓"
            label="Gastos"
            value={cotidiano.expenses}
            formatter={formatMoney}
            tone="expense"
          />
        </div>
      </div>

      {/* Ahorro USD — presencia media, sin hero azul */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-b from-zinc-50 to-white shadow-sm dark:border-zinc-700 dark:from-zinc-900 dark:to-zinc-950">
        <button
          type="button"
          onClick={() => setAhorroOpen((v) => !v)}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-zinc-100/70 dark:active:bg-zinc-800/50"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900">
            <UsdIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              Ahorro
              {isYear && " · prom."}
            </p>
            <p className="mt-0.5 text-xl font-bold tabular-nums text-zinc-800 dark:text-zinc-100">
              {formatUsd(ahorro.disponible)}
            </p>
            <p className="text-xs text-zinc-400">
              ≈ {formatMoney(ahorroArs)} al oficial
            </p>
          </div>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800">
            {ahorroOpen ? (
              <ChevronIcon className="h-4 w-4 rotate-180" />
            ) : (
              <ChevronIcon className="h-4 w-4" />
            )}
          </span>
        </button>

        {ahorroOpen && (
          <div className="space-y-3 border-t border-zinc-200 px-4 py-3.5 dark:border-zinc-700">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-white px-3 py-2.5 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-700">
                <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                  <span className="text-emerald-500">↑</span> Entradas
                </p>
                <p className="mt-0.5 font-semibold tabular-nums text-zinc-800 dark:text-zinc-100">
                  {formatUsd(ahorro.income)}
                </p>
              </div>
              <div className="rounded-xl bg-white px-3 py-2.5 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-700">
                <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                  <span className="text-red-400">↓</span> Salidas
                </p>
                <p className="mt-0.5 font-semibold tabular-nums text-zinc-800 dark:text-zinc-100">
                  {formatUsd(ahorro.expenses)}
                </p>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-zinc-500">
              Reserva en dólares. Cotización oficial{" "}
              <span className="font-medium tabular-nums text-zinc-600 dark:text-zinc-300">
                {formatMoney(rate.usdToArs)}
              </span>
              .
            </p>

            {!isYear && (
              <>
                <button
                  type="button"
                  onClick={() => setConvertOpen((v) => !v)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-800 py-3 text-sm font-semibold text-white active:scale-[0.99] dark:bg-zinc-100 dark:text-zinc-900"
                >
                  <SwapIcon className="h-4 w-4" />
                  {convertOpen ? "Cerrar conversión" : "Convertir entre bolsillos"}
                </button>
                {convertOpen && (
                  <WalletConvertForm onDone={() => setConvertOpen(false)} />
                )}
              </>
            )}
          </div>
        )}

        {!ahorroOpen && !isYear && (
          <div className="border-t border-zinc-200 px-4 py-2.5 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => {
                setAhorroOpen(true);
                setConvertOpen(true);
              }}
              className="flex w-full items-center justify-center gap-2 text-xs font-medium text-zinc-500 active:text-zinc-800 dark:active:text-zinc-200"
            >
              <SwapIcon className="h-3.5 w-3.5" />
              Convertir ARS ↔ USD
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
  const [direction, setDirection] = useState<ConvertDirection>("to_usd");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const parsed = parseFloat(amount.replace(",", "."));
  const valid = parsed > 0 && rate.usdToArs > 0;

  const preview =
    direction === "to_usd"
      ? valid
        ? `Comprás ≈ ${formatUsd(parsed / rate.usdToArs)}`
        : "Ingresá pesos a convertir"
      : valid
        ? `Vendés ≈ ${formatMoney(parsed * rate.usdToArs)}`
        : "Ingresá dólares a vender";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    setError("");
    try {
      await addConversion({
        direction,
        amount: parsed,
        date: todayIso(),
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
      className="space-y-3 rounded-xl bg-white p-3 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-700"
    >
      <p className="flex items-start gap-2 text-xs leading-relaxed text-zinc-500">
        <SwapIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Pasá plata entre Cotidiano y Ahorro USD al tipo oficial.
      </p>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setDirection("to_usd")}
          className={`flex flex-col items-center gap-1.5 rounded-xl py-3 text-xs font-semibold ${
            direction === "to_usd"
              ? "bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
          }`}
        >
          <span className="flex items-center gap-1 text-[11px] opacity-80">
            ARS <ArrowRightIcon className="h-3 w-3" /> USD
          </span>
          Comprar dólares
        </button>
        <button
          type="button"
          onClick={() => setDirection("to_ars")}
          className={`flex flex-col items-center gap-1.5 rounded-xl py-3 text-xs font-semibold ${
            direction === "to_ars"
              ? "bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
          }`}
        >
          <span className="flex items-center gap-1 text-[11px] opacity-80">
            USD <ArrowRightIcon className="h-3 w-3" /> ARS
          </span>
          Vender dólares
        </button>
      </div>

      <div>
        <label className="mb-1 block text-[10px] uppercase tracking-wide text-zinc-400">
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
        <p className="mt-1.5 text-xs text-zinc-500">{preview}</p>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={busy || !valid}
        className="btn-primary flex w-full items-center justify-center gap-2 text-sm"
      >
        <SwapIcon className="h-4 w-4" />
        {busy
          ? "Guardando…"
          : direction === "to_usd"
            ? "Pasar a Ahorro USD"
            : "Pasar a Cotidiano"}
      </button>
    </form>
  );
}

function StatCell({
  label,
  value,
  fmt,
  tone,
}: {
  label: string;
  value: number;
  fmt: (n: number) => string;
  tone: "income" | "expense" | "shared";
}) {
  const colors = {
    income: "text-emerald-600",
    expense: "text-red-500",
    shared: "text-indigo-500",
  };
  const icons = {
    income: "↑",
    expense: "↓",
    shared: "◉",
  };

  return (
    <div className="px-3 py-3 text-center">
      <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
        <span className={`mr-0.5 ${colors[tone]}`}>{icons[tone]}</span>
        {label}
      </p>
      <p className={`mt-0.5 text-sm font-semibold tabular-nums ${colors[tone]}`}>
        {fmt(value)}
      </p>
    </div>
  );
}

function NativeStat({
  icon,
  label,
  value,
  formatter,
  tone,
}: {
  icon: string;
  label: string;
  value: number;
  formatter: (n: number) => string;
  tone: "income" | "expense";
}) {
  const colors = {
    income: "text-emerald-600",
    expense: "text-red-500",
  };

  return (
    <div className="px-3 py-3 text-center">
      <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
        <span className={`mr-0.5 ${colors[tone]}`}>{icon}</span>
        {label}
      </p>
      <p className={`mt-0.5 text-sm font-semibold tabular-nums ${colors[tone]}`}>
        {formatter(value)}
      </p>
    </div>
  );
}

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 12h5v3h-5a1.5 1.5 0 010-3z" />
    </svg>
  );
}

function UsdIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v10M15 9.5c0-1.1-1.3-2-3-2s-3 .9-3 2 1.3 2 3 2 3 .9 3 2-1.3 2-3 2-3-.9-3-2" />
    </svg>
  );
}

function SwapIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
