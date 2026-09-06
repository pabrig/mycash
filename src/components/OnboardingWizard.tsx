"use client";

import { useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChoiceOption } from "@/components/ChoiceOption";
import { GuideFaq } from "@/components/GuideFaq";
import {
  IconCheck,
  IconChevronLeft,
  IconMyCash,
  IconPlus,
  IconSplit,
} from "@/components/ui/Icons";
import { useAuth } from "@/context/AuthContext";
import { useFinance } from "@/context/FinanceContext";
import {
  canContinueOnboarding,
  greetingName,
  HOWTO_GOALS,
  HOWTO_MOVEMENTS,
  HOWTO_PERIOD,
  HOWTO_SHARED,
  HOWTO_SPLIT,
  isSetupQuestionStep,
  MONEY_PROFILE_OPTIONS,
  onboardingSteps,
  resolvedWalletMode,
  setupSummaryLines,
  SHARED_FUNDING_OPTIONS,
  SHARED_SETUP_OPTIONS,
  WALLET_VIEW_OPTIONS,
  type OnboardingStep,
} from "@/lib/account-setup";
import { friendlyError } from "@/lib/errors";
import { isFeatureEnabled } from "@/lib/feature-flags";
import type { MoneyProfile } from "@/lib/money-profile";
import type { SharedFunding, WalletMode } from "@/lib/types";

export function OnboardingWizard() {
  const searchParams = useSearchParams();
  const guideOnly = searchParams.get("guia") === "1";

  if (guideOnly) {
    return <GuideFaq />;
  }

  return <SetupWizard />;
}

function SetupWizard() {
  const router = useRouter();
  const { profile, members } = useAuth();
  const { completeAccountSetup, sharedEnabled: financeShared } = useFinance();

  const askShared = members.length <= 1;
  const joinedGroup = members.length > 1;
  const name = greetingName(profile?.displayName);
  const includeGoalsHowTo = isFeatureEnabled("savingsGoals");

  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [moneyProfile, setMoneyProfile] = useState<MoneyProfile | null>(null);
  const [walletMode, setWalletMode] = useState<WalletMode | null>(null);
  const [sharedEnabled, setSharedEnabled] = useState<boolean | null>(
    joinedGroup ? true : null,
  );
  const [sharedFunding, setSharedFunding] = useState<SharedFunding | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const usesShared = joinedGroup || sharedEnabled === true;
  const steps = onboardingSteps({
    moneyProfile,
    askShared,
    sharedEnabled: usesShared ? true : sharedEnabled,
    showSharedHowTo: usesShared || financeShared,
    includeGoalsHowTo,
  });
  const current = steps.includes(step) ? step : (steps[0] ?? "welcome");
  const index = Math.max(0, steps.indexOf(current));
  const total = steps.length;
  const progress = (index + 1) / total;
  const canContinue = canContinueOnboarding(current, {
    moneyProfile,
    walletMode,
    sharedEnabled,
    sharedFunding,
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
        sharedEnabled: usesShared,
        sharedFunding: usesShared ? (sharedFunding ?? "payer") : "payer",
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
          <p className="text-sm font-semibold text-[var(--muted-fg)]">
            Paso {index + 1} de {total}
          </p>
          <span className="h-11 w-11" />
        </div>
        <div
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--card-muted)] dark:bg-[var(--card-muted)]"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={index + 1}
          aria-label={`Paso ${index + 1} de ${total}`}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
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
        ) : current === "shared_funding" ? (
          <SharedFundingStep
            selected={sharedFunding}
            onSelect={setSharedFunding}
          />
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
        ) : current === "howto_goals" ? (
          <HowToStep
            title={HOWTO_GOALS.title}
            sub={HOWTO_GOALS.sub}
            items={HOWTO_GOALS.items}
          />
        ) : current === "howto_split" ? (
          <HowToStep
            title={HOWTO_SPLIT.title}
            sub={HOWTO_SPLIT.sub}
            items={HOWTO_SPLIT.items}
            preview={<SplitPreview />}
          />
        ) : current === "howto_shared" ? (
          <HowToStep
            title={HOWTO_SHARED.title}
            sub={HOWTO_SHARED.sub}
            items={HOWTO_SHARED.items}
            preview={<GroupsPreview />}
          />
        ) : (
          <DoneStep
            name={name}
            lines={
              moneyProfile
                ? setupSummaryLines(
                    moneyProfile,
                    resolvedWalletMode(moneyProfile, walletMode),
                    usesShared,
                    usesShared ? (sharedFunding ?? "payer") : "payer",
                  )
                : []
            }
          />
        )}
      </div>

      <div className="sticky bottom-0 mt-8 space-y-3 bg-[var(--background)] pb-2 pt-3">
        {isSetupQuestionStep(current) ? (
          <p className="text-center text-sm text-[var(--muted-fg)]">
            Después lo podés cambiar en Cuenta.
          </p>
        ) : null}
        {error ? (
          <p className="text-center text-sm text-red-500">{error}</p>
        ) : null}
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
        <p className="mx-auto max-w-sm text-base leading-relaxed text-[var(--muted-fg)]">
          Primero acomodamos la app a cómo usás la plata. Después te mostramos
          cómo anotar, cómo mirar el mes y el año, las metas y cómo dividir una
          cuenta.
        </p>
      </div>
      <p className="text-sm leading-relaxed text-[var(--muted-fg)]">
        No hay respuestas incorrectas. Si más adelante cambia tu forma de
        manejar la plata, lo cambiás en Cuenta. Ahí también está la ayuda, tema
        por tema.
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
        <h1 className="text-2xl font-bold tracking-tight">
          ¿Cómo usás la plata?
        </h1>
        <p className="mt-2 text-base leading-relaxed text-[var(--muted-fg)]">
          Elegí lo que más se parece a tu día a día.
        </p>
      </div>
      <div
        className="space-y-2.5"
        role="radiogroup"
        aria-label="Cómo usás la plata"
      >
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
        <h1 className="text-2xl font-bold tracking-tight">
          ¿Cómo querés verla?
        </h1>
        <p className="mt-2 text-base leading-relaxed text-[var(--muted-fg)]">
          Esto no cambia tu plata. Solo cómo la ves en la pantalla.
        </p>
      </div>
      <div
        className="space-y-2.5"
        role="radiogroup"
        aria-label="Cómo querés verla"
      >
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

