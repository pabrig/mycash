"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ChoiceOption } from "@/components/ChoiceOption";
import { IconCheck, IconChevronLeft, IconMyCash, IconPlus } from "@/components/ui/Icons";
import { useAuth } from "@/context/AuthContext";
import { useFinance } from "@/context/FinanceContext";
import {
  canContinueOnboarding,
  greetingName,
  HOWTO_MOVEMENTS,
  HOWTO_PERIOD,
  HOWTO_SHARED,
  isSetupQuestionStep,
  MONEY_PROFILE_OPTIONS,
  onboardingSteps,
  resolvedWalletMode,
  setupSummaryLines,
  SHARED_SETUP_OPTIONS,
  WALLET_VIEW_OPTIONS,
  type OnboardingStep,
} from "@/lib/account-setup";
import { friendlyError } from "@/lib/errors";
import type { MoneyProfile } from "@/lib/money-profile";
import type { WalletMode } from "@/lib/types";

export function OnboardingWizard() {
  const router = useRouter();
  const { profile, members } = useAuth();
  const { completeAccountSetup } = useFinance();

  const askShared = members.length <= 1;
  const joinedGroup = members.length > 1;
  const name = greetingName(profile?.displayName);

  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [moneyProfile, setMoneyProfile] = useState<MoneyProfile | null>(null);
  const [walletMode, setWalletMode] = useState<WalletMode | null>(null);
  const [sharedEnabled, setSharedEnabled] = useState<boolean | null>(
    joinedGroup ? true : null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const steps = onboardingSteps({
    moneyProfile,
    askShared,
    showSharedHowTo: joinedGroup || sharedEnabled === true,
  });
  const current = steps.includes(step) ? step : "money";
  const index = Math.max(0, steps.indexOf(current));
  const total = steps.length;
  const progress = (index + 1) / total;
  const canContinue = canContinueOnboarding(current, {
    moneyProfile,
    walletMode,
    sharedEnabled,
  });

  function goBack() {
    const prev = steps[index - 1];
    if (prev) {
      setError("");
      setStep(prev);
    }
  }

  function goNext() {
    if (!canContinue) return;
    const next = steps[index + 1];
    if (next) {
      setError("");
      setStep(next);
    }
  }

  async function finish() {
    if (!moneyProfile) return;
    setBusy(true);
    setError("");
    try {
      await completeAccountSetup({
        profile: moneyProfile,
        walletMode: resolvedWalletMode(moneyProfile, walletMode),
        sharedEnabled: joinedGroup ? true : Boolean(sharedEnabled),
      });
      router.replace("/");
    } catch (e) {
      setError(friendlyError(e, "No se pudo guardar. Probá de nuevo."));
      setBusy(false);
    }
  }

  const primaryLabel =
    current === "welcome"
      ? "Empezar"
      : current === "done"
        ? "Ver mi plata"
        : "Seguir";

  function handlePrimary() {
    if (current === "done") {
      void finish();
      return;
    }
    goNext();
  }

  return (
    <div className="flex min-h-[calc(100dvh-6rem)] flex-col">
      <div className="pt-2">
        <div className="flex items-center justify-between gap-3">
          {index > 0 ? (
            <button
              type="button"
              onClick={goBack}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--card)] active:scale-95"
              aria-label="Volver"
            >
              <IconChevronLeft className="h-5 w-5" />
            </button>
          ) : (
            <span className="h-11 w-11" />
          )}
          <p className="text-sm font-semibold text-zinc-500">
            Paso {index + 1} de {total}
          </p>
          <span className="h-11 w-11" />
        </div>
        <div
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={index + 1}
          aria-label={`Paso ${index + 1} de ${total}`}
        >
          <div
            className="h-full rounded-full bg-teal-600 transition-[width] duration-300 ease-out dark:bg-teal-400"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      </div>

      <div key={current} className="mt-8 flex-1 animate-slide-up">
        {current === "welcome" ? (
          <WelcomeStep name={name} />
        ) : current === "money" ? (
          <MoneyStep
            selected={moneyProfile}
            onSelect={(id) => {
              setMoneyProfile(id);
              if (id !== "dual") setWalletMode(null);
            }}
          />
        ) : current === "view" ? (
          <ViewStep selected={walletMode} onSelect={setWalletMode} />
        ) : current === "shared" ? (
          <SharedStep selected={sharedEnabled} onSelect={setSharedEnabled} />
        ) : current === "howto_movements" ? (
          <HowToStep
            title={HOWTO_MOVEMENTS.title}
            sub={HOWTO_MOVEMENTS.sub}
            items={HOWTO_MOVEMENTS.items}
            preview={<PlusPreview />}
          />
        ) : current === "howto_period" ? (
          <HowToStep
            title={HOWTO_PERIOD.title}
            sub={HOWTO_PERIOD.sub}
            items={HOWTO_PERIOD.items}
            preview={<PeriodPreview />}
          />
        ) : current === "howto_shared" ? (
          <HowToStep
            title={HOWTO_SHARED.title}
            sub={HOWTO_SHARED.sub}
            items={HOWTO_SHARED.items}
          />
        ) : (
          <DoneStep
            name={name}
            lines={
              moneyProfile
                ? setupSummaryLines(
                    moneyProfile,
                    resolvedWalletMode(moneyProfile, walletMode),
                    joinedGroup ? true : Boolean(sharedEnabled),
                  )
                : []
            }
          />
        )}
      </div>

      <div className="sticky bottom-0 mt-8 space-y-3 bg-[var(--background)] pb-2 pt-3">
        {isSetupQuestionStep(current) ? (
          <p className="text-center text-sm text-zinc-400">
            Después lo podés cambiar en Cuenta.
          </p>
        ) : null}
        {error ? <p className="text-center text-sm text-red-500">{error}</p> : null}
        <button
          type="button"
          disabled={!canContinue || busy}
          onClick={handlePrimary}
          className="btn-primary w-full text-base"
        >
          {busy ? "Guardando…" : primaryLabel}
        </button>
      </div>
    </div>
  );
}

