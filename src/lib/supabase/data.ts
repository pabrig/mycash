import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  DisplayCurrency,
  Household,
  HouseholdMember,
  Movement,
  MonthlyRate,
  Profile,
  WalletMode,
} from "@/lib/types";

export type LocalSnapshot = {
  movements: Movement[];
  rates: MonthlyRate[];
  displayCurrency: DisplayCurrency;
  walletMode: WalletMode;
  sharedEnabled: boolean;
  usdEnabled: boolean;
};

/** Hay algo local que vale la pena subir en el primer login. */
export function hasLocalToMigrate(local: LocalSnapshot): boolean {
  const personal = local.movements.filter((m) => m.scope !== "shared");
  return (
    personal.length > 0 ||
    local.rates.length > 0 ||
    local.displayCurrency === "USD" ||
    local.walletMode === "split" ||
    local.sharedEnabled ||
    local.usdEnabled === false
  );
}

type DbMovement = {
  id: string;
  user_id: string;
  household_id: string | null;
  created_by: string;
  scope: "personal" | "shared";
  type: "income" | "expense";
  date: string;
  amount: number;
  currency: "ARS" | "USD";
  description: string;
  kind: string | null;
  category: string | null;
  income_kind: string | null;
  source: string | null;
  wallet: string | null;
  created_at: string;
};

function rowToMovement(row: DbMovement, nameMap: Record<string, string>): Movement {
  return {
    id: row.id,
    type: row.type,
    date: row.date,
    amount: Number(row.amount),
    currency: row.currency,
    description: row.description,
    scope: row.scope,
    kind: (row.kind as Movement["kind"]) ?? undefined,
    category: row.category ?? undefined,
    incomeKind: (row.income_kind as Movement["incomeKind"]) ?? undefined,
    source: row.source ?? undefined,
    wallet: (row.wallet as Movement["wallet"]) ?? undefined,
    createdAt: row.created_at,
    createdByUserId: row.created_by,
    createdByName: nameMap[row.created_by],
  };
}

async function enrichMovements(
  supabase: SupabaseClient,
  rows: DbMovement[],
): Promise<Movement[]> {
  if (rows.length === 0) return [];

  const ids = [...new Set(rows.map((r) => r.created_by))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", ids);

  const nameMap = Object.fromEntries(
    (profiles ?? []).map((p) => [p.id, p.display_name as string]),
  );

  return rows.map((row) => rowToMovement(row, nameMap));
}

function movementToInsert(
  movement: Omit<Movement, "id" | "createdAt" | "createdByUserId" | "createdByName">,
  userId: string,
  householdId: string | null,
) {
  return {
    user_id: userId,
    household_id: movement.scope === "shared" ? householdId : null,
    created_by: userId,
    scope: movement.scope ?? "personal",
    type: movement.type,
    date: movement.date,
    amount: movement.amount,
    currency: movement.currency,
    description: movement.description,
    kind: movement.kind ?? null,
    category: movement.category ?? null,
    income_kind: movement.incomeKind ?? null,
    source: movement.source ?? null,
    wallet: movement.wallet ?? null,
  };
}

export async function updateDisplayName(
  supabase: SupabaseClient,
  userId: string,
  displayName: string,
): Promise<Profile> {
  const name = displayName.trim();
  if (!name) throw new Error("Falta el nombre");

  const { data, error } = await supabase
    .from("profiles")
    .update({ display_name: name })
    .eq("id", userId)
    .select("id, display_name")
    .single();

  if (error) throw error;
  return { id: data.id, displayName: data.display_name };
}

export async function fetchProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("id", userId)
    .maybeSingle();

  if (!data) return null;
  return { id: data.id, displayName: data.display_name };
}

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function fetchHouseholdContext(
  supabase: SupabaseClient,
  userId: string,
): Promise<{
  household: Household | null;
  members: HouseholdMember[];
}> {
  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id, role, households(id, name)")
    .eq("user_id", userId)
    .maybeSingle();

  const h = unwrapOne(
    membership?.households as { id: string; name: string } | { id: string; name: string }[] | null,
  );

  if (!h) {
    return { household: null, members: [] };
  }

  const household: Household = { id: h.id, name: h.name };

  const { data: membersData } = await supabase
    .from("household_members")
    .select("user_id, role, profiles(display_name)")
    .eq("household_id", household.id);

  const members: HouseholdMember[] = (membersData ?? []).map((m) => {
    const profile = unwrapOne(
      m.profiles as { display_name: string } | { display_name: string }[] | null,
    );
    return {
      userId: m.user_id,
      displayName: profile?.display_name ?? "Usuario",
      role: m.role as HouseholdMember["role"],
    };
  });

  return { household, members };
}

