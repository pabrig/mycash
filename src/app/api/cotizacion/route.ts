import { NextResponse } from "next/server";
import { fetchLiveRatesFromApi } from "@/lib/dolarapi";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rates = await fetchLiveRatesFromApi();
    return NextResponse.json(rates);
  } catch {
    return NextResponse.json(
      { error: "No se pudo obtener el dólar oficial" },
      { status: 502 },
    );
  }
}
