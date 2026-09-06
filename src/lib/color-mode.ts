/** Modo de color del usuario: claro, oscuro o seguir al sistema. */

export const COLOR_MODES = ["light", "dark", "system"] as const;

export type ColorMode = (typeof COLOR_MODES)[number];

export const DEFAULT_COLOR_MODE: ColorMode = "system";

export const COLOR_MODE_STORAGE_KEY = "mycash-color-mode";

export function isColorMode(value: string | null | undefined): value is ColorMode {
  return value === "light" || value === "dark" || value === "system";
}

export function parseColorMode(
  value: string | null | undefined,
): ColorMode | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return isColorMode(normalized) ? normalized : null;
}

export function systemPrefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

export function resolveIsDark(mode: ColorMode): boolean {
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return systemPrefersDark();
}

export function readStoredColorMode(): ColorMode {
  try {
    return parseColorMode(localStorage.getItem(COLOR_MODE_STORAGE_KEY)) ?? DEFAULT_COLOR_MODE;
  } catch {
    return DEFAULT_COLOR_MODE;
  }
}

export function persistColorMode(mode: ColorMode) {
  try {
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, mode);
  } catch {
    /* private mode */
  }
}

/** Aplica clase `.dark` en `<html>` según la preferencia. */
export function applyColorMode(mode: ColorMode) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", resolveIsDark(mode));
  document.documentElement.dataset.colorMode = mode;
}

export const COLOR_MODE_LABELS: Record<ColorMode, string> = {
  light: "Claro",
  dark: "Oscuro",
  system: "Sistema",
};
