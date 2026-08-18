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
  type MovementType,
} from "@/lib/types";

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

export function MovementForm() {
  const router = useRouter();
  const { addMovement } = useFinance();

  const [type, setType] = useState<MovementType>("expense");
  const [date, setDate] = useState(todayIso());
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>("ARS");
  const [description, setDescription] = useState("");
  const [scope, setScope] = useState<ExpenseScope>("personal");
  const [kind, setKind] = useState<ExpenseKind>("variable");
  const [category, setCategory] = useState("otros");
  const [incomeKind, setIncomeKind] = useState<IncomeKind>("active");
  const [source, setSource] = useState("otros");
  const [showMore, setShowMore] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount.replace(",", "."));
    if (!parsed || parsed <= 0 || !description.trim()) return;

    if (type === "expense") {
      addMovement({
        type: "expense",
        date,
        amount: parsed,
        currency,
        description: description.trim(),
        scope,
        kind,
        category,
      });
    } else {
      addMovement({
        type: "income",
        date,
        amount: parsed,
        currency,
        description: description.trim(),
        incomeKind,
        source,
      });
    }

    router.push("/");
  }

  return (
    <form onSubmit={handleSubmit} className="animate-slide-up space-y-6">
      {/* Tipo */}
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
                  : "bg-white text-emerald-600 shadow-sm dark:bg-zinc-900"
                : "text-zinc-500"
            }`}
          >
            {t === "expense" ? "↓ Gasto" : "↑ Ingreso"}
          </button>
        ))}
      </div>

      {/* Monto grande */}
      <div className="card p-5 text-center">
        <label className="text-xs font-medium uppercase tracking-wide text-zinc-400">
          Monto
        </label>
        <div className="mt-2 flex items-center justify-center gap-2">
          <input
            type="text"
            inputMode="decimal"
            required
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="w-full max-w-[200px] border-none bg-transparent text-center text-4xl font-bold tabular-nums outline-none"
          />
        </div>
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
      </div>

      {/* Descripción */}
      <div>
        <input
          type="text"
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input-field text-lg"
          placeholder="¿En qué fue? Ej: Super, OSDE, sueldo…"
        />
      </div>

      {/* Gasto: alcance + categorías rápidas */}
      {type === "expense" && (
        <>
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
                {s === "personal" ? "Personal" : "Compartido"}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {EXPENSE_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`chip ${category === c ? "chip-active" : "chip-inactive"}`}
              >
                {CATEGORY_ICONS[c]} {c}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Ingreso: pasivo/activo rápido */}
      {type === "income" && (
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
              {k === "passive" ? "Pasivo" : "Activo"}
            </button>
          ))}
        </div>
      )}

      {/* Más opciones colapsables */}
      <button
        type="button"
        onClick={() => setShowMore(!showMore)}
        className="w-full text-center text-sm text-zinc-500"
      >
        {showMore ? "▲ Menos opciones" : "▼ Más opciones"}
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

          {type === "expense" && (
            <div className="flex gap-2">
              {(["fixed", "variable"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={`flex-1 rounded-xl py-2.5 text-sm ${kind === k ? "chip-active" : "chip-inactive"}`}
                >
                  {k === "fixed" ? "Fijo" : "Variable"}
                </button>
              ))}
            </div>
          )}

          {type === "income" && (
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Fuente</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="input-field"
              >
                {INCOME_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      <button type="submit" className="btn-primary w-full">
        Guardar
      </button>

      <Link
        href="/"
        className="block w-full py-2 text-center text-sm text-zinc-500"
      >
        Cancelar
      </Link>
    </form>
  );
}
