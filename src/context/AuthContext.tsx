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
import { useBrowserSupabase } from "@/hooks/useBrowserSupabase";
import {
  acceptHouseholdInvite,
  createHouseholdInvite,
  deleteOwnAccount,
  fetchHouseholdContext,
  fetchProfile,
  leaveHousehold,
  listPendingInvites,
  revokeHouseholdInvite,
} from "@/lib/supabase/data";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type {
  Household,
  HouseholdInvite,
  HouseholdMember,
  Profile,
} from "@/lib/types";
import type { User } from "@supabase/supabase-js";

interface AuthContextValue {
  configured: boolean;
  loading: boolean;
  user: User | null;
  profile: Profile | null;
  household: Household | null;
  members: HouseholdMember[];
  pendingInvites: HouseholdInvite[];
  isAuthenticated: boolean;
  signInWithEmail: (email: string, next?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshHousehold: () => Promise<void>;
  createInvite: () => Promise<{ code?: string; error?: string }>;
  acceptInvite: (code: string) => Promise<{ error?: string }>;
  revokeInvite: (inviteId: string) => Promise<{ error?: string }>;
  leaveCurrentHousehold: () => Promise<{ error?: string }>;
  deleteAccount: () => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function friendlyAuthError(e: unknown, fallback: string): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (/Invalid or expired invite/i.test(msg)) {
    return "Código inválido o vencido";
  }
  if (/Not authenticated|JWT|session/i.test(msg)) {
    return "Sesión vencida — volvé a iniciar sesión";
  }
  if (/Failed to fetch|NetworkError|fetch/i.test(msg)) {
    return "Sin conexión — reintentá en un momento";
  }
  return msg || fallback;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [loading, setLoading] = useState(configured);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<HouseholdInvite[]>([]);
  const supabase = useBrowserSupabase();

  const loadPendingInvites = useCallback(
    async (householdId: string) => {
      if (!supabase) return;
      try {
        const invites = await listPendingInvites(supabase, householdId);
        setPendingInvites(invites);
      } catch {
        setPendingInvites([]);
      }
    },
    [supabase],
  );

  const loadHousehold = useCallback(
    async (userId: string) => {
      if (!supabase) return;
      const ctx = await fetchHouseholdContext(supabase, userId);
      setHousehold(ctx.household);
      setMembers(ctx.members);
      if (ctx.household) {
        await loadPendingInvites(ctx.household.id);
      } else {
        setPendingInvites([]);
      }
    },
    [supabase, loadPendingInvites],
  );

  const loadUser = useCallback(async () => {
    if (!supabase) return;

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
        setPendingInvites([]);
      }
    } catch {
      setUser(null);
      setProfile(null);
      setHousehold(null);
      setMembers([]);
      setPendingInvites([]);
    } finally {
      setLoading(false);
    }
  }, [supabase, loadHousehold]);

  useEffect(() => {
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
      const safeNext =
        next.startsWith("/") && !next.startsWith("//") ? next : "/";
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
      await loadPendingInvites(household.id);
      return { code };
    } catch (e) {
      return { error: friendlyAuthError(e, "Error al crear invitación") };
    }
  }, [supabase, user, household, loadPendingInvites]);

  const acceptInvite = useCallback(
    async (code: string) => {
      if (!supabase) return { error: "Supabase no configurado" };

      try {
        await acceptHouseholdInvite(supabase, code);
        await refreshHousehold();
        return {};
      } catch (e) {
        return {
          error: friendlyAuthError(e, "Invitación inválida"),
        };
      }
    },
    [supabase, refreshHousehold],
  );

  const revokeInvite = useCallback(
    async (inviteId: string) => {
      if (!supabase) return { error: "Supabase no configurado" };
      try {
        await revokeHouseholdInvite(supabase, inviteId);
        if (household) await loadPendingInvites(household.id);
        return {};
      } catch (e) {
        return { error: friendlyAuthError(e, "No se pudo revocar") };
      }
    },
    [supabase, household, loadPendingInvites],
  );

  const leaveCurrentHousehold = useCallback(async () => {
    if (!supabase) return { error: "Supabase no configurado" };
    try {
      await leaveHousehold(supabase);
      await refreshHousehold();
      return {};
    } catch (e) {
      return { error: friendlyAuthError(e, "No se pudo salir del grupo") };
    }
  }, [supabase, refreshHousehold]);

  const deleteAccount = useCallback(async () => {
    if (!supabase) return { error: "Supabase no configurado" };
    try {
      await deleteOwnAccount(supabase);
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setHousehold(null);
      setMembers([]);
      setPendingInvites([]);
      return {};
    } catch (e) {
      return { error: friendlyAuthError(e, "No se pudo borrar la cuenta") };
    }
  }, [supabase]);

  const value = useMemo<AuthContextValue>(
    () => ({
      configured,
      loading,
      user,
      profile,
      household,
      members,
      pendingInvites,
      isAuthenticated: Boolean(user),
      signInWithEmail,
      signOut,
      refreshHousehold,
      createInvite,
      acceptInvite,
      revokeInvite,
      leaveCurrentHousehold,
      deleteAccount,
    }),
    [
      configured,
      loading,
      user,
      profile,
      household,
      members,
      pendingInvites,
      signInWithEmail,
      signOut,
      refreshHousehold,
      createInvite,
      acceptInvite,
      revokeInvite,
      leaveCurrentHousehold,
      deleteAccount,
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
