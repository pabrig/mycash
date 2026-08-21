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
import { clearSyncedLocalFinance } from "@/lib/storage";
import {
  acceptHouseholdInvite,
  createHousehold,
  createHouseholdInvite,
  deleteOwnAccount,
  fetchActiveHouseholdId,
  fetchHouseholdMembers,
  fetchHouseholdMemberships,
  fetchProfile,
  leaveHousehold,
  listPendingInvites,
  revokeHouseholdInvite,
  saveActiveHouseholdId,
  updateDisplayName as saveDisplayName,
} from "@/lib/supabase/data";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { friendlyError } from "@/lib/errors";
import type {
  HouseholdInvite,
  HouseholdMember,
  HouseholdMembership,
  Profile,
} from "@/lib/types";
import type { User } from "@supabase/supabase-js";

interface AuthContextValue {
  configured: boolean;
  loading: boolean;
  user: User | null;
  profile: Profile | null;
  households: HouseholdMembership[];
  /** Grupo activo (invites, form shared, /compartido) */
  household: HouseholdMembership | null;
  members: HouseholdMember[];
  pendingInvites: HouseholdInvite[];
  isAuthenticated: boolean;
  signInWithEmail: (
    email: string,
    next?: string,
    displayName?: string,
  ) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateDisplayName: (name: string) => Promise<{ error?: string }>;
  refreshHousehold: () => Promise<void>;
  setActiveHousehold: (householdId: string) => Promise<{ error?: string }>;
  createGroup: (name: string) => Promise<{ error?: string }>;
  createInvite: () => Promise<{ code?: string; error?: string }>;
  acceptInvite: (code: string) => Promise<{ error?: string }>;
  revokeInvite: (inviteId: string) => Promise<{ error?: string }>;
  leaveGroup: (householdId: string) => Promise<{ error?: string }>;
  deleteAccount: () => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function pickActiveId(
  memberships: HouseholdMembership[],
  savedId: string | null,
): string | null {
  if (savedId && memberships.some((h) => h.id === savedId)) return savedId;
  return memberships[0]?.id ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [loading, setLoading] = useState(configured);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [households, setHouseholds] = useState<HouseholdMembership[]>([]);
  const [activeHouseholdId, setActiveHouseholdId] = useState<string | null>(
    null,
  );
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<HouseholdInvite[]>([]);
  const supabase = useBrowserSupabase();

  const household = useMemo(
    () => households.find((h) => h.id === activeHouseholdId) ?? null,
    [households, activeHouseholdId],
  );

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
      const [memberships, savedId] = await Promise.all([
        fetchHouseholdMemberships(supabase, userId),
        fetchActiveHouseholdId(supabase, userId),
      ]);
      const nextActive = pickActiveId(memberships, savedId);
      setHouseholds(memberships);
      setActiveHouseholdId(nextActive);

      if (nextActive && nextActive !== savedId) {
        try {
          await saveActiveHouseholdId(supabase, userId, nextActive);
        } catch {
          /* el grupo igual queda activo en esta sesión */
        }
      }

      if (nextActive) {
        const nextMembers = await fetchHouseholdMembers(supabase, nextActive);
        setMembers(nextMembers);
        await loadPendingInvites(nextActive);
      } else {
        setMembers([]);
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
        setHouseholds([]);
        setActiveHouseholdId(null);
        setMembers([]);
        setPendingInvites([]);
      }
    } catch {
      setUser(null);
      setProfile(null);
      setHouseholds([]);
      setActiveHouseholdId(null);
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
    async (email: string, next = "/", displayName?: string) => {
      if (!supabase) {
        return { error: "No se puede entrar ahora." };
      }

      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
      const safeNext =
        next.startsWith("/") && !next.startsWith("//") ? next : "/";
      const redirectTo = `${siteUrl}/auth/callback?next=${encodeURIComponent(safeNext)}`;
      const name = displayName?.trim();

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
          ...(name ? { data: { display_name: name } } : {}),
        },
      });

      if (error) {
        return { error: friendlyError(error, "No se pudo enviar el link.") };
      }
      return {};
    },
    [supabase],
  );

  const updateDisplayName = useCallback(
    async (name: string) => {
      if (!supabase || !user) return { error: "Entrá de nuevo." };
      try {
        const profile = await saveDisplayName(supabase, user.id, name);
        setProfile(profile);
        await loadHousehold(user.id);
        return {};
      } catch (e) {
        return { error: friendlyError(e, "No se pudo guardar el nombre") };
      }
    },
    [supabase, user, loadHousehold],
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    clearSyncedLocalFinance();
    await loadUser();
  }, [supabase, loadUser]);

  const refreshHousehold = useCallback(async () => {
    if (user) await loadHousehold(user.id);
  }, [user, loadHousehold]);

  const setActiveHousehold = useCallback(
    async (householdId: string) => {
      if (!supabase || !user) return { error: "Entrá de nuevo." };
      if (!households.some((h) => h.id === householdId)) {
        return { error: "No estás en ese grupo" };
      }
      setActiveHouseholdId(householdId);
      try {
        await saveActiveHouseholdId(supabase, user.id, householdId);
        const nextMembers = await fetchHouseholdMembers(supabase, householdId);
        setMembers(nextMembers);
        await loadPendingInvites(householdId);
        return {};
      } catch (e) {
        await loadHousehold(user.id);
        return { error: friendlyError(e, "No se pudo cambiar de grupo") };
      }
    },
    [supabase, user, households, loadPendingInvites, loadHousehold],
  );

  const createGroup = useCallback(
    async (name: string) => {
      if (!supabase || !user) return { error: "Entrá de nuevo." };
      try {
        await createHousehold(supabase, name);
        await loadHousehold(user.id);
        return {};
      } catch (e) {
        return { error: friendlyError(e, "No se pudo crear el grupo") };
      }
    },
    [supabase, user, loadHousehold],
  );

  const createInvite = useCallback(async () => {
    if (!supabase || !user || !household) {
      return { error: "Todavía no hay grupo" };
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
      return { error: friendlyError(e, "No se pudo crear el código") };
    }
  }, [supabase, user, household, loadPendingInvites]);

  const acceptInvite = useCallback(
    async (code: string) => {
      if (!supabase) return { error: "Esto no está disponible ahora." };

      try {
        await acceptHouseholdInvite(supabase, code);
        await refreshHousehold();
        return {};
      } catch (e) {
        return {
          error: friendlyError(e, "Ese código no sirve"),
        };
      }
    },
    [supabase, refreshHousehold],
  );

  const revokeInvite = useCallback(
    async (inviteId: string) => {
      if (!supabase) return { error: "Esto no está disponible ahora." };
      try {
        await revokeHouseholdInvite(supabase, inviteId);
        if (household) await loadPendingInvites(household.id);
        return {};
      } catch (e) {
        return { error: friendlyError(e, "No se pudo cancelar") };
      }
    },
    [supabase, household, loadPendingInvites],
  );

  const leaveGroup = useCallback(
    async (householdId: string) => {
      if (!supabase) return { error: "Esto no está disponible ahora." };
      try {
        await leaveHousehold(supabase, householdId);
        await refreshHousehold();
        return {};
      } catch (e) {
        return { error: friendlyError(e, "No se pudo salir del grupo") };
      }
    },
    [supabase, refreshHousehold],
  );

  const deleteAccount = useCallback(async () => {
    if (!supabase) return { error: "Esto no está disponible ahora." };
    try {
      await deleteOwnAccount(supabase);
      await supabase.auth.signOut();
      clearSyncedLocalFinance();
      setUser(null);
      setProfile(null);
      setHouseholds([]);
      setActiveHouseholdId(null);
      setMembers([]);
      setPendingInvites([]);
      return {};
    } catch (e) {
      return { error: friendlyError(e, "No se pudo borrar la cuenta") };
    }
  }, [supabase]);

  const value = useMemo<AuthContextValue>(
    () => ({
      configured,
      loading,
      user,
      profile,
      households,
      household,
      members,
      pendingInvites,
      isAuthenticated: Boolean(user),
      signInWithEmail,
      signOut,
      updateDisplayName,
      refreshHousehold,
      setActiveHousehold,
      createGroup,
      createInvite,
      acceptInvite,
      revokeInvite,
      leaveGroup,
      deleteAccount,
    }),
    [
      configured,
      loading,
      user,
      profile,
      households,
      household,
      members,
      pendingInvites,
      signInWithEmail,
      signOut,
      updateDisplayName,
      refreshHousehold,
      setActiveHousehold,
      createGroup,
      createInvite,
      acceptInvite,
      revokeInvite,
      leaveGroup,
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
