"use client";

import { ChoiceOption } from "@/components/ChoiceOption";
import { useFinance } from "@/context/FinanceContext";
import {
  MONEY_PROFILE_OPTIONS,
  WALLET_VIEW_OPTIONS,
} from "@/lib/account-setup";
import {
  resolveMoneyProfile,
  settingsForMoneyProfile,
  type MoneyProfile,
} from "@/lib/money-profile";

export function MoneySettings() {
  const {
    usdEnabled,
    setUsdEnabled,
    walletMode,
    setWalletMode,
    sharedEnabled,
    carryoverEnabled,
    setCarryoverEnabled,
  } = useFinance();
  const profile = resolveMoneyProfile(usdEnabled, walletMode);

  async function selectProfile(next: MoneyProfile) {
    const settings = settingsForMoneyProfile(next, walletMode);
    await setUsdEnabled(settings.usdEnabled);
    await setWalletMode(settings.walletMode);
  }

  const selectedHint = MONEY_PROFILE_OPTIONS.find((o) => o.id === profile)?.hint;

  return (
    <>
      <section className="bento space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold tracking-tight">Arrastre anual</p>
            <p className="meta mt-1 text-xs leading-relaxed">
              En la vista mes suma lo que te fue quedando desde enero. Apagado,
              solo ves el mes actual.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={carryoverEnabled}
            onClick={() => void setCarryoverEnabled(!carryoverEnabled)}
            className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors ${
              carryoverEnabled
                ? "bg-zinc-900 dark:bg-white"
                : "bg-zinc-200 dark:bg-zinc-700"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform dark:bg-zinc-900 ${
                carryoverEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </section>

      <section className="bento space-y-4">
        <div>
          <p className="text-sm font-semibold tracking-tight">¿Cómo es tu plata?</p>
          <p className="meta mt-1 text-xs">
            Elegí cómo cobrás y si apartás dólares. Lo podés cambiar cuando
            quieras.
          </p>
        </div>

        <div className="space-y-2" role="radiogroup" aria-label="Cómo es tu plata">
          {MONEY_PROFILE_OPTIONS.map((option) => (
            <ChoiceOption
              key={option.id}
              title={option.title}
              description={option.description}
              selected={profile === option.id}
              onSelect={() => void selectProfile(option.id)}
            />
          ))}
        </div>

        {selectedHint ? (
          <p className="text-xs leading-relaxed text-zinc-400">{selectedHint}</p>
        ) : null}
      </section>

      {profile === "dual" && (
        <section className="bento space-y-4">
          <div>
            <p className="text-sm font-semibold tracking-tight">
              ¿Cómo querés verla?
            </p>
            <p className="meta mt-1 text-xs">
              Un número o dos lugares: día a día y ahorro.
            </p>
          </div>

          <div className="space-y-2" role="radiogroup" aria-label="Cómo querés verla">
            {WALLET_VIEW_OPTIONS.map((option) => (
              <ChoiceOption
                key={option.id}
                title={option.title}
                description={option.description}
                selected={walletMode === option.id}
                onSelect={() => void setWalletMode(option.id)}
              />
            ))}
          </div>

          {walletMode === "split" && (
            <p className="text-xs leading-relaxed text-zinc-400">
              Lo que entra en pesos va a Diario. Lo que entra en dólares, a
              Ahorro.
              {sharedEnabled
                ? " Los gastos con otros que cargás cuentan como Diario, salvo que en Cuenta elijas partir la plata del grupo."
                : ""}
            </p>
          )}
        </section>
      )}
    </>
  );
}
