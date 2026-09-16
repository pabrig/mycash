"use client";

import { useState, type ReactNode } from "react";
import { useFinance } from "@/context/FinanceContext";
import { SavingsLocationIcon } from "@/components/SavingsLocationIcon";
import { LOCATION_NAME_SUGGESTIONS } from "@/lib/savings-location-icons";
import type { SavingsLocation } from "@/lib/savings-locations";

function parseAmount(raw: string): number | null {
  const parsed = parseFloat(raw.replace(",", ".").replace(/\s/g, ""));
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

export function SavingsLocationEditor({
  location,
  onDone,
  onCancel,
}: {
  location?: SavingsLocation;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { addSavingsLocation, updateSavingsLocation, deleteSavingsLocation } =
    useFinance();
  const isEdit = Boolean(location);
  const [name, setName] = useState(location?.name ?? "");
  const [amount, setAmount] = useState(
    location ? String(location.amount) : "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Poné un nombre (banco, app o lugar).");
      return;
    }
    const parsed = parseAmount(amount);
    if (parsed === null) {
      setError("Poné cuánto hay ahí, en dólares.");
      return;
    }
    setSaving(true);
    try {
      if (location) {
        await updateSavingsLocation(location.id, { name: trimmed, amount: parsed });
      } else {
        await addSavingsLocation({ name: trimmed, amount: parsed });
      }
      onDone();
    } catch {
      setError("No se pudo guardar. Probá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!location) return;
    if (!window.confirm("¿Borrar este lugar? No se puede deshacer.")) return;
    setSaving(true);
    try {
      await deleteSavingsLocation(location.id);
      onDone();
    } catch {
      setError("No se pudo borrar. Probá de nuevo.");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5 pb-4">
      <Field label="¿Dónde está?" hint="Banco, app o lugar. Si es conocido, aparece el ícono.">
        <div className="flex items-center gap-3">
          <SavingsLocationIcon key={name || "empty"} name={name} />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Brubank, IBKR, efectivo…"
            className="input-field min-w-0 flex-1"
            autoFocus={!isEdit}
          />
        </div>
      </Field>

      {!isEdit ? (
        <div className="flex flex-wrap gap-1.5">
          {LOCATION_NAME_SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setName(suggestion)}
              className="chip text-xs"
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}

      <Field label="Cuánto hay" hint="En USD. Es una foto: no mueve el total de Ahorro.">
        <input
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          className="input-field"
        />
      </Field>

      {error ? (
        <p className="text-sm text-[var(--expense)]">{error}</p>
      ) : null}

      <div className="space-y-1 pt-1">
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
          className="btn-primary w-full"
        >
          {isEdit ? "Guardar" : "Agregar lugar"}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={onCancel}
          className="w-full py-3 text-sm font-semibold text-[var(--muted-fg)]"
        >
          Cancelar
        </button>
        {isEdit ? (
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleDelete()}
            className="w-full py-3 text-sm font-semibold text-[var(--expense)]"
          >
            Borrar lugar
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
      <span className="text-sm font-medium text-[var(--muted-fg)]">{label}</span>
      {children}
      {hint ? (
        <span className="block text-xs leading-relaxed text-[var(--muted-fg)]">
          {hint}
        </span>
      ) : null}
    </label>
  );
}
