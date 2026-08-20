"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useFinance } from "@/context/FinanceContext";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { AccountIdentity } from "@/components/AccountIdentity";
import { SharedAccountCard } from "@/components/SharedAccountCard";

function UsdSettings() {
  const { usdEnabled, setUsdEnabled } = useFinance();

  return (
    <section className="bento space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold tracking-tight">Dólares (USD)</p>
          <p className="meta mt-1 text-xs leading-relaxed">
            Activá si usás dólares. Si solo usás pesos, dejalo apagado.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={usdEnabled}
          onClick={() => void setUsdEnabled(!usdEnabled)}
          className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors ${
            usdEnabled
              ? "bg-zinc-900 dark:bg-white"
              : "bg-zinc-200 dark:bg-zinc-700"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform dark:bg-zinc-900 ${
              usdEnabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
      {usdEnabled ? (
        <p className="text-xs leading-relaxed text-zinc-400">
          Vas a poder ver en dólares, cargar en USD y usar dos bolsillos.
        </p>
      ) : (
        <p className="text-xs leading-relaxed text-zinc-400">
          Todo queda en pesos. Lo que ya cargaste en dólares se sigue contando.
        </p>
      )}
    </section>
  );
}

function WalletSettings() {
  const { walletMode, setWalletMode, sharedEnabled, usdEnabled } = useFinance();

  if (!usdEnabled) return null;

  return (
    <section className="bento space-y-4">
      <div>
        <p className="text-sm font-semibold tracking-tight">¿Cómo querés ver tu plata?</p>
        <p className="meta mt-1 text-xs">
          Un número o dos bolsillos: día a día y ahorro.
        </p>
      </div>

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => void setWalletMode("unified")}
          className={`w-full rounded-2xl p-3.5 text-left transition-all active:scale-[0.99] ${
            walletMode === "unified"
              ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
              : "bg-[var(--card-muted)]"
          }`}
        >
          <p className="text-sm font-semibold">Todo junto</p>
          <p
            className={`mt-0.5 text-xs leading-relaxed ${
              walletMode === "unified"
                ? "text-white/70 dark:text-zinc-600"
                : "text-zinc-400"
            }`}
          >
            Un solo número. Toda tu plata junta.
          </p>
        </button>

        <button
          type="button"
          onClick={() => void setWalletMode("split")}
          className={`w-full rounded-2xl p-3.5 text-left transition-all active:scale-[0.99] ${
            walletMode === "split"
              ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
              : "bg-[var(--card-muted)]"
          }`}
        >
          <p className="text-sm font-semibold">Dos bolsillos</p>
          <p
            className={`mt-0.5 text-xs leading-relaxed ${
              walletMode === "split"
                ? "text-white/70 dark:text-zinc-600"
                : "text-zinc-400"
            }`}
          >
            Cotidiano en pesos. Ahorro en dólares, para lo que no tocás.
          </p>
        </button>
      </div>

      {walletMode === "split" && (
        <p className="text-xs leading-relaxed text-zinc-400">
          Lo que entra en pesos va a Cotidiano. Lo que entra en dólares, a Ahorro.
          {sharedEnabled
            ? " Los gastos con otros que cargás cuentan como Cotidiano."
            : ""}
        </p>
      )}
    </section>
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
      <UsdSettings />
      <WalletSettings />

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