function WelcomeStep({ name }: { name: string }) {
  return (
    <div className="space-y-5 text-center">
      <IconMyCash className="mx-auto h-14 w-14" />
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          {name ? `Hola, ${name}` : "Armemos tu cuenta"}
        </h1>
        <p className="mx-auto max-w-sm text-base leading-relaxed text-zinc-500">
          Primero acomodamos la app a cómo usás la plata. Después te mostramos
          cómo anotar movimientos, y la diferencia entre mes y año.
        </p>
      </div>
      <p className="text-sm leading-relaxed text-zinc-400">
        No hay respuestas incorrectas. Si más adelante cambia tu forma de
        manejar la plata, lo cambiás en Cuenta.
      </p>
    </div>
  );
}

function MoneyStep({
  selected,
  onSelect,
}: {
  selected: MoneyProfile | null;
  onSelect: (id: MoneyProfile) => void;
}) {
  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">¿Cómo usás la plata?</h1>
        <p className="mt-2 text-base leading-relaxed text-zinc-500">
          Elegí lo que más se parece a tu día a día.
        </p>
      </div>
      <div className="space-y-2.5" role="radiogroup" aria-label="Cómo usás la plata">
        {MONEY_PROFILE_OPTIONS.map((option) => (
          <ChoiceOption
            key={option.id}
            size="comfortable"
            title={option.title}
            description={option.description}
            example={option.example}
            selected={selected === option.id}
            onSelect={() => onSelect(option.id)}
          />
        ))}
      </div>
    </section>
  );
}

function ViewStep({
  selected,
  onSelect,
}: {
  selected: WalletMode | null;
  onSelect: (id: WalletMode) => void;
}) {
  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">¿Cómo querés verla?</h1>
        <p className="mt-2 text-base leading-relaxed text-zinc-500">
          Esto no cambia tu plata. Solo cómo la ves en la pantalla.
        </p>
      </div>
      <div className="space-y-2.5" role="radiogroup" aria-label="Cómo querés verla">
        {WALLET_VIEW_OPTIONS.map((option) => (
          <ChoiceOption
            key={option.id}
            size="comfortable"
            title={option.title}
            description={option.description}
            selected={selected === option.id}
            onSelect={() => onSelect(option.id)}
          />
        ))}
      </div>
    </section>
  );
}

function SharedStep({
  selected,
  onSelect,
}: {
  selected: boolean | null;
  onSelect: (value: boolean) => void;
}) {
  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          ¿Anotás gastos con otras personas?
        </h1>
        <p className="mt-2 text-base leading-relaxed text-zinc-500">
          Por ejemplo la casa, la pareja o un alquiler. Cada uno sigue viendo
          lo suyo.
        </p>
      </div>
      <div
        className="space-y-2.5"
        role="radiogroup"
        aria-label="Gastos con otras personas"
      >
        {SHARED_SETUP_OPTIONS.map((option) => (
          <ChoiceOption
            key={String(option.id)}
            size="comfortable"
            title={option.title}
            description={option.description}
            selected={selected === option.id}
            onSelect={() => onSelect(option.id)}
          />
        ))}
      </div>
    </section>
  );
}

function DoneStep({ name, lines }: { name: string; lines: string[] }) {
  return (
    <section className="space-y-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300">
        <IconCheck className="h-8 w-8" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          {name ? `Listo, ${name}` : "Listo"}
        </h1>
        <p className="mx-auto max-w-sm text-base leading-relaxed text-zinc-500">
          Ya podés anotar lo que entra y lo que sale.
        </p>
      </div>
      <ul className="mx-auto max-w-sm space-y-2 text-left">
        {lines.map((line) => (
          <li
            key={line}
            className="rounded-2xl bg-[var(--card)] px-4 py-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300"
          >
            {line}
          </li>
        ))}
      </ul>
      <p className="text-sm leading-relaxed text-zinc-400">
        Si cambia cómo manejás la plata, andá a Cuenta y lo cambiás.
      </p>
    </section>
  );
}

function HowToStep({
  title,
  sub,
  items,
  preview,
}: {
  title: string;
  sub: string;
  items: readonly { title: string; body: string }[];
  preview?: ReactNode;
}) {
  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-base leading-relaxed text-zinc-500">{sub}</p>
      </div>
      {preview}
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item.title} className="rounded-2xl bg-[var(--card)] p-4">
            <p className="text-base font-semibold tracking-tight">{item.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-500">{item.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PlusPreview() {
  return (
    <div
      className="flex items-center justify-center gap-3 rounded-2xl bg-[var(--card)] px-4 py-5"
      aria-hidden
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
        <IconPlus className="h-6 w-6" />
      </span>
      <p className="text-sm font-semibold text-zinc-500">Cargar un movimiento</p>
    </div>
  );
}

function PeriodPreview() {
  return (
    <div
      className="flex rounded-full bg-[var(--card-muted)] p-1"
      aria-hidden
    >
      <span className="flex-1 rounded-full bg-[var(--card)] px-4 py-2 text-center text-sm font-semibold text-zinc-900 shadow-sm dark:text-white">
        Mes
      </span>
      <span className="flex-1 rounded-full px-4 py-2 text-center text-sm font-semibold text-zinc-400">
        Año
      </span>
    </div>
  );
}
