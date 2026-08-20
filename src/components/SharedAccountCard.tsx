"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFinance } from "@/context/FinanceContext";
import { SharedSetupSheet } from "@/components/SharedSetupSheet";
import { UserAvatar } from "@/components/UserAvatar";

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

export function SharedAccountCard() {
  const { sharedEnabled, setSharedEnabled } = useFinance();
  const {
    configured,
    isAuthenticated,
    user,
    household,
    members,
    pendingInvites,
    createInvite,
    acceptInvite,
    revokeInvite,
    leaveCurrentHousehold,
  } = useAuth();

  const [setupOpen, setSetupOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const paired = members.length > 1;
  const otherNames = members
    .filter((m) => m.userId !== user?.id)
    .map((m) => m.displayName);

  async function handleToggle() {
    if (sharedEnabled) {
      await setSharedEnabled(false);
      return;
    }
    setSetupOpen(true);
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
      setMessage("Cuentas vinculadas");
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
        "¿Salir del grupo? Dejás de ver los gastos compartidos de las demás personas. Tus datos personales quedan.",
      )
    ) {
      return;
    }
    setBusy(true);
    setError("");
    const result = await leaveCurrentHousehold();
    setBusy(false);
    if (result.error) setError(result.error);
    else setMessage("Saliste del grupo");
  }

  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
  const inviteLink = inviteCode ? `${siteUrl}/join/${inviteCode}` : null;

  return (
    <>
      <section className="bento space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold tracking-tight">Cuenta compartida</p>
            <p className="meta mt-1 text-xs leading-relaxed">
              {paired
                ? "Lista que ve el grupo. El gasto resta solo de quien lo cargó."
                : "Gastos compartidos con otras personas. Cada una tiene su propio disponible."}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={sharedEnabled}
            onClick={() => void handleToggle()}
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
          <SharedStatus
            configured={configured}
            isAuthenticated={isAuthenticated}
            paired={paired}
            householdName={household?.name}
            members={members}
            otherNames={otherNames}
          />
        )}

        {sharedEnabled && configured && isAuthenticated && !paired && (
          <div className="space-y-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <p className="text-[11px] font-semibold tracking-wide text-zinc-400 uppercase">
              Paso siguiente · vincular
            </p>
            <div className="space-y-3">
              <p className="text-sm font-semibold">Invitar</p>
              <p className="text-xs text-zinc-500">
                Código de 12 caracteres, válido 7 días. Máximo 5 pendientes.
              </p>
              <button
                type="button"
                onClick={() => void handleCreateInvite()}
                disabled={busy}
                className="btn-primary w-full text-sm"
              >
                Generar código
              </button>
              {inviteCode && (
                <div className="rounded-2xl bg-[var(--card-muted)] p-3 text-center">
                  <p className="text-xl font-bold tracking-widest text-teal-600 sm:text-2xl">
                    {inviteCode}
                  </p>
                  {inviteLink && (
                    <p className="mt-2 break-all text-xs text-zinc-500">{inviteLink}</p>
                  )}
                </div>
              )}
              {pendingInvites.length > 0 && (
                <ul className="space-y-2">
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
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">Me invitaron</p>
              <form onSubmit={(e) => void handleJoin(e)} className="flex gap-2">
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="input-field flex-1 uppercase"
                  placeholder="ABCD1234EFGH"
                  maxLength={12}
                  autoComplete="off"
                />
                <button type="submit" disabled={busy} className="btn-primary px-4">
                  Unir
                </button>
              </form>
            </div>
          </div>
        )}

        {sharedEnabled && configured && isAuthenticated && paired && (
          <button
            type="button"
            onClick={() => void handleLeave()}
            disabled={busy}
            className="w-full rounded-xl border border-zinc-200 py-2.5 text-sm text-zinc-600 dark:border-zinc-700"
          >
            Salir del grupo
          </button>
        )}

        {message && <p className="text-sm text-teal-600">{message}</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}
      </section>

      <SharedSetupSheet open={setupOpen} onClose={() => setSetupOpen(false)} />
    </>
  );
}

function SharedStatus({
  configured,
  isAuthenticated,
  paired,
  householdName,
  members,
  otherNames,
}: {
  configured: boolean;
  isAuthenticated: boolean;
  paired: boolean;
  householdName?: string;
  members: { userId: string; displayName: string; role: string }[];
  otherNames: string[];
}) {
  if (!configured) {
    return (
      <p className="text-xs leading-relaxed text-zinc-400">
        Aparece la pestaña Compartido en este teléfono. Sin nube no se puede
        armar un grupo.
      </p>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-2xl bg-amber-500/10 px-3.5 py-3">
        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
          Falta tu usuario
        </p>
        <p className="mt-1 text-xs leading-relaxed text-amber-800/80 dark:text-amber-200/80">
          La pestaña ya está visible, pero lo que cargues queda solo acá. Entrá
          con tu email (arriba) para que el resto del grupo pueda verte.
        </p>
      </div>
    );
  }

  if (!paired) {
    return (
      <div className="rounded-2xl bg-[var(--card-muted)] px-3.5 py-3">
        <p className="text-sm font-semibold">Tu usuario está listo</p>
        <p className="mt-1 text-xs leading-relaxed text-zinc-400">
          Todavía no hay nadie más. Invitá o uníte con un código para ver la
          misma lista.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          {members.slice(0, 4).map((m, i) => (
            <UserAvatar key={m.userId} name={m.displayName} size="sm" tone={i} />
          ))}
        </div>
        <p className="text-sm font-semibold">
          Con {otherNames.filter(Boolean).join(", ") || householdName || "el grupo"}
        </p>
      </div>
      <ul className="space-y-1 text-sm text-zinc-600 dark:text-zinc-300">
        {members.map((m) => (
          <li key={m.userId} className="flex items-center justify-between gap-2">
            <span>{m.displayName}</span>
            {m.role === "owner" && (
              <span className="text-xs text-zinc-400">admin</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
