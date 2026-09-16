/**
 * Ícono del lugar de ahorro a partir del nombre.
 *
 * No hay un directorio fintech AR gratuito + sin clave que resuelva
 * “Brubank” / “Galicia” por texto. Estrategia:
 * 1. Alias locales (bancos/apps habituales) → favicon del dominio (Google, sin API key)
 * 2. Efectivo / caja → ícono genérico
 * 3. Opcional: Logo.dev por nombre si hay NEXT_PUBLIC_LOGO_DEV_PUBLISHABLE_KEY
 * 4. Si no, inicial
 */

export type LocationIconKind = "cash" | "safe" | "brand" | "letter";

export type ResolvedLocationIcon = {
  kind: LocationIconKind;
  letter: string;
  /** URL remota; si falla, la UI cae a letra / genérico. */
  src: string | null;
  matchedAlias: string | null;
};

type GenericEntry = { aliases: string[]; kind: "cash" | "safe" };
type BrandEntry = { aliases: string[]; domain: string };

const GENERIC_PLACES: GenericEntry[] = [
  {
    kind: "cash",
    aliases: ["efectivo", "cash", "billetes", "colchon", "en mano", "dolares fisico"],
  },
  {
    kind: "safe",
    aliases: ["caja de seguridad", "caja fuerte", "safe"],
  },
];

/** Dominios públicos para el favicon. Alias más largos primero. */
const BRAND_PLACES: BrandEntry[] = [
  { aliases: ["mercado pago", "mercadopago"], domain: "mercadopago.com.ar" },
  { aliases: ["naranja x", "naranjax"], domain: "naranjax.com" },
  { aliases: ["interactive brokers", "ibkr"], domain: "interactivebrokers.com" },
  { aliases: ["banco nacion", "nacion"], domain: "bna.com.ar" },
  { aliases: ["personal pay"], domain: "personalpay.com.ar" },
  { aliases: ["lemon cash", "lemon"], domain: "lemoncash.com.ar" },
  { aliases: ["banco galicia", "galicia"], domain: "bancogalicia.com" },
  { aliases: ["santander"], domain: "santander.com.ar" },
  { aliases: ["brubank"], domain: "brubank.com" },
  { aliases: ["macro"], domain: "macro.com.ar" },
  { aliases: ["supervielle"], domain: "supervielle.com.ar" },
  { aliases: ["icbc"], domain: "icbc.com.ar" },
  { aliases: ["hsbc"], domain: "hsbc.com.ar" },
  { aliases: ["bbva"], domain: "bbva.com.ar" },
  { aliases: ["uala"], domain: "uala.com.ar" },
  { aliases: ["prex"], domain: "prexcard.com" },
  { aliases: ["buenbit"], domain: "buenbit.com" },
  { aliases: ["ripio"], domain: "ripio.com" },
  { aliases: ["binance"], domain: "binance.com" },
  { aliases: ["coinbase"], domain: "coinbase.com" },
  { aliases: ["astropay"], domain: "astropay.com" },
  { aliases: ["paypal"], domain: "paypal.com" },
  { aliases: ["revolut"], domain: "revolut.com" },
  { aliases: ["wise"], domain: "wise.com" },
  { aliases: ["modo"], domain: "modo.com.ar" },
  { aliases: ["mp"], domain: "mercadopago.com.ar" },
];

export const LOCATION_NAME_SUGGESTIONS = [
  "Brubank",
  "Mercado Pago",
  "Galicia",
  "IBKR",
  "Efectivo",
] as const;

export function normalizeLocationName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function locationLetter(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return Array.from(trimmed)[0]!.toUpperCase();
}

function aliasHits(normalized: string, alias: string): boolean {
  if (!normalized) return false;
  if (normalized === alias) return true;
  if (alias.length <= 2) {
    return normalized.split(" ").includes(alias);
  }
  return (
    normalized.startsWith(`${alias} `) ||
    normalized.endsWith(` ${alias}`) ||
    normalized.includes(` ${alias} `)
  );
}

export function faviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
}

export function logoDevNameUrl(name: string, token: string): string {
  return `https://img.logo.dev/name/${encodeURIComponent(name.trim())}?token=${encodeURIComponent(token)}&size=64&format=png&fallback=404`;
}

export function logoDevPublishableKey(): string | null {
  const raw = process.env.NEXT_PUBLIC_LOGO_DEV_PUBLISHABLE_KEY?.trim();
  return raw ? raw : null;
}

export function resolveLocationIcon(
  name: string,
  opts?: { logoDevToken?: string | null },
): ResolvedLocationIcon {
  const letter = locationLetter(name);
  const normalized = normalizeLocationName(name);
  const token = opts?.logoDevToken ?? logoDevPublishableKey();

  if (!normalized) {
    return { kind: "letter", letter, src: null, matchedAlias: null };
  }

  for (const entry of GENERIC_PLACES) {
    const alias = entry.aliases.find((a) => aliasHits(normalized, a));
    if (alias) {
      return { kind: entry.kind, letter, src: null, matchedAlias: alias };
    }
  }

  for (const entry of BRAND_PLACES) {
    const alias = entry.aliases.find((a) => aliasHits(normalized, a));
    if (alias) {
      return {
        kind: "brand",
        letter,
        src: faviconUrl(entry.domain),
        matchedAlias: alias,
      };
    }
  }

  if (token && name.trim().length >= 2) {
    return {
      kind: "brand",
      letter,
      src: logoDevNameUrl(name, token),
      matchedAlias: null,
    };
  }

  return { kind: "letter", letter, src: null, matchedAlias: null };
}
