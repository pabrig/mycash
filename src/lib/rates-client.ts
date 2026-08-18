"use client";

import type { LiveRates } from "@/lib/dolarapi";

export async function fetchLiveRatesClient(): Promise<LiveRates> {
  const res = await fetch("/api/cotizacion", { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo obtener el dólar oficial");
  return res.json() as Promise<LiveRates>;
}
