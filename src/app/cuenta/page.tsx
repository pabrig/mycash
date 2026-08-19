"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFinance } from "@/context/FinanceContext";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

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

function SharedSettings() {
  const { sharedEnabled, setSharedEnabled } = useFinance();
  const { isAuthenticated } = useAuth();

  return (
    <section className="bento space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold tracking-tight">Gastos compartidos</p>
          <p className="meta mt-1 text-xs leading-relaxed">
            Activá si querés cargar gastos del hogar con otra persona. Tu pareja
            verá descripción y monto de lo marcado como compartido — no tus
            ingresos ni gastos personales.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={sharedEnabled}
          onClick={() => void setSharedEnabled(!sharedEnabled)}
          className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors ${
            sharedEnabled
              ? "bg-zinc-900 dark:bg-white"
              : "bg-zinc-200 dark:bg-zinc-700"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform dark:bg-zinc-900 ${
              sharedEnabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
      {sharedEnabled && (
        <div className="space-y-2 text-xs leading-relaxed text-zinc-400">
          <p>
            Aparece la pestaña Compartido. Cada integrante ve el monto completo
            en su disponible.
          </p>
          {isAuthenticated ? (
            <p className="font-medium text-zinc-600 dark:text-zinc-300">
              Siguiente paso: generá un código o uníte con el de tu pareja más
              abajo.
            </p>
          ) : (
            <p className="font-medium text-zinc-600 dark:text-zinc-300">
              Iniciá sesión para invitar o unirte al grupo.
            </p>
          )}
        </div>
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
            ? " Los gastos compartidos cuentan como Cotidiano."
            : ""}
        </p>
      )}
    </section>
  );
}

function formatExpiry(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-AR", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return "";
  }
}