function SharedFundingStep({
  selected,
  onSelect,
}: {
  selected: SharedFunding | null;
  onSelect: (value: SharedFunding) => void;
}) {
  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          ¿De dónde salen los gastos del grupo?
        </h1>
        <p className="mt-2 text-base leading-relaxed text-[var(--muted-fg)]">
          Esto entra en tu mes, solo. Si después tenés más de un grupo, en
          Cuenta cada uno puede ser distinto.
        </p>
      </div>
      <div
        className="space-y-2.5"
        role="radiogroup"
        aria-label="De dónde salen los gastos del grupo"
      >
        {SHARED_FUNDING_OPTIONS.map((option) => (
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
        <p className="mt-2 text-base leading-relaxed text-[var(--muted-fg)]">
          Por ejemplo la casa, la pareja o un alquiler. Cada uno sigue viendo lo
          suyo.
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
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary">
        <IconCheck className="h-8 w-8" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          {name ? `Listo, ${name}` : "Listo"}
        </h1>
        <p className="mx-auto max-w-sm text-base leading-relaxed text-[var(--muted-fg)]">
          Ya podés anotar lo que entra y lo que sale.
        </p>
      </div>
      <ul className="mx-auto max-w-sm space-y-2 text-left">
        {lines.map((line) => (
          <li
            key={line}
            className="rounded-2xl bg-[var(--card)] px-4 py-3 text-sm leading-relaxed text-[var(--muted-fg)]"
          >
            {line}
          </li>
        ))}
      </ul>
      <p className="text-sm leading-relaxed text-[var(--muted-fg)]">
        Si cambia cómo manejás la plata, andá a Cuenta y lo cambiás. Ahí también
        está la ayuda, tema por tema.
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
        <p className="mt-2 text-base leading-relaxed text-[var(--muted-fg)]">
          {sub}
        </p>
      </div>
      {preview}
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item.title} className="rounded-2xl bg-[var(--card)] p-4">
            <p className="text-base font-semibold tracking-tight">
              {item.title}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--muted-fg)]">
              {item.body}
            </p>
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
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--cta)] text-[var(--cta-fg)]">
        <IconPlus className="h-6 w-6" />
      </span>
      <p className="text-sm font-semibold text-[var(--muted-fg)]">
        Cargar un movimiento
      </p>
    </div>
  );
}

function SplitPreview() {
  return (
    <div
      className="flex items-center justify-center gap-3 rounded-2xl bg-[var(--card)] px-4 py-5"
      aria-hidden
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--cta)] text-[var(--cta-fg)]">
        <IconSplit className="h-6 w-6" />
      </span>
      <p className="text-sm font-semibold text-[var(--muted-fg)]">Dividir</p>
    </div>
  );
}

function GroupsPreview() {
  return (
    <div
      className="flex flex-wrap gap-2 rounded-2xl bg-[var(--card)] px-4 py-4"
      aria-hidden
    >
      <span className="chip chip-active">Casa</span>
      <span className="chip chip-inactive">Amigos</span>
      <span className="chip chip-inactive">Viaje</span>
    </div>
  );
}

function PeriodPreview() {
  return (
    <div className="flex rounded-full bg-[var(--card-muted)] p-1" aria-hidden>
      <span className="flex-1 rounded-full bg-[var(--card)] px-4 py-2 text-center text-sm font-semibold text-[var(--foreground)] shadow-sm dark:text-white">
        Mes
      </span>
      <span className="flex-1 rounded-full px-4 py-2 text-center text-sm font-semibold text-[var(--muted-fg)]">
        Año
      </span>
    </div>
  );
}
