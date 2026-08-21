import type { WalletMode } from "./types";

/** Cómo usa la plata la cuenta. No es un campo persistido: se deriva de flags. */
export type MoneyProfile = "ars_only" | "ars_savings" | "dual";

export function resolveMoneyProfile(
  usdEnabled: boolean,
  walletMode: WalletMode,
): MoneyProfile {
  if (usdEnabled) return "dual";
  if (walletMode === "split") return "ars_savings";
  return "ars_only";
}

export function settingsForMoneyProfile(
  profile: MoneyProfile,
  currentWalletMode: WalletMode,
): { usdEnabled: boolean; walletMode: WalletMode } {
  switch (profile) {
    case "ars_only":
      return { usdEnabled: false, walletMode: "unified" };
    case "ars_savings":
      return { usdEnabled: false, walletMode: "split" };
    case "dual":
      return { usdEnabled: true, walletMode: currentWalletMode };
  }
}

/** Cotización visible si carga USD o si ahorra el sobrante en dólares. */
export function showOfficialRate(
  usdEnabled: boolean,
  walletMode: WalletMode,
): boolean {
  return usdEnabled || walletMode === "split";
}
