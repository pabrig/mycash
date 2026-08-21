"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useFinance } from "@/context/FinanceContext";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { AccountIdentity } from "@/components/AccountIdentity";
import { SharedAccountCard } from "@/components/SharedAccountCard";
import { MoneySettings } from "@/components/MoneySettings";

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
