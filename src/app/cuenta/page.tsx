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
            Activá si cargás movimientos en USD, mirás montos en dólares o usás
            el bolsillo Ahorro. Si solo manejás pesos, dejalo apagado.
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
          Aparecen el toggle ARS/USD, la cotización oficial, cargar en dólares y
          la opción Dos bolsillos (Cotidiano + Ahorro USD).
        </p>
      ) : (
        <p className="text-xs leading-relaxed text-zinc-400">
          Todo queda en ARS. Los movimientos viejos en USD siguen contando
          convertidos al oficial; no podés cargar nuevos en dólares.
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
          Elegí si preferís un solo disponible o separar lo del día a día de lo
          que guardás.
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
            Un solo disponible. Ideal si convertís todo y querés ver el total de
            un vistazo.
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
            Cotidiano en ARS · Ahorro USD para lo que no tocás.
          </p>
        </button>
      </div>

      {walletMode === "split" && (
        <p className="text-xs leading-relaxed text-zinc-400">
          Myca$h lo ordena solo: lo que entra en ARS va a Cotidiano, lo que
          entra en USD a Ahorro USD.
          {sharedEnabled
            ? " Los gastos compartidos que cargás cuentan como Cotidiano."
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
        "¿Borrar tu cuenta y todos tus datos en la nube? Esta acción no se puede deshacer.",
      )
    ) {
      return;
    }
    if (!confirm("Confirmá: se eliminan movimientos personales y tu acceso.")) {
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
    setMessage("Export descargado");
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
          <p className="text-sm font-semibold">Datos</p>
          <button
            type="button"
            onClick={handleExport}
            className="w-full rounded-xl border border-zinc-200 py-2.5 text-sm dark:border-zinc-700"
          >
            Exportar JSON
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
