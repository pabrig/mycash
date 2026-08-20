"use client";

import { useSyncExternalStore } from "react";
import { browserSupabase } from "@/lib/supabase/client";

function subscribeNoop() {
  return () => {};
}

/** Browser Supabase client after hydration; null on the server. */
export function useBrowserSupabase() {
  return useSyncExternalStore(
    subscribeNoop,
    () => browserSupabase,
    () => null,
  );
}
