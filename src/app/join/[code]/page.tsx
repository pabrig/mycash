"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

export default function JoinPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const code = (params.code ?? "").toUpperCase();
  const { configured, loading, isAuthenticated, acceptInvite } = useAuth();
  const [status, setStatus] = useState<"idle" | "joining" | "done" | "error">(
    "idle",
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading || !configured || !isAuthenticated || status !== "idle") return;

    setStatus("joining");
    void acceptInvite(code).then((result) => {
      if (result.error) {
        setError(result.error);
        setStatus("error");
        return;
      }
      setStatus("done");
      router.replace("/compartido");
    });
  }, [loading, configured, isAuthenticated, code, acceptInvite, router, status]);

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

  if (loading || status === "joining") {
    return <LoadingScreen variant="auth" />;
  }

  if (!isAuthenticated) {
    return (
      <div className="space-y-6 py-8">
        <div className="card space-y-3 p-6 text-center">
          <p className="text-3xl">🔗</p>
          <h1 className="text-lg font-bold">Unirse al grupo</h1>
          <p className="text-sm text-zinc-500">
            Código:{" "}
            <span className="font-mono font-semibold text-teal-600">{code}</span>
          </p>
          <p className="text-sm text-zinc-500">
            Iniciá sesión para vincular tu cuenta.
          </p>
          <Link
            href={`/login?next=${encodeURIComponent(`/join/${code}`)}`}
            className="btn-primary inline-block px-6"
          >
            Entrar con email
          </Link>
        </div>
      </div>
    );
  }

  if (status === "error") {
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
