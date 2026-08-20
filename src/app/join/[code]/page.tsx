"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFinance } from "@/context/FinanceContext";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

export default function JoinPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const code = (params.code ?? "").toUpperCase();
  const { configured, loading, isAuthenticated, acceptInvite } = useAuth();
  const { setSharedEnabled, refreshData, ready } = useFinance();
  const [error, setError] = useState("");
  const startedForCode = useRef<string | null>(null);

  useEffect(() => {
    if (loading || !configured || !isAuthenticated || !ready) return;
    if (startedForCode.current === code) return;
    startedForCode.current = code;

    void acceptInvite(code).then(async (result) => {
      if (result.error) {
        setError(result.error);
        return;
      }
      await setSharedEnabled(true);
      await refreshData();
      router.replace("/compartido");
    });
  }, [
    loading,
    configured,
    isAuthenticated,
    ready,
    code,
    acceptInvite,
    setSharedEnabled,
    refreshData,
    router,
  ]);

  if (!configured) {
    return (
      <div className="card space-y-4 p-6 text-center text-sm text-zinc-500">
        Supabase no configurado.
        <Link href="/" className="block text-teal-600">
          Volver
        </Link>
      </div>
    );
  }

  if (loading || (isAuthenticated && !ready && !error)) {
    return <LoadingScreen variant="auth" />;
  }

  if (!isAuthenticated) {
    return (
      <div className="space-y-6 py-8">
        <div className="card space-y-3 p-6 text-center">
          <p className="text-3xl">🔗</p>
          <h1 className="text-lg font-bold">Te invitaron a compartir</h1>
          <p className="text-sm text-zinc-500">
            Código:{" "}
            <span className="font-mono font-semibold text-teal-600">{code}</span>
          </p>
          <p className="text-sm text-zinc-500">
            Entrá con tu email para unirte. Vas a ver los gastos compartidos; el
            saldo de cada persona sigue siendo propio.
          </p>
          <Link
            href={`/login?next=${encodeURIComponent(`/join/${code}`)}&reason=shared`}
            className="btn-primary inline-block px-6"
          >
            Entrar con email
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card space-y-4 p-6 text-center">
        <p className="font-medium text-red-500">{error}</p>
        <Link href="/cuenta" className="text-sm text-teal-600">
          Ir a Cuenta
        </Link>
      </div>
    );
  }

  return <LoadingScreen variant="auth" />;
}
