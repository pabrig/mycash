import { isFeatureEnabled } from "@/lib/feature-flags";

/** Solo local: saltea login y corre en modo localStorage (sin nube). */
export function isDevSkipAuth(): boolean {
  return isFeatureEnabled("skipAuth");
}

export function isSupabaseConfigured(): boolean {
  if (isDevSkipAuth()) return false;
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return { url, anonKey };
}
