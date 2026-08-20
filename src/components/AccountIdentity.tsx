"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";

export function AccountIdentity() {
  const {
    configured,
    isAuthenticated,
    user,
    profile,
    signOut,
    updateDisplayName,
  } = useAuth();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile?.displayName ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!configured) {
    return (
      <section className="bento space-y-2">
        <p className="text-sm font-semibold tracking-tight">Tu usuario</p>
        <p className="text-xs leading-relaxed text-zinc-400">
          Esta app guarda todo en este celular.
        </p>
      </section>
    );
  }

  if (!isAuthenticated) {
    return (
      <section className="bento space-y-4">
        <div>
          <p className="text-sm font-semibold tracking-tight">Tu usuario</p>
          <p className="meta mt-1 text-xs leading-relaxed">
            Estás en este celular, sin entrar. Entrá con tu email para ver tu
            plata en cualquier lado.
          </p>
        </div>
        <Link href="/login?reason=account" className="btn-primary block text-center text-sm">
          Entrar con email
        </Link>
        <p className="text-[11px] leading-relaxed text-zinc-400">
          Te mandamos un link al mail. Sin contraseña.
        </p>
      </section>
    );
  }

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const result = await updateDisplayName(name);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setEditing(false);
  }

  return (
    <section className="bento space-y-4">
      <div className="flex items-start gap-3">
        <UserAvatar name={profile?.displayName} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold tracking-wide text-zinc-400 uppercase">
            Tu usuario
          </p>
          {editing ? (
            <form onSubmit={(e) => void handleSaveName(e)} className="mt-2 space-y-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder="Cómo te van a ver"
                autoFocus
                maxLength={40}
              />
              {error && <p className="text-xs text-rose-500">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={busy || !name.trim()}
                  className="btn-primary flex-1 py-2.5 text-sm"
                >
                  {busy ? "Guardando…" : "Guardar"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setName(profile?.displayName ?? "");
                    setError("");
                  }}
                  className="flex-1 rounded-2xl bg-[var(--card-muted)] py-2.5 text-sm font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <>
              <p className="mt-0.5 truncate text-lg font-bold tracking-tight">
                {profile?.displayName || "Usuario"}
              </p>
              <p className="truncate text-sm text-zinc-500">{user?.email}</p>
              <button
                type="button"
                onClick={() => {
                  setName(profile?.displayName ?? "");
                  setEditing(true);
                }}
                className="mt-1 text-xs font-semibold text-teal-700 dark:text-teal-400"
              >
                Cambiar nombre
              </button>
            </>
          )}
        </div>
      </div>
      <p className="text-xs text-teal-600 dark:text-teal-400">
        Estás adentro. Tu plata se guarda en la nube.
      </p>
      <button
        type="button"
        onClick={() => {
          void signOut().then(() => router.replace("/login"));
        }}
        className="w-full rounded-xl border border-zinc-200 py-2.5 text-sm text-zinc-600 dark:border-zinc-700"
      >
        Cerrar sesión
      </button>
    </section>
  );
}
