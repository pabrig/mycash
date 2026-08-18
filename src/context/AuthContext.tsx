"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import {
  acceptHouseholdInvite,
  createHouseholdInvite,
  fetchHouseholdContext,
  fetchProfile,
} from "@/lib/supabase/data";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Household, HouseholdMember, Profile } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

interface AuthContextValue {
  configured: boolean;
  loading: boolean;
  user: User | null;
  profile: Profile | null;
  household: Household | null;
  members: HouseholdMember[];
  isAuthenticated: boolean;
  signInWithEmail: (email: string, next?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshHousehold: () => Promise<void>;
  createInvite: () => Promise<{ code?: string; error?: string }>;
  acceptInvite: (code: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [loading, setLoading] = useState(configured);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  // No crear el client en SSR — solo en el browser tras mount
  const [supabase, setSupabase] = useState<ReturnType<
    typeof createClient
  > | null>(null);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }
    setSupabase(createClient());
  }, [configured]);

  const loadHousehold = useCallback(
    async (userId: string) => {
      if (!supabase) return;
      const ctx = await fetchHouseholdContext(supabase, userId);
      setHousehold(ctx.household);
      setMembers(ctx.members);
    },
    [supabase],
  );

  const loadUser = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      setUser(currentUser);

      if (currentUser) {
        const p = await fetchProfile(supabase, currentUser.id);
        setProfile(p);
        await loadHousehold(currentUser.id);
      } else {
        setProfile(null);
        setHousehold(null);
        setMembers([]);
      }
    } catch {
      setUser(null);
      setProfile(null);
      setHousehold(null);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [supabase, loadHousehold]);

  useEffect(() => {
    void loadUser();

    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadUser();
    });

    return () => subscription.unsubscribe();
  }, [supabase, loadUser]);

  const signInWithEmail = useCallback(
    async (email: string, next = "/") => {
      if (!supabase) {
        return { error: "Supabase no configurado" };
      }

      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
      const safeNext = next.startsWith("/") ? next : "/";
      const redirectTo = `${siteUrl}/auth/callback?next=${encodeURIComponent(safeNext)}`;

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      return { error: error?.message };
    },
    [supabase],
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    await loadUser();
  }, [supabase, loadUser]);

  const refreshHousehold = useCallback(async () => {
    if (user) await loadHousehold(user.id);
  }, [user, loadHousehold]);

  const createInvite = useCallback(async () => {
    if (!supabase || !user || !household) {
      return { error: "No hay grupo activo" };
    }

    try {
      const code = await createHouseholdInvite(
        supabase,
        household.id,
        user.id,
      );
      return { code };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Error al crear invitación" };
    }
  }, [supabase, user, household]);

  const acceptInvite = useCallback(
    async (code: string) => {
      if (!supabase) return { error: "Supabase no configurado" };

      try {
        await acceptHouseholdInvite(supabase, code);
        await refreshHousehold();
        return {};
      } catch (e) {
        return {
          error: e instanceof Error ? e.message : "Invitación inválida",
        };
      }
    },
    [supabase, refreshHousehold],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      configured,
      loading,
      user,
      profile,
      household,
      members,
      isAuthenticated: Boolean(user),
      signInWithEmail,
      signOut,
      refreshHousehold,
      createInvite,
      acceptInvite,
    }),
    [
      configured,
      loading,
      user,
      profile,
      household,
      members,
      signInWithEmail,
      signOut,
      refreshHousehold,
      createInvite,
      acceptInvite,
    ],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
