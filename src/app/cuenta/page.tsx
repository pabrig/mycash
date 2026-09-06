"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useFinance } from "@/context/FinanceContext";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { AccountIdentity } from "@/components/AccountIdentity";
import { ColorModeToggle } from "@/components/ColorModeToggle";
import { SharedAccountCard } from "@/components/SharedAccountCard";
import { MoneySettings } from "@/components/MoneySettings";
import { ExportStatementSheet } from "@/components/ExportStatementSheet";
import { downloadBlob } from "@/lib/download";

export default function CuentaPage() {
  const { configured, loading, isAuthenticated, user, deleteAccount } =
    useAuth();
  const { movements, rates, ready } = useFinance();
  const router = useRouter();

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  if (!ready || (configured && loading)) {
    return <LoadingScreen variant="account" />;
  }

  async function handleDeleteAccount() {
    if (!confirm("¿Borrar tu cuenta? Se borra todo y no se puede deshacer.")) {
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

  function handleBackup() {
    const payload = {
      exportedAt: new Date().toISOString(),
      email: user?.email ?? null,
      movements,
      rates,
    };
    downloadBlob(
      new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      }),
      `mycash-export-${new Date().toISOString().slice(0, 10)}.json`,
    );
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
      <ColorModeToggle />
      <MoneySettings />
      <SharedAccountCard />

      <section className="bento space-y-3 p-4">
        <p className="text-sm font-semibold">Tus datos</p>
        <p className="text-xs leading-relaxed text-[var(--muted-fg)]">
          {isAuthenticated
            ? "El resumen es para imprimir o abrir en Excel. La copia JSON guarda todo, por las dudas."
            : "Un archivo para imprimir o abrir en Excel, con el mes o el año."}
        </p>
        <button
          type="button"
          onClick={() => setExportOpen(true)}
          className="w-full rounded-xl border border-[var(--card-border)] py-2.5 text-sm dark:border-[var(--card-border)]"
        >
          Descargar resumen
        </button>
        {isAuthenticated && (
          <>
            <button
              type="button"
              onClick={handleBackup}
              className="w-full rounded-xl border border-[var(--card-border)] py-2.5 text-sm dark:border-[var(--card-border)]"
            >
              Descargar copia JSON
            </button>
            <button
              type="button"
              onClick={() => void handleDeleteAccount()}
              disabled={busy}
              className="w-full rounded-xl border border-red-200 py-2.5 text-sm text-red-600 dark:border-red-900/50"
            >
              Borrar cuenta
            </button>
          </>
        )}
      </section>

      {message && <p className="text-sm text-primary">{message}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      <ExportStatementSheet
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        initialScope="month"
      />
    </div>
  );
}