export async function fetchAllMovementsForUser(
  supabase: SupabaseClient,
): Promise<Movement[]> {
  const { data, error } = await supabase
    .from("movements")
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return enrichMovements(supabase, (data ?? []) as DbMovement[]);
}

export async function fetchSharedMovements(
  supabase: SupabaseClient,
): Promise<Movement[]> {
  const { data, error } = await supabase
    .from("movements")
    .select("*")
    .eq("scope", "shared")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return enrichMovements(supabase, (data ?? []) as DbMovement[]);
}

export async function insertMovement(
  supabase: SupabaseClient,
  input: Omit<Movement, "id" | "createdAt" | "createdByUserId" | "createdByName">,
  userId: string,
  householdId: string | null,
): Promise<Movement> {
  const { data, error } = await supabase
    .from("movements")
    .insert(movementToInsert(input, userId, householdId))
    .select("*")
    .single();

  if (error) throw error;
  const [movement] = await enrichMovements(supabase, [data as DbMovement]);
  return movement;
}

export async function updateMovementById(
  supabase: SupabaseClient,
  id: string,
  input: Omit<Movement, "id" | "createdAt" | "createdByUserId" | "createdByName">,
  userId: string,
  householdId: string | null,
): Promise<Movement> {
  const { data, error } = await supabase
    .from("movements")
    .update(movementToInsert(input, userId, householdId))
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  const [movement] = await enrichMovements(supabase, [data as DbMovement]);
  return movement;
}

export async function deleteMovementById(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await supabase.from("movements").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchRates(
  supabase: SupabaseClient,
  userId: string,
): Promise<MonthlyRate[]> {
  const { data, error } = await supabase
    .from("monthly_rates")
    .select("year, month, usd_to_ars, updated_at")
    .eq("user_id", userId);

  if (error) throw error;

  return (data ?? []).map((r) => ({
    year: r.year,
    month: r.month,
    usdToArs: Number(r.usd_to_ars),
    updatedAt: r.updated_at ?? undefined,
  }));
}

export async function upsertRate(
  supabase: SupabaseClient,
  userId: string,
  rate: MonthlyRate,
): Promise<void> {
  const { error } = await supabase.from("monthly_rates").upsert(
    {
      user_id: userId,
      year: rate.year,
      month: rate.month,
      usd_to_ars: rate.usdToArs,
      updated_at: rate.updatedAt ?? new Date().toISOString(),
    },
    { onConflict: "user_id,year,month" },
  );
  if (error) throw error;
}

export async function fetchWalletMode(
  supabase: SupabaseClient,
  userId: string,
): Promise<WalletMode> {
  const { data } = await supabase
    .from("user_settings")
    .select("wallet_mode")
    .eq("user_id", userId)
    .maybeSingle();

  return data?.wallet_mode === "split" ? "split" : "unified";
}

export async function saveWalletModeRemote(
  supabase: SupabaseClient,
  userId: string,
  mode: WalletMode,
): Promise<void> {
  const { error } = await supabase.from("user_settings").upsert({
    user_id: userId,
    wallet_mode: mode,
  });
  if (error) throw error;
}

export async function fetchSharedEnabled(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("user_settings")
    .select("shared_enabled")
    .eq("user_id", userId)
    .maybeSingle();

  return data?.shared_enabled === true;
}

export async function saveSharedEnabledRemote(
  supabase: SupabaseClient,
  userId: string,
  enabled: boolean,
): Promise<void> {
  const { error } = await supabase.from("user_settings").upsert({
    user_id: userId,
    shared_enabled: enabled,
  });
  if (error) throw error;
}

/** Default true si la columna no existe aún / null. */
export async function fetchUsdEnabled(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("user_settings")
    .select("usd_enabled")
    .eq("user_id", userId)
    .maybeSingle();

  if (data?.usd_enabled === false) return false;
  return true;
}

export async function saveUsdEnabledRemote(
  supabase: SupabaseClient,
  userId: string,
  enabled: boolean,
): Promise<void> {
  const { error } = await supabase.from("user_settings").upsert({
    user_id: userId,
    usd_enabled: enabled,
  });
  if (error) throw error;
}

export async function fetchDisplayCurrency(
  supabase: SupabaseClient,
  userId: string,
): Promise<DisplayCurrency> {
  const { data } = await supabase
    .from("user_settings")
    .select("display_currency")
    .eq("user_id", userId)
    .maybeSingle();

  return data?.display_currency === "USD" ? "USD" : "ARS";
}

export async function saveDisplayCurrencyRemote(
  supabase: SupabaseClient,
  userId: string,
  currency: DisplayCurrency,
): Promise<void> {
  const { error } = await supabase.from("user_settings").upsert({
    user_id: userId,
    display_currency: currency,
  });
  if (error) throw error;
}

/** 12 chars ~ 62 bits; alphabet sin I/O/0/1 para leer en voz/chat. */
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let code = "";
  for (let i = 0; i < 12; i++) {
    code += chars[bytes[i]! % chars.length];
  }
  return code;
}

