"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFinance } from "@/context/FinanceContext";
import { SharedSetupSheet } from "@/components/SharedSetupSheet";
import { UserAvatar } from "@/components/UserAvatar";
import {
  MAX_HOUSEHOLDS_PER_USER,
  MAX_MEMBERS_PER_HOUSEHOLD,
} from "@/lib/household";

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
  const {
    configured,
    user,
    household,
    households,
    members,
    pendingInvites,
    setActiveHousehold,
    createGroup,
    createInvite,
    acceptInvite,
    revokeInvite,
    leaveGroup,
  } = useAuth();
  const { sharedEnabled, setSharedEnabled, refreshData } = useFinance();

  const [setupOpen, setSetupOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const paired = members.length > 1;
  const isOwner = household?.role === "owner";
  const canCreateGroup = households.length < MAX_HOUSEHOLDS_PER_USER;
  const canInvite =
    Boolean(household) &&
    isOwner &&
    members.length < MAX_MEMBERS_PER_HOUSEHOLD;
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

  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const result = await createGroup(newGroupName);
    setBusy(false);
    if (result.error) setError(result.error);
    else {
      setNewGroupName("");
      setMessage("Grupo creado");
      await refreshData();
    }
  }

  async function handleSelectGroup(id: string) {
    if (id === household?.id) return;
    setBusy(true);
    setError("");
    setInviteCode(null);
    const result = await setActiveHousehold(id);
    setBusy(false);
    if (result.error) setError(result.error);
  }

  async function handleCreateInvite() {
    setBusy(true);
    setError("");
    const result = await createInvite();
    setBusy(false);
    if (result.error) setError(result.error);
    else if (result.code) {
      setInviteCode(result.code);
      setMessage("Código listo. Vale 7 días.");
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const result = await acceptInvite(joinCode.trim());
    if (result.error) {
      setBusy(false);
      setError(result.error);
      return;
    }
    await setSharedEnabled(true);
    await refreshData();
    setMessage("Listo, ya estás en el grupo");
    setJoinCode("");
    setBusy(false);
  }

  async function handleRevoke(id: string) {
    setBusy(true);
    setError("");
    const result = await revokeInvite(id);
    setBusy(false);
    if (result.error) setError(result.error);
    else {
      setMessage("Invitación cancelada");
      if (inviteCode) setInviteCode(null);
    }
  }

  async function handleLeave() {
    if (!household) return;
    const lastMember = members.length <= 1;
    const ok = confirm(
      lastMember
        ? "¿Borrar este grupo? Se van los gastos compartidos de esta lista."
        : "¿Salir de este grupo? Dejás de ver esos gastos. Los otros grupos siguen igual.",
    );
    if (!ok) return;
    setBusy(true);
    setError("");
    const result = await leaveGroup(household.id);
    if (result.error) {
      setBusy(false);
      setError(result.error);
      return;
    }
    await refreshData();
    setInviteCode(null);
    setMessage(lastMember ? "Grupo borrado" : "Saliste del grupo");
    setBusy(false);
  }

  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
  const inviteLink = inviteCode ? `${siteUrl}/join/${inviteCode}` : null;

  return (
    <>
      <section className="bento space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold tracking-tight">Gastos con otros</p>
            <p className="meta mt-1 text-xs leading-relaxed">
              {households.length > 1
                ? "Cada grupo tiene su lista. El gasto resta solo de quien lo cargó."
                : paired
                  ? "El grupo ve la lista. El gasto resta solo de quien lo cargó."
                  : "Para anotar gastos de todos. Cada uno sigue con su plata."}
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

        {sharedEnabled && configured && households.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {households.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => void handleSelectGroup(h.id)}
                disabled={busy}
                className={`chip ${
                  h.id === household?.id ? "chip-active" : "chip-inactive"
                }`}
              >
                {h.name}
              </button>
            ))}
          </div>
        )}

        {sharedEnabled && (
          <SharedStatus
            configured={configured}
            paired={paired}
            householdName={household?.name}
            members={members}
            otherNames={otherNames}
            groupCount={households.length}
          />
        )}

        {sharedEnabled && configured && (
          <div className="space-y-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            {canCreateGroup && (
              <form onSubmit={(e) => void handleCreateGroup(e)} className="space-y-2">
                <p className="text-sm font-semibold">
                  {households.length === 0 ? "Crear un grupo" : "Otro grupo"}
                </p>
                <p className="text-xs text-zinc-500">
                  Casa, amigos, un viaje. Hasta {MAX_HOUSEHOLDS_PER_USER}.
                </p>
                <div className="flex gap-2">
                  <input
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="input-field flex-1"
                    placeholder="Ej: Casa"
                    maxLength={40}
                  />
                  <button type="submit" disabled={busy} className="btn-primary px-4">
                    Crear
                  </button>
                </div>
              </form>
            )}

            {canInvite && (
              <div className="space-y-3">
                <p className="text-sm font-semibold">Invitar</p>
                <p className="text-xs text-zinc-500">
                  El código dura 7 días. Hasta {MAX_MEMBERS_PER_HOUSEHOLD} personas
                  en el grupo.
                </p>
                <button
                  type="button"
                  onClick={() => void handleCreateInvite()}
                  disabled={busy}
                  className="btn-primary w-full text-sm"
                >
                  Crear código
                </button>
                {inviteCode && (
                  <div className="rounded-2xl bg-[var(--card-muted)] p-3 text-center">
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
                          Cancelar
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

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
                  Unirme
                </button>
              </form>
            </div>
          </div>
        )}

        {sharedEnabled && configured && household && (
          <button
            type="button"
            onClick={() => void handleLeave()}
            disabled={busy}
            className="w-full rounded-xl border border-zinc-200 py-2.5 text-sm text-zinc-600 dark:border-zinc-700"
          >
            {members.length <= 1 ? "Borrar este grupo" : "Salir de este grupo"}
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
  paired,
  householdName,
  members,
  otherNames,
  groupCount,
}: {
  configured: boolean;
  paired: boolean;
  householdName?: string;
  members: { userId: string; displayName: string; role: string }[];
  otherNames: string[];
  groupCount: number;
}) {
  if (!configured) {
    return (
      <p className="text-xs leading-relaxed text-zinc-400">
        Vas a ver la pestaña Compartido. Para invitar a alguien, primero entrá
        con tu email.
      </p>
    );
  }

  if (groupCount === 0) {
    return (
      <div className="rounded-2xl bg-[var(--card-muted)] px-3.5 py-3">
        <p className="text-sm font-semibold">Todavía no hay grupo</p>
        <p className="mt-1 text-xs leading-relaxed text-zinc-400">
          Creá uno o usá un código para unirte.
        </p>
      </div>
    );
  }

  if (!paired) {
    return (
      <div className="rounded-2xl bg-[var(--card-muted)] px-3.5 py-3">
        <p className="text-sm font-semibold">
          {householdName ? `${householdName}: falta alguien más` : "Falta alguien más"}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-zinc-400">
          Invitá o usá un código para compartir la lista.
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
          {householdName ? `${householdName} · ` : ""}
          Con {otherNames.filter(Boolean).join(", ") || "el grupo"}
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
