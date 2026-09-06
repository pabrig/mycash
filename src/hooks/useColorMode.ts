"use client";

import { useSyncExternalStore } from "react";
import {
  applyColorMode,
  COLOR_MODE_STORAGE_KEY,
  DEFAULT_COLOR_MODE,
  parseColorMode,
  persistColorMode,
  readStoredColorMode,
  resolveIsDark,
  type ColorMode,
} from "@/lib/color-mode";
import { syncThemeColorForMode } from "@/lib/brand-theme";

const LISTENERS = new Set<() => void>();

let cachedMode: ColorMode = DEFAULT_COLOR_MODE;
let hydrated = false;

function emit() {
  for (const listener of LISTENERS) listener();
}

function ensureHydrated() {
  if (hydrated || typeof window === "undefined") return;
  cachedMode = readStoredColorMode();
  hydrated = true;
}

function applyAll(mode: ColorMode) {
  applyColorMode(mode);
  syncThemeColorForMode(mode);
}

export function setColorMode(mode: ColorMode) {
  ensureHydrated();
  cachedMode = mode;
  persistColorMode(mode);
  applyAll(mode);
  emit();
}

function subscribe(listener: () => void) {
  ensureHydrated();
  LISTENERS.add(listener);
  // Reaplica tras hidratar: Next puede haber dejado theme-color claro del SSR.
  applyAll(cachedMode);

  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystem = () => {
    if (cachedMode !== "system") return;
    applyAll(cachedMode);
    emit();
  };
  mq.addEventListener("change", onSystem);

  const onStorage = (event: StorageEvent) => {
    if (event.key !== COLOR_MODE_STORAGE_KEY) return;
    cachedMode = parseColorMode(event.newValue) ?? DEFAULT_COLOR_MODE;
    applyAll(cachedMode);
    emit();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    LISTENERS.delete(listener);
    mq.removeEventListener("change", onSystem);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): ColorMode {
  ensureHydrated();
  return cachedMode;
}

function getServerSnapshot(): ColorMode {
  return DEFAULT_COLOR_MODE;
}

export function useColorMode() {
  const mode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { mode, setMode: setColorMode, isDark: resolveIsDark(mode) } as const;
}
