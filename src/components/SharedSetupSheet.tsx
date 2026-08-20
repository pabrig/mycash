"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFinance } from "@/context/FinanceContext";
import { DetailSheet } from "@/components/ui/DetailSheet";

export function SharedSetupSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { configured, isAuthenticated, signInWithEmail } = useAuth();
  const { setSharedEnabled } = useFinance();
  const [step, setStep] = useState<"explain" | "identity">("explain");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setStep("explain");
    setSent(false);
    setError("");
    setBusy(false);
  }, [open]);

  async function activateAndClose() {
    await setSharedEnabled(true);
    onClose();
  }

  async function handleContinue() {
    await setSharedEnabled(true);
    if (configured && !isAuthenticated) {
      setStep("identity");
      return;
    }
    onClose();
  }

  async function handleSendLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const result = await signInWithEmail(
      email.trim(),
      "/cuenta",
      name.trim() || undefined,
    );
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSent(true);
  }

  const title =
    step === "identity" ? "Tu usuario" : sent ? "Revisá tu mail" : "Cuenta compartida";

  return (
    <DetailSheet open={open} onClose={onClose} title={title}>
      {step === "explain" && (
        <div className="space-y-5 pb-2">
          <p className="text-sm leading-relaxed text-zinc-500">
            No es una cuenta en común. Cada persona tiene su propio disponible,
            y hay una lista que ve todo el grupo.
          </p>
          <ol className="space-y-3 text-sm">
            <Step
              n="1"
              title="Tu usuario"
              body="Entrá con tu email. Ese nombre es el que ven las demás personas cuando cargás un gasto."
            />
            <Step
              n="2"
              title="Armar el grupo"
              body="Generás un código o usás el de alguien. Recién ahí el grupo ve la misma lista."
            />
            <Step
              n="3"
              title="El saldo es individual"
              body="Si vos cargás un gasto compartido, resta de tu fondo. El resto lo ve, sin tocar el suyo."
            />
          </ol>
          <button type="button" onClick={() => void handleContinue()} className="btn-primary w-full">
            {configured && !isAuthenticated ? "Entendido — crear mi usuario" : "Activar compartido"}
          </button>
          {configured && !isAuthenticated && (
            <p className="text-center text-[11px] text-zinc-400">
              Sin entrar, los gastos quedan solo en este teléfono.
            </p>
          )}
        </div>
      )}

      {step === "identity" && !sent && (
        <form onSubmit={(e) => void handleSendLink(e)} className="space-y-4 pb-2">
          <p className="text-sm leading-relaxed text-zinc-500">
            Te mandamos un link al mail. Sin contraseña. Con eso queda creado tu
            usuario.
          </p>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">
              Tu nombre
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="Cómo te van a ver"
              maxLength={40}
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="tu@email.com"
            />
          </div>
          {error && <p className="text-sm text-rose-500">{error}</p>}
          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? "Enviando…" : "Enviar link"}
          </button>
          <button
            type="button"
            onClick={() => void activateAndClose()}
            className="block w-full py-2 text-center text-sm text-zinc-500"
          >
            Ahora no — solo en este teléfono
          </button>
        </form>
      )}

      {step === "identity" && sent && (
        <div className="space-y-4 py-4 text-center">
          <p className="text-3xl">📬</p>
          <p className="font-medium">Revisá tu email</p>
          <p className="text-sm text-zinc-500">
            Link enviado a <strong>{email}</strong>. Cuando entres, invitá a
            quien quieras desde Cuenta.
          </p>
          <button type="button" onClick={onClose} className="btn-primary w-full">
            Listo
          </button>
        </div>
      )}
    </DetailSheet>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-500/15 text-xs font-bold text-teal-700 dark:text-teal-300">
        {n}
      </span>
      <div>
        <p className="font-semibold tracking-tight">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">{body}</p>
      </div>
    </li>
  );
}
