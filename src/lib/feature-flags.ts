/**
 * Feature flags para rollouts y testing local.
 *
 * Activá / apagá con variables NEXT_PUBLIC_FF_* en `.env.local`:
 *   NEXT_PUBLIC_FF_SKIP_AUTH=1
 *   NEXT_PUBLIC_FF_SAVINGS_GOALS=1
 *
 * Valores: 1/true/on/yes · 0/false/off/no
 * Sin variable: usa el default del flag.
 */

export const FEATURE_FLAG_NAMES = [
  "skipAuth",
  "savingsGoals",
] as const;

export type FeatureFlag = (typeof FEATURE_FLAG_NAMES)[number];

const FLAG_ENV: Record<FeatureFlag, string> = {
  skipAuth: "NEXT_PUBLIC_FF_SKIP_AUTH",
  savingsGoals: "NEXT_PUBLIC_FF_SAVINGS_GOALS",
};

/**
 * Defaults:
 * - skipAuth: off (solo a mano en local)
 * - savingsGoals: on (feature releaseada; apagá con NEXT_PUBLIC_FF_SAVINGS_GOALS=0)
 */
function defaultFor(flag: FeatureFlag): boolean {
  if (flag === "skipAuth") return false;
  if (flag === "savingsGoals") return true;
  return process.env.NODE_ENV === "development";
}

export function parseFeatureFlagValue(
  raw: string | undefined | null,
): boolean | null {
  if (raw == null) return null;
  const value = raw.trim().toLowerCase();
  if (!value) return null;
  if (value === "1" || value === "true" || value === "on" || value === "yes") {
    return true;
  }
  if (value === "0" || value === "false" || value === "off" || value === "no") {
    return false;
  }
  return null;
}

export function featureFlagEnvKey(flag: FeatureFlag): string {
  return FLAG_ENV[flag];
}

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  const parsed = parseFeatureFlagValue(process.env[FLAG_ENV[flag]]);
  if (parsed !== null) return parsed;
  return defaultFor(flag);
}

/** Snapshot útil para debug / tests. */
export function getFeatureFlags(): Record<FeatureFlag, boolean> {
  return {
    skipAuth: isFeatureEnabled("skipAuth"),
    savingsGoals: isFeatureEnabled("savingsGoals"),
  };
}

/**
 * Para sumar un flag nuevo:
 * 1. Agregalo a FEATURE_FLAG_NAMES y FLAG_ENV
 * 2. Documentalo en `.env.example`
 * 3. Gateá la UI/lógica con isFeatureEnabled("tuFlag")
 */
