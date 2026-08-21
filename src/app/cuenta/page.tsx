"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useFinance } from "@/context/FinanceContext";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { AccountIdentity } from "@/components/AccountIdentity";
import { SharedAccountCard } from "@/components/SharedAccountCard";
import {
  resolveMoneyProfile,
  settingsForMoneyProfile,
  type MoneyProfile,
} from "@/lib/money-profile";

const MONEY_PROFILES: {
  id: MoneyProfile;
  title: string;
  description: string;
}[] = [
  {
    id: "ars_only",
    title: "Solo pesos",
    description: "Ingresos y gastos en ARS. Un solo número.",
  },
  {
    id: "ars_savings",
    title: "Pesos, y ahorro en dólares",
    description:
      "Cobrás en pesos. A fin de mes pasás lo que te sobra a dólares. Si un mes lo necesitás, lo usás o lo volvés a pesos.",
  },
  {
    id: "dual",
    title: "Pesos y dólares",
    description: "Cargás ingresos y gastos en las dos monedas.",
  },
];

function ProfileOption({
  title,
  description,
  selected,
  onSelect,
}: {
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-2xl p-3.5 text-left transition-all active:scale-[0.99] ${
        selected
          ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
          : "bg-[var(--card-muted)]"
      }`}
    >
      <p className="text-sm font-semibold">{title}</p>
      <p
        className={`mt-0.5 text-xs leading-relaxed ${
          selected
            ? "text-white/70 dark:text-zinc-600"
            : "text-zinc-400"
        }`}
      >
        {description}
      </p>
    </button>
  );
}

function MoneySettings() {
  const {
    usdEnabled,
    setUsdEnabled,
    walletMode,
    setWalletMode,
    sharedEnabled,
  } = useFinance();
  const profile = resolveMoneyProfile(usdEnabled, walletMode);

  async function selectProfile(next: MoneyProfile) {
    const settings = settingsForMoneyProfile(next, walletMode);
    await setUsdEnabled(settings.usdEnabled);
    await setWalletMode(settings.walletMode);
  }

  return (
    <>
      <section className="bento space-y-4">
        <div>
          <p className="text-sm font-semibold tracking-tight">¿Cómo es tu plata?</p>
          <p className="meta mt-1 text-xs">
            Elegí cómo cobrás y si apartás dólares.
          </p>
        </div>

        <div className="space-y-2">
          {MONEY_PROFILES.map((option) => (
            <ProfileOption
              key={option.id}
              title={option.title}
              description={option.description}
              selected={profile === option.id}
              onSelect={() => void selectProfile(option.id)}
            />
          ))}
        </div>

        {profile === "ars_savings" && (
          <p className="text-xs leading-relaxed text-zinc-400">
            En inicio ves Diario (pesos) y Ahorro (dólares). No hace falta
            cargar ingresos en USD: pasás el sobrante, y si hace falta lo
            gastás del ahorro o lo volvés a diario.
          </p>
        )}
        {profile === "ars_only" && (
          <p className="text-xs leading-relaxed text-zinc-400">
            Todo queda en pesos. Lo que ya cargaste en dólares se sigue contando.
          </p>
        )}
      </section>

      {profile === "dual" && (
        <section className="bento space-y-4">
          <div>
            <p className="text-sm font-semibold tracking-tight">
              ¿Cómo querés verla?
            </p>
            <p className="meta mt-1 text-xs">
              Un número o dos bolsillos: día a día y ahorro.
            </p>
          </div>

          <div className="space-y-2">
            <ProfileOption
              title="Todo junto"
              description="Un solo número. Toda tu plata junta."
              selected={walletMode === "unified"}
              onSelect={() => void setWalletMode("unified")}
            />
            <ProfileOption
              title="Dos bolsillos"
              description="Diario en pesos. Ahorro en dólares, para lo que no tocás."
              selected={walletMode === "split"}
              onSelect={() => void setWalletMode("split")}
            />
          </div>

          {walletMode === "split" && (
            <p className="text-xs leading-relaxed text-zinc-400">
              Lo que entra en pesos va a Diario. Lo que entra en dólares, a
              Ahorro.
              {sharedEnabled
                ? " Los gastos con otros que cargás cuentan como Diario."
                : ""}
            </p>
          )}
        </section>
      )}
    </>
  );
}

export default function CuentaPage() {
  const {
    configured,
    loading,
    isAuthenticated,
    user,
    deleteAccount,
  } = useAuth();
  const { movements, rates, ready } = useFinance();
  const router = useRouter();

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!ready || (configured && loading)) {
    return <LoadingScreen variant="account" />;
  }

  async function handleDeleteAccount() {
    if (
      !confirm(
        "¿Borrar tu cuenta? Se borra todo y no se puede deshacer.",
      )
    ) {
      return;
    }
    if (!confirm("¿Seguro? Se borran tus gastos, ingresos y el acceso.")) {
      return;
    }
    setBusy(true);
    setError("");
    const result = await deleteAccount();
    setBusy(false);
    if (result.error) setError(result.error);
    else router.replace("/login");
  }

  function handleExport() {
    const payload = {
      exportedAt: new Date().toISOString(),
      email: user?.email ?? null,
      movements,
      rates,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mycash-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage("Listo, se descargó");
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-5 pb-4 md:max-w-2xl md:pt-2">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--card)] text-lg active:scale-95 md:hidden"
        >
          ‹
        </Link>
        <h1 className="text-lg font-bold md:text-2xl">Cuenta</h1>
      </div>

      <AccountIdentity />
      <SharedAccountCard />
      <MoneySettings />

      {isAuthenticated && (
        <section className="bento space-y-3 p-4">
          <p className="text-sm font-semibold">Tus datos</p>
          <button
            type="button"
            onClick={handleExport}
            className="w-full rounded-xl border border-zinc-200 py-2.5 text-sm dark:border-zinc-700"
          >
            Descargar mis datos
          </button>
          <button
            type="button"
            onClick={() => void handleDeleteAccount()}
            disabled={busy}
            className="w-full rounded-xl border border-red-200 py-2.5 text-sm text-red-600 dark:border-red-900/50"
          >
            Borrar cuenta
          </button>
        </section>
      )}

      {message && <p className="text-sm text-teal-600">{message}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
