import type { DisplayCurrency, MonthlyRate, Movement, WalletMode } from "./types";
import type { SplitEvent, SplitExpense, SplitPerson } from "./split-bill";
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

const SPLIT_EVENTS_KEY = "mycash_split_events";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseSplitPerson(raw: unknown): SplitPerson | null {
  if (!isRecord(raw) || typeof raw.id !== "string") return null;
  return {
    id: raw.id,
    name: typeof raw.name === "string" ? raw.name : "",
    isMe: raw.isMe === true,
  };
}

function parseSplitExpense(raw: unknown): SplitExpense | null {
  if (!isRecord(raw) || typeof raw.id !== "string") return null;
  const amount = typeof raw.amount === "number" ? raw.amount : Number(raw.amount);
  if (!Number.isFinite(amount)) return null;
  return {
    id: raw.id,
    date: typeof raw.date === "string" ? raw.date : "",
    description: typeof raw.description === "string" ? raw.description : "",
    amount,
    paidById: typeof raw.paidById === "string" ? raw.paidById : "",
  };
}

function parseSplitEvent(raw: unknown): SplitEvent | null {
  if (!isRecord(raw) || typeof raw.id !== "string") return null;
  const people = Array.isArray(raw.people)
    ? raw.people.map(parseSplitPerson).filter((p): p is SplitPerson => p !== null)
    : [];
  const expenses = Array.isArray(raw.expenses)
    ? raw.expenses
        .map(parseSplitExpense)
        .filter((e): e is SplitExpense => e !== null)
    : [];
  return {
    id: raw.id,
    title: typeof raw.title === "string" ? raw.title : "",
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : "",
    startDate: typeof raw.startDate === "string" ? raw.startDate : undefined,
    endDate: typeof raw.endDate === "string" ? raw.endDate : undefined,
    people,
    expenses,
  };
}

export function loadSplitEvents(): SplitEvent[] {
  const raw = readJson<unknown>(SPLIT_EVENTS_KEY, []);
  if (!Array.isArray(raw)) return [];
  return raw
    .map(parseSplitEvent)
    .filter((event): event is SplitEvent => event !== null);
}

export function saveSplitEvents(events: SplitEvent[]): void {
  writeJson(SPLIT_EVENTS_KEY, events);
}

const SYNCED_KEYS = [
  MOVEMENTS_KEY,
  RATES_KEY,
  DISPLAY_KEY,
  WALLET_MODE_KEY,
  SHARED_ENABLED_KEY,
  USD_ENABLED_KEY,
] as const;

/** Snapshot para migrar a la nube en el primer login. */
export function loadLocalSnapshot() {
  return {
    movements: loadMovements(),
    rates: loadRates(),
    displayCurrency: loadDisplayCurrency(),
    walletMode: loadWalletMode(),
    sharedEnabled: loadSharedEnabled(),
    usdEnabled: loadUsdEnabled(),
  };
}

/** Tras sync ok o al cerrar sesión: la nube es la fuente de verdad. */
export function clearSyncedLocalFinance(): void {
  if (typeof window === "undefined") return;
  migrateLegacyStorage();
  for (const key of SYNCED_KEYS) {
    localStorage.removeItem(key);
  }
}
