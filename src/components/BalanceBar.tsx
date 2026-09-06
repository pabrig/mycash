"use client";

import { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { useDisplayAmount } from "@/hooks/useDisplayAmount";

const BAR = {
  rentas: "bg-cyan-400",
  trabajo: "bg-primary",
  gastos: "bg-[var(--expense)]/80",
} as const;

export function BalanceBar() {
  const { summary, walletMode, sharedEnabled } = useFinance();
  const fmt = useDisplayAmount();
  const [open, setOpen] = useState(false);

  if (walletMode === "split") return null;

  const total = summary.totalIncome + summary.totalExpenses;
  const rentasPct = total > 0 ? (summary.passiveIncome / total) * 100 : 0;
  const trabajoPct = total > 0 ? (summary.activeIncome / total) * 100 : 0;
  const gastosPct = total > 0 ? (summary.totalExpenses / total) * 100 : 50;

  return (
    <section className="bento animate-slide-up-delay-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-sm font-semibold text-[var(--muted-fg)]">
          Entró y salió
        </span>
        <span className="text-xs font-medium text-[var(--muted-fg)]">
          {open ? "Ocultar" : "Ver más"}
        </span>
      </button>

      <div
        className="mt-4 flex h-1.5 overflow-hidden rounded-full bg-[var(--card-muted)]"
        role="img"
        aria-label={`Ingresos por rentas ${fmt(summary.passiveIncome)}, por trabajo ${fmt(summary.activeIncome)}. Gastos ${fmt(summary.totalExpenses)}`}
      >
        {total === 0 && <Segment color={BAR.trabajo} width={50} />}
        {rentasPct > 0 && <Segment color={BAR.rentas} width={rentasPct} />}
        {trabajoPct > 0 && <Segment color={BAR.trabajo} width={trabajoPct} />}
        {gastosPct > 0 && <Segment color={BAR.gastos} width={gastosPct} />}
      </div>

      <div className="mt-3 flex justify-between text-xs font-semibold">
        <span className="amount-positive">↑ {fmt(summary.totalIncome)}</span>
        <span className="amount-negative">↓ {fmt(summary.totalExpenses)}</span>
      </div>

      {open && (
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Detail
            label="Rentas"
            value={summary.passiveIncome}
            fmt={fmt}
            tone="income"
            swatch={BAR.rentas}
          />
          <Detail
            label="Trabajo"
            value={summary.activeIncome}
            fmt={fmt}
            tone="income"
            swatch={BAR.trabajo}
          />
          <Detail
            label="Gastos"
            value={summary.personalExpenses}
            fmt={fmt}
            tone="expense"
          />
          {sharedEnabled && (
            <Detail
              label="Compartido"
              value={summary.sharedExpenses}
              fmt={fmt}
              tone="shared"
            />
          )}
          <Detail
            label="Todos los meses"
            value={summary.personalFixed}
            fmt={fmt}
          />
          <Detail label="Una vez" value={summary.personalVariable} fmt={fmt} />
        </div>
      )}
    </section>
  );
}

function Segment({ color, width }: { color: string; width: number }) {
  return (
    <div
      className={`${color} transition-all duration-700 ease-out`}
      style={{ width: `${width}%` }}
    />
  );
}

function Detail({
  label,
  value,
  fmt,
  tone,
  swatch,
}: {
  label: string;
  value: number;
  fmt: (n: number) => string;
  tone?: "income" | "expense" | "shared";
  swatch?: string;
}) {
  const colors = {
    income: "amount-positive",
    expense: "amount-negative",
    shared: "text-shared",
  };

  return (
    <div className="rounded-2xl bg-[var(--card-muted)] px-3.5 py-3">
      <p className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--muted-fg)]">
        {swatch && (
          <span
            className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${swatch}`}
          />
        )}
        {label}
      </p>
      <p
        className={`mt-0.5 text-sm font-bold tabular-nums ${ tone ? colors[tone] : "text-[var(--foreground)]" }`}
      >
        {fmt(value)}
      </p>
    </div>
  );
}
