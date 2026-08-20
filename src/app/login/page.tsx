"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { safeNextPath } from "@/lib/movement-access";
import { IconMyCash } from "@/components/ui/Icons";

function loginCopy(next: string, reason: string | null) {
  if (next.startsWith("/join/")) {
    return {
      title: "Unirte al grupo",
      sub: "Entrá con tu email para unirte. Cada uno sigue viendo su propia plata.",
    };
  }
  if (reason === "shared" || next.startsWith("/compartido")) {
    return {
      title: "Unirte al grupo",
      sub: "Te mandamos un link al mail. Sin contraseña. Van a verte con el nombre que pongas.",
    };
  }
  return {
    title: "Entrá a Myca$h",
    sub: "Te mandamos un link al mail. Sin contraseña. Así ves tu plata en cualquier celular.",
  };
}

function authErrorCopy(code: string | null): string | null {
  if (code === "auth") return "El link expiró o no es válido. Pedí uno nuevo.";
  if (code === "supabase") return "No se puede entrar en esta instalación.";
  return null;
}

function LoginForm() {
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));
  const reason = searchParams.get("reason");
  const { configured, signInWithEmail } = useAuth();
  const copy = loginCopy(next, reason);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(authErrorCopy(searchParams.get("error")) ?? "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signInWithEmail(
      email.trim(),
      next,
      name.trim() || undefined,
    );
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setSent(true);
  }

  if (!configured) {
    return (
      <div className="space-y-4 py-8 text-center">
        <h1 className="text-lg font-bold">No se puede entrar</h1>
        <p className="text-sm text-zinc-500">
          Configurá Supabase en <code className="text-xs">.env.local</code>
        </p>
        <Link href="/" className="btn-primary inline-block px-6">
          Volver
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-8">
      <div className="text-center">
        <IconMyCash className="mx-auto h-12 w-12" />
        <h1 className="mt-4 text-xl font-bold">{copy.title}</h1>
        <p className="mt-1 text-sm text-zinc-500">{copy.sub}</p>
      </div>

      {sent ? (
        <div className="card space-y-3 p-5 text-center">
          <p className="font-medium">Revisá tu email</p>
          <p className="text-sm text-zinc-500">
            Te enviamos un link a <strong>{email}</strong>. Abrilo en este
            celular.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card space-y-4 p-5">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">
              Tu nombre
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="Cómo te van a ver"
              maxLength={40}
              autoComplete="name"
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
              autoComplete="email"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Enviando…" : "Enviar link al mail"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingScreen variant="auth" />}>
      <LoginForm />
    </Suspense>
  );
}