export async function createHouseholdInvite(
  supabase: SupabaseClient,
  householdId: string,
  userId: string,
): Promise<string> {
  const { count } = await supabase
    .from("household_invites")
    .select("*", { count: "exact", head: true })
    .eq("household_id", householdId)
    .is("used_by", null)
    .gt("expires_at", new Date().toISOString());

  if ((count ?? 0) >= 5) {
    throw new Error("Ya hay 5 invitaciones. Cancelá una para crear otra.");
  }

  const code = generateInviteCode();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { error } = await supabase.from("household_invites").insert({
    household_id: householdId,
    code,
    created_by: userId,
    expires_at: expiresAt.toISOString(),
  });

  if (error) throw error;
  return code;
}

export async function listPendingInvites(
  supabase: SupabaseClient,
  householdId: string,
): Promise<
  { id: string; code: string; expiresAt: string; createdAt: string }[]
> {
  const { data, error } = await supabase
    .from("household_invites")
    .select("id, code, expires_at, created_at")
    .eq("household_id", householdId)
    .is("used_by", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id as string,
    code: row.code as string,
    expiresAt: row.expires_at as string,
    createdAt: row.created_at as string,
  }));
}

export async function revokeHouseholdInvite(
  supabase: SupabaseClient,
  inviteId: string,
): Promise<void> {
  const { error } = await supabase
    .from("household_invites")
    .delete()
    .eq("id", inviteId);

  if (error) throw error;
}

export async function acceptHouseholdInvite(
  supabase: SupabaseClient,
  code: string,
): Promise<void> {
  const { error } = await supabase.rpc("accept_household_invite", {
    invite_code: code,
  });
  if (error) throw error;
}

export async function leaveHousehold(
  supabase: SupabaseClient,
): Promise<void> {
  const { error } = await supabase.rpc("leave_household");
  if (error) throw error;
}

export async function deleteOwnAccount(
  supabase: SupabaseClient,
): Promise<void> {
  const { error } = await supabase.rpc("delete_own_account");
  if (error) throw error;
}

/**
 * Primera sync: sube personales + settings/rates locales.
 * No sube `shared` (sin household válido / no inventar gastos de grupo).
 * Si ya hay personales en nube, no vuelve a migrar (cloud gana).
 */
export async function migrateLocalIfEmpty(
  supabase: SupabaseClient,
  userId: string,
  local: LocalSnapshot,
): Promise<void> {
  if (!hasLocalToMigrate(local)) return;

  const { count } = await supabase
    .from("movements")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("scope", "personal");

  if ((count ?? 0) > 0) return;

  const rows = local.movements
    .filter((m) => m.scope !== "shared")
    .map((m) => ({
      id: m.id,
      user_id: userId,
      household_id: null,
      created_by: userId,
      scope: "personal" as const,
      type: m.type,
      date: m.date,
      amount: m.amount,
      currency: m.currency,
      description: m.description,
      kind: m.kind ?? null,
      category: m.category ?? null,
      income_kind: m.incomeKind ?? null,
      source: m.source ?? null,
      wallet: m.wallet ?? null,
      created_at: m.createdAt,
    }));

  if (rows.length > 0) {
    const { error } = await supabase.from("movements").insert(rows);
    if (error) throw error;
  }

  if (local.rates.length > 0) {
    const { error } = await supabase.from("monthly_rates").upsert(
      local.rates.map((r) => ({
        user_id: userId,
        year: r.year,
        month: r.month,
        usd_to_ars: r.usdToArs,
        updated_at: r.updatedAt ?? new Date().toISOString(),
      })),
      { onConflict: "user_id,year,month" },
    );
    if (error) throw error;
  }

  const { error: settingsError } = await supabase.from("user_settings").upsert({
    user_id: userId,
    display_currency: local.displayCurrency,
    wallet_mode: local.walletMode,
    shared_enabled: local.sharedEnabled,
    usd_enabled: local.usdEnabled,
  });
  if (settingsError) throw settingsError;
}
