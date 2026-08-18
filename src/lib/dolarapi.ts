export interface DolarApiQuote {
  moneda: string;
  casa: string;
  nombre: string;
  compra: number;
  venta: number;
  fechaActualizacion: string;
}

export interface LiveRates {
  usdToArs: number;
  updatedAt: string;
}

const BASE = "https://dolarapi.com/v1/dolares";

/** USD oficial (venta). */
export async function fetchLiveRatesFromApi(): Promise<LiveRates> {
  const res = await fetch(`${BASE}/oficial`, { next: { revalidate: 300 } });

  if (!res.ok) {
    throw new Error("No se pudo obtener el dólar oficial");
  }

  const oficial = (await res.json()) as DolarApiQuote;

  return parseOfficialRate(oficial);
}

export function parseOfficialRate(oficial: DolarApiQuote): LiveRates {
  return {
    usdToArs: oficial.venta,
    updatedAt: oficial.fechaActualizacion,
  };
}
