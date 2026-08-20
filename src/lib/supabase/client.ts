import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv, isSupabaseConfigured } from "./env";

export function createClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createBrowserClient(url, anonKey);
}

export type BrowserSupabase = ReturnType<typeof createClient>;

/** Created once in the browser; null during SSR so the client is never built on the server. */
export const browserSupabase: BrowserSupabase | null =
  typeof window !== "undefined" && isSupabaseConfigured()
    ? createClient()
    : null;
