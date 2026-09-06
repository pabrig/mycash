/** Marca Ciruela — `data-theme="indigo"`, primary `#6d28d9`. */

import {
  COLOR_MODE_STORAGE_KEY,
  DEFAULT_COLOR_MODE,
  parseColorMode,
  resolveIsDark,
  type ColorMode,
} from "@/lib/color-mode";

export const BRAND_THEME = "indigo" as const;

export type BrandTheme = typeof BRAND_THEME;

export const DEFAULT_BRAND_THEME: BrandTheme = BRAND_THEME;

/** @deprecated storage legacy — se limpia al boot */
export const BRAND_THEME_STORAGE_KEY = "mycash-brand-theme";

export const BRAND_THEME_BACKGROUNDS = {
  light: "#f7f4fc",
  dark: "#100a18",
} as const;

export function brandThemeBackground(dark = false): string {
  return dark ? BRAND_THEME_BACKGROUNDS.dark : BRAND_THEME_BACKGROUNDS.light;
}

/** @deprecated alias */
export function brandBackground(dark = false): string {
  return brandThemeBackground(dark);
}

function isDocumentDark(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

export function currentBrandTheme(): BrandTheme {
  return BRAND_THEME;
}

export function resolvedBackgroundColor(dark = isDocumentDark()): string {
  if (typeof document !== "undefined") {
    const computed = getComputedStyle(document.documentElement)
      .getPropertyValue("--background")
      .trim();
    if (computed) return computed;
  }
  return brandThemeBackground(dark);
}

/**
 * Actualiza `theme-color` / Apple status bar al fondo de la app.
 * Solo muta atributos — nunca removeChild (Next gestiona los metas del head).
 */
export function syncStatusBarColor(dark = isDocumentDark()) {
  if (typeof document === "undefined") return;
  const color = resolvedBackgroundColor(dark);

  let meta = document.querySelector(
    'meta[name="theme-color"]',
  ) as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    document.head.appendChild(meta);
  }
  meta.removeAttribute("media");
  if (meta.getAttribute("content") !== color) {
    meta.setAttribute("content", color);
  }

  let apple = document.querySelector(
    'meta[name="apple-mobile-web-app-status-bar-style"]',
  ) as HTMLMetaElement | null;
  if (!apple) {
    apple = document.createElement("meta");
    apple.setAttribute("name", "apple-mobile-web-app-status-bar-style");
    document.head.appendChild(apple);
  }
  apple.setAttribute("content", dark ? "black-translucent" : "default");
}

/** Reaplica theme-color tras hidratar (sin MutationObserver / sin borrar nodos). */
export function startThemeColorGuard(): () => void {
  if (typeof document === "undefined") return () => {};

  const paint = () => {
    try {
      syncStatusBarColor(isDocumentDark());
    } catch {
      /* head aún no listo */
    }
  };

  paint();
  const timers = [0, 100, 400].map((ms) => window.setTimeout(paint, ms));

  const onVis = () => {
    if (document.visibilityState === "visible") paint();
  };
  document.addEventListener("visibilitychange", onVis);

  return () => {
    timers.forEach(clearTimeout);
    document.removeEventListener("visibilitychange", onVis);
  };
}

export function applyBrandTheme() {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = BRAND_THEME;
  syncStatusBarColor(isDocumentDark());
}

export function syncThemeColorForMode(mode: ColorMode) {
  syncStatusBarColor(resolveIsDark(mode));
}

/**
 * Bootstrap: fuerza Ciruela + color mode. Limpia storage de temas viejos.
 */
export const THEME_BOOTSTRAP = `(function(){try{var BK=${JSON.stringify(BRAND_THEME_STORAGE_KEY)};var CK=${JSON.stringify(COLOR_MODE_STORAGE_KEY)};var B=${JSON.stringify(BRAND_THEME_BACKGROUNDS)};try{localStorage.removeItem(BK);sessionStorage.removeItem(BK);}catch(e){}document.documentElement.setAttribute("data-theme",${JSON.stringify(BRAND_THEME)});var raw=null;try{raw=localStorage.getItem(CK);}catch(e){}var mode=(raw==="light"||raw==="dark"||raw==="system")?raw:${JSON.stringify(DEFAULT_COLOR_MODE)};document.documentElement.setAttribute("data-color-mode",mode);var dark=mode==="dark"||(mode==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",dark);var c=B[dark?"dark":"light"];function paint(){var computed="";try{computed=getComputedStyle(document.documentElement).getPropertyValue("--background").trim();}catch(e){}var color=computed||c;var meta=document.querySelector('meta[name="theme-color"]');if(!meta){meta=document.createElement("meta");meta.setAttribute("name","theme-color");document.head.appendChild(meta);}meta.removeAttribute("media");meta.setAttribute("content",color);var apple=document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');if(apple)apple.setAttribute("content",dark?"black-translucent":"default");}paint();setTimeout(paint,0);setTimeout(paint,100);}catch(e){}})();`;

export function colorModeFromDocument(): ColorMode {
  if (typeof document === "undefined") return DEFAULT_COLOR_MODE;
  return (
    parseColorMode(document.documentElement.dataset.colorMode) ??
    DEFAULT_COLOR_MODE
  );
}
