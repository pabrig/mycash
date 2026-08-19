"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFinance } from "@/context/FinanceContext";

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

  return (
    <section className="bento space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold tracking-tight">Gastos compartidos</p>
          <p className="meta mt-1 text-xs leading-relaxed">
            Activá si querés cargar gastos del hogar con otra persona. Si solo
            llevás tus finanzas, dejalo apagado.
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
        <p className="text-xs leading-relaxed text-zinc-400">
          Aparece la pestaña Compartido y podés marcar gastos como del hogar.
          Cada integrante ve el monto completo en su disponible.
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
            ? " Los gastos compartidos cuentan como Cotidiano."
            : ""}
        </p>
      )}
    </section>
  );
}

export default function CuentaPage() {
  const {
    configured,
    isAuthenticated,
    user,
    profile,
    household,
    members,
    signOut,
    createInvite,
    acceptInvite,
  } = useAuth();
  const { cloudEnabled, sharedEnabled } = useFinance();

  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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
            <p className="text-xs text-emerald-600">
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
              </section>

              <section className="bento space-y-3 p-4">
                <p className="text-sm font-semibold">Invitar a vincular</p>
                <p className="text-xs text-zinc-500">
                  Generá un código para que tu pareja una su cuenta al mismo grupo.
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
                    <p className="text-2xl font-bold tracking-widest text-emerald-600">
                      {inviteCode}
                    </p>
                    {inviteLink && (
                      <p className="mt-2 break-all text-xs text-zinc-500">
                        {inviteLink}
                      </p>
                    )}
                  </div>
                )}
              </section>

              <section className="bento space-y-3 p-4">
                <p className="text-sm font-semibold">Unirme con código</p>
                <form onSubmit={handleJoin} className="flex gap-2">
                  <input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="input-field flex-1 uppercase"
                    placeholder="ABC12345"
                    maxLength={8}
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

          {message && <p className="text-sm text-emerald-600">{message}</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}

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