export default function CuentaPage() {
  const {
    configured,
    loading,
    isAuthenticated,
    user,
    profile,
    household,
    members,
    pendingInvites,
    signOut,
    createInvite,
    acceptInvite,
    revokeInvite,
    leaveCurrentHousehold,
    deleteAccount,
  } = useAuth();
  const { cloudEnabled, sharedEnabled, movements, rates, ready } = useFinance();

  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const inSharedGroup = members.length > 1;

  if (!ready || (configured && loading)) {
    return <LoadingScreen variant="account" />;
  }

  async function handleCreateInvite() {
    setBusy(true);
    setError("");
    const result = await createInvite();
    setBusy(false);
    if (result.error) setError(result.error);
    else if (result.code) {
      setInviteCode(result.code);
      setMessage("Código generado — válido 7 días");
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const result = await acceptInvite(joinCode.trim());
    setBusy(false);
    if (result.error) setError(result.error);
    else {
      setMessage("¡Cuentas vinculadas!");
      setJoinCode("");
    }
  }

  async function handleRevoke(id: string) {
    setBusy(true);
    setError("");
    const result = await revokeInvite(id);
    setBusy(false);
    if (result.error) setError(result.error);
    else {
      setMessage("Invitación revocada");
      if (inviteCode) setInviteCode(null);
    }
  }

  async function handleLeave() {
    if (
      !confirm(
        "¿Salir del grupo? Dejás de ver los gastos compartidos. Tus datos personales quedan.",
      )
    ) {
      return;
    }
    setBusy(true);
    setError("");
    const result = await leaveCurrentHousehold();
    setBusy(false);
    if (result.error) setError(result.error);
    else setMessage("Saliste del grupo — tenés un hogar solo de nuevo");
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

  const siteUrl =
    typeof window !== "undefined" ? window.location.origin : "";
  const inviteLink = inviteCode ? `${siteUrl}/join/${inviteCode}` : null;

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

      <UsdSettings />
      <WalletSettings />
      <SharedSettings />

      {!configured && (
        <div className="bento p-4 text-sm text-zinc-500">
          Sync en la nube no configurado — la app funciona en modo local.
        </div>
      )}

      {configured && !isAuthenticated && (
        <div className="bento space-y-4 p-6 text-center">
          <p className="font-medium">
            {sharedEnabled
              ? "Iniciá sesión para sync y gastos compartidos"
              : "Iniciá sesión para sincronizar tus movimientos"}
          </p>
          <Link href="/login" className="btn-primary inline-block px-6">
            Entrar
          </Link>
        </div>
      )}

      {configured && isAuthenticated && (
        <>
          <section className="bento space-y-2 p-4">
            <p className="text-xs text-zinc-400">Usuario</p>
            <p className="font-medium">{profile?.displayName ?? "Usuario"}</p>
            <p className="text-sm text-zinc-500">{user?.email}</p>
            <p className="text-xs text-teal-600">
              {cloudEnabled ? "Sync en la nube activo" : "Sincronizando…"}
            </p>
          </section>

          {sharedEnabled && (
            <>
              <section className="bento space-y-3 p-4">
                <p className="text-sm font-semibold">Grupo compartido</p>
                <p className="text-lg">{household?.name ?? "—"}</p>
                <ul className="space-y-1 text-sm text-zinc-600 dark:text-zinc-300">
                  {members.map((m) => (
                    <li key={m.userId}>
                      {m.displayName}
                      {m.role === "owner" && (
                        <span className="ml-1 text-xs text-zinc-400">· admin</span>
                      )}
                    </li>
                  ))}
                </ul>
                {inSharedGroup && (
                  <button
                    type="button"
                    onClick={() => void handleLeave()}
                    disabled={busy}
                    className="w-full rounded-xl border border-zinc-200 py-2.5 text-sm text-zinc-600 dark:border-zinc-700"
                  >
                    Salir del grupo
                  </button>
                )}
              </section>

              <section className="bento space-y-3 p-4">
                <p className="text-sm font-semibold">Invitar a vincular</p>
                <p className="text-xs text-zinc-500">
                  Código de 12 caracteres, válido 7 días. Máximo 5 pendientes.
                </p>
                <button
                  type="button"
                  onClick={() => void handleCreateInvite()}
                  disabled={busy}
                  className="btn-primary w-full"
                >
                  Generar código
                </button>
                {inviteCode && (
                  <div className="rounded-xl bg-zinc-50 p-3 text-center dark:bg-zinc-800/50">
                    <p className="text-xl font-bold tracking-widest text-teal-600 sm:text-2xl">
                      {inviteCode}
                    </p>
                    {inviteLink && (
                      <p className="mt-2 break-all text-xs text-zinc-500">
                        {inviteLink}
                      </p>
                    )}
                  </div>
                )}
                {pendingInvites.length > 0 && (
                  <ul className="space-y-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                    {pendingInvites.map((inv) => (
                      <li
                        key={inv.id}
                        className="flex items-center justify-between gap-2 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="font-mono tracking-wider">{inv.code}</p>
                          <p className="text-xs text-zinc-400">
                            vence {formatExpiry(inv.expiresAt)}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleRevoke(inv.id)}
                          className="shrink-0 text-xs text-red-500"
                        >
                          Revocar
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="bento space-y-3 p-4">
                <p className="text-sm font-semibold">Unirme con código</p>
                <form onSubmit={handleJoin} className="flex gap-2">
                  <input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="input-field flex-1 uppercase"
                    placeholder="ABCD1234EFGH"
                    maxLength={12}
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="btn-primary px-4"
                  >
                    Unir
                  </button>
                </form>
              </section>
            </>
          )}

          {message && <p className="text-sm text-teal-600">{message}</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}

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

          <button
            type="button"
            onClick={() => void signOut()}
            className="w-full rounded-xl border border-zinc-200 py-3 text-sm text-zinc-600 dark:border-zinc-700"
          >
            Cerrar sesión
          </button>
        </>
      )}
    </div>
  );
}
