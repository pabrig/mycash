import type { DisplayCurrency, MonthlyRate, Movement, WalletMode } from "./types";
import { getDefaultRate } from "./currency";

const MOVEMENTS_KEY = "mycash_movements";
const RATES_KEY = "mycash_rates";
const DISPLAY_KEY = "mycash_display";
const WALLET_MODE_KEY = "mycash_wallet_mode";
const SHARED_ENABLED_KEY = "mycash_shared_enabled";
const USD_ENABLED_KEY = "mycash_usd_enabled";
const AMOUNTS_HIDDEN_KEY = "mycash_amounts_hidden";

const LEGACY_KEYS = [
  ["pagapp_movements", MOVEMENTS_KEY],
  ["pagapp_rates", RATES_KEY],
  ["pagapp_display", DISPLAY_KEY],
  ["miplata_movements", MOVEMENTS_KEY],
  ["miplata_rates", RATES_KEY],
  ["miplata_display", DISPLAY_KEY],
] as const;

function migrateLegacyStorage(): void {
  if (typeof window === "undefined") return;

  for (const [legacy, current] of LEGACY_KEYS) {
    const legacyValue = localStorage.getItem(legacy);
    if (legacyValue !== null && localStorage.getItem(current) === null) {
      localStorage.setItem(current, legacyValue);
    }
    if (legacyValue !== null) {
      localStorage.removeItem(legacy);
    }
  }
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  migrateLegacyStorage();
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadMovements(): Movement[] {
  const movements = readJson<
    Array<Omit<Movement, "currency"> & { currency: string }>
  >(MOVEMENTS_KEY, []);
  return movements.map((m) => ({
    ...m,
    currency: m.currency === "USDT" ? "USD" : (m.currency as Movement["currency"]),
  }));
}

export function saveMovements(movements: Movement[]): void {
  writeJson(MOVEMENTS_KEY, movements);
}

export function loadRates(): MonthlyRate[] {
  const rates = readJson<Array<MonthlyRate & { usdtToArs?: number }>>(
    RATES_KEY,
    [],
  );
  return rates.map(({ year, month, usdToArs, updatedAt }) => ({
    year,
    month,
    usdToArs,
    updatedAt,
  }));
}

export function saveRates(rates: MonthlyRate[]): void {
  writeJson(RATES_KEY, rates);
}

export function getRateForMonth(
  rates: MonthlyRate[],
  year: number,
  month: number,
): MonthlyRate {
  return (
    rates.find((r) => r.year === year && r.month === month) ??
    getDefaultRate(year, month)
  );
}

export function loadDisplayCurrency(): DisplayCurrency {
  if (typeof window === "undefined") return "ARS";
  migrateLegacyStorage();
  const raw = localStorage.getItem(DISPLAY_KEY);
  return raw === "USD" ? "USD" : "ARS";
}

export function saveDisplayCurrency(currency: DisplayCurrency): void {
  localStorage.setItem(DISPLAY_KEY, currency);
}

export function loadWalletMode(): WalletMode {
  if (typeof window === "undefined") return "unified";
  migrateLegacyStorage();
  const raw = localStorage.getItem(WALLET_MODE_KEY);
  return raw === "split" ? "split" : "unified";
}

export function saveWalletMode(mode: WalletMode): void {
  localStorage.setItem(WALLET_MODE_KEY, mode);
}

export function loadSharedEnabled(): boolean {
  if (typeof window === "undefined") return false;
  migrateLegacyStorage();
  return localStorage.getItem(SHARED_ENABLED_KEY) === "true";
}

export function saveSharedEnabled(enabled: boolean): void {
  localStorage.setItem(SHARED_ENABLED_KEY, enabled ? "true" : "false");
}

/** Default true: no romper UX de quien ya usa USD / bolsillos. */
export function loadUsdEnabled(): boolean {
  if (typeof window === "undefined") return true;
  migrateLegacyStorage();
  const raw = localStorage.getItem(USD_ENABLED_KEY);
  if (raw === null) return true;
  return raw === "true";
}

export function saveUsdEnabled(enabled: boolean): void {
  localStorage.setItem(USD_ENABLED_KEY, enabled ? "true" : "false");
}

/** Solo este dispositivo — útil en un lugar público. */
export function loadAmountsHidden(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(AMOUNTS_HIDDEN_KEY) === "true";
}

export function saveAmountsHidden(hidden: boolean): void {
  localStorage.setItem(AMOUNTS_HIDDEN_KEY, hidden ? "true" : "false");
}
