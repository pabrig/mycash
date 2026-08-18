"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useAuth } from "@/context/AuthContext";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const { configured, signInWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signInWithEmail(email.trim(), next);
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
        <h1 className="text-lg font-bold">Login no disponible</h1>
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
        <h1 className="text-xl font-bold">Entrar a Myca$h</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Magic link por email — sin contraseña
        </p>
      </div>

      {sent ? (
        <div className="card space-y-3 p-5 text-center">
          <p className="text-3xl">📬</p>
          <p className="font-medium">Revisá tu email</p>
          <p className="text-sm text-zinc-500">
            Te enviamos un link a <strong>{email}</strong>
          </p>
          <Link href="/" className="text-sm text-emerald-600">
            Volver al inicio
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card space-y-4 p-5">
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
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Enviando…" : "Enviar magic link"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="py-8 text-center text-sm text-zinc-500">Cargando…</p>}>
      <LoginForm />
    </Suspense>
  );
}
