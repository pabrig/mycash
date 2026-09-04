import type { SupabaseClient } from "@supabase/supabase-js";
import { isOnboardingDone } from "@/lib/account-setup";
import type { SavingsGoal } from "@/lib/goals";
import { normalizeHouseholdName, parseSharedFunding } from "@/lib/household";
import type {
  DisplayCurrency,
  HouseholdMember,
  HouseholdMembership,
  Movement,
  MonthlyRate,
  Profile,
  SharedFunding,
  UserNotice,
  WalletMode,
} from "@/lib/types";

export type LocalSnapshot = {
  movements: Movement[];
  rates: MonthlyRate[];
  displayCurrency: DisplayCurrency;
  walletMode: WalletMode;
  sharedEnabled: boolean;
  sharedFunding: SharedFunding;
  usdEnabled: boolean;
  carryoverEnabled: boolean;
  goalsEnabled?: boolean;
  savingsGoals?: SavingsGoal[];
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
    local.sharedFunding === "pool" ||
    local.usdEnabled === false ||
    local.carryoverEnabled ||
    local.goalsEnabled === true ||
    (local.savingsGoals?.length ?? 0) > 0
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

function rowToMovement(
  row: DbMovement,
  nameMap: Record<string, string>,
  householdMap: Record<string, string>,
): Movement {
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
    householdId: row.household_id ?? undefined,
    householdName: row.household_id
      ? householdMap[row.household_id]
      : undefined,
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

  const householdIds = [
    ...new Set(rows.map((r) => r.household_id).filter((id): id is string => Boolean(id))),
  ];
  let householdMap: Record<string, string> = {};
  if (householdIds.length > 0) {
    const { data: households } = await supabase
      .from("households")
      .select("id, name")
      .in("id", householdIds);
    householdMap = Object.fromEntries(
      (households ?? []).map((h) => [h.id as string, h.name as string]),
    );
  }

  return rows.map((row) => rowToMovement(row, nameMap, householdMap));
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

export async function ensureOwnAccount(
  supabase: SupabaseClient,
): Promise<void> {
  const { error } = await supabase.rpc("ensure_own_account");
  if (error) throw error;
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

type MembershipRow = {
  role: string;
  households: { id: string; name: string } | { id: string; name: string }[] | null;
  shared_funding?: string | null;
};

function mapMembershipRows(data: MembershipRow[] | null): HouseholdMembership[] {
  return (data ?? []).flatMap((row) => {
    const h = unwrapOne(row.households);
    if (!h) return [];
    const membership: HouseholdMembership = {
      id: h.id,
      name: h.name,
      role: row.role as HouseholdMembership["role"],
    };
    if (Object.prototype.hasOwnProperty.call(row, "shared_funding")) {
      membership.sharedFunding = parseSharedFunding(row.shared_funding);
    }
    return [membership];
  });
}

export async function fetchHouseholdMemberships(
  supabase: SupabaseClient,
  userId: string,
): Promise<HouseholdMembership[]> {
  const withFunding = await supabase
    .from("household_members")
    .select("role, joined_at, shared_funding, households(id, name)")
    .eq("user_id", userId)
    .order("joined_at", { ascending: true });

  if (!withFunding.error) {
    return mapMembershipRows(withFunding.data as MembershipRow[] | null);
  }
  if (!isMissingSharedFundingColumn(withFunding.error)) {
    throw withFunding.error;
  }

  const { data, error } = await supabase
    .from("household_members")
    .select("role, joined_at, households(id, name)")
    .eq("user_id", userId)
    .order("joined_at", { ascending: true });

  if (error) throw error;
  return mapMembershipRows(data as MembershipRow[] | null);
}

export async function fetchHouseholdMembers(
  supabase: SupabaseClient,
  householdId: string,
): Promise<HouseholdMember[]> {
  const { data, error } = await supabase
    .from("household_members")
    .select("user_id, role, profiles(display_name)")
    .eq("household_id", householdId);

  if (error) throw error;

  return (data ?? []).map((m) => {
    const profile = unwrapOne(
      m.profiles as { display_name: string } | { display_name: string }[] | null,
    );
    return {
      userId: m.user_id,
      displayName: profile?.display_name ?? "Usuario",
      role: m.role as HouseholdMember["role"],
    };
  });
}

export async function fetchHouseholdMemberCounts(
  supabase: SupabaseClient,
  householdIds: string[],
): Promise<Record<string, number>> {
  if (householdIds.length === 0) return {};
  const { data, error } = await supabase
    .from("household_members")
    .select("household_id")
    .in("household_id", householdIds);

  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const id = row.household_id as string;
    counts[id] = (counts[id] ?? 0) + 1;
  }
  return counts;
}

export async function fetchActiveHouseholdId(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("user_settings")
    .select("active_household_id")
    .eq("user_id", userId)
    .maybeSingle();

  return (data?.active_household_id as string | null) ?? null;
}

export async function saveActiveHouseholdId(
  supabase: SupabaseClient,
  userId: string,
  householdId: string | null,
): Promise<void> {
  const { error } = await supabase
    .from("user_settings")
    .update({ active_household_id: householdId })
    .eq("user_id", userId);

  if (error) throw error;
}

export async function createHousehold(
  supabase: SupabaseClient,
  name: string,
): Promise<string> {
  const { data, error } = await supabase.rpc("create_household", {
    household_name: name,
  });
  if (error) throw error;
  return data as string;
}

export async function renameHousehold(
  supabase: SupabaseClient,
  householdId: string,
  name: string,
): Promise<void> {
  const n = normalizeHouseholdName(name);
  if (!n) throw new Error("Falta el nombre");

  const { error } = await supabase
    .from("households")
    .update({ name: n })
    .eq("id", householdId);

  if (error) throw error;
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

export type UserSettings = {
  displayCurrency: DisplayCurrency;
  walletMode: WalletMode;
  sharedEnabled: boolean;
  sharedFunding: SharedFunding;
  usdEnabled: boolean;
  carryoverEnabled: boolean;
  goalsEnabled: boolean;
  onboardingCompleted: boolean;
  /** False si la columna todavía no existe en la base. */
  onboardingTracked: boolean;
};

export function isMissingOnboardingColumn(error: {
  code?: string;
  message?: string;
} | null): boolean {
  return isMissingColumn(error, "onboarding_completed");
}

export function isMissingSharedFundingColumn(error: {
  code?: string;
  message?: string;
} | null): boolean {
  return isMissingColumn(error, "shared_funding");
}

export function isMissingCarryoverColumn(error: {
  code?: string;
  message?: string;
} | null): boolean {
  return isMissingColumn(error, "carryover_enabled");
}

export function isMissingGoalsEnabledColumn(error: {
  code?: string;
  message?: string;
} | null): boolean {
  return isMissingColumn(error, "goals_enabled");
}

export function isMissingGoalsTable(error: {
  code?: string;
  message?: string;
} | null): boolean {
  if (!error) return false;
  const message = (error.message ?? "").toLowerCase();
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    message.includes("savings_goals")
  );
}

export function isMissingRpc(
  error: { code?: string; message?: string } | null,
  name: string,
): boolean {
  if (!error) return false;
  const message = (error.message ?? "").toLowerCase();
  const n = name.toLowerCase();
  return (
    error.code === "42883" ||
    error.code === "PGRST202" ||
    (message.includes("function") && message.includes(n))
  );
}

function isMissingColumn(
  error: { code?: string; message?: string } | null,
  column: string,
): boolean {
  if (!error) return false;
  const message = (error.message ?? "").toLowerCase();
  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    message.includes(column)
  );
}

export function parseUserSettings(
  data: {
    display_currency?: string | null;
    wallet_mode?: string | null;
    shared_enabled?: boolean | null;
    shared_funding?: string | null;
    usd_enabled?: boolean | null;
    carryover_enabled?: boolean | null;
    goals_enabled?: boolean | null;
    onboarding_completed?: boolean | null;
  } | null,
): UserSettings {
  return {
    displayCurrency: data?.display_currency === "USD" ? "USD" : "ARS",
    walletMode: data?.wallet_mode === "split" ? "split" : "unified",
    sharedEnabled: data?.shared_enabled === true,
    sharedFunding: parseSharedFunding(data?.shared_funding),
    usdEnabled: data?.usd_enabled !== false,
    carryoverEnabled: data?.carryover_enabled === true,
    goalsEnabled: data?.goals_enabled === true,
    onboardingCompleted: isOnboardingDone(data?.onboarding_completed),
    onboardingTracked:
      data != null && Object.prototype.hasOwnProperty.call(data, "onboarding_completed"),
  };
}

const SETTINGS_CORE =
  "display_currency, wallet_mode, shared_enabled, usd_enabled, carryover_enabled, goals_enabled";

export async function fetchUserSettings(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserSettings> {
  const attempts = [
    `${SETTINGS_CORE}, shared_funding, onboarding_completed`,
    `${SETTINGS_CORE}, onboarding_completed`,
    `${SETTINGS_CORE}, shared_funding`,
    "display_currency, wallet_mode, shared_enabled, usd_enabled, carryover_enabled, shared_funding, onboarding_completed",
    "display_currency, wallet_mode, shared_enabled, usd_enabled, carryover_enabled, onboarding_completed",
    "display_currency, wallet_mode, shared_enabled, usd_enabled, shared_funding, onboarding_completed",
    "display_currency, wallet_mode, shared_enabled, usd_enabled, onboarding_completed",
    "display_currency, wallet_mode, shared_enabled, usd_enabled",
  ];

  let lastError: { code?: string; message?: string } | null = null;
  for (const columns of attempts) {
    const result = await supabase
      .from("user_settings")
      .select(columns)
      .eq("user_id", userId)
      .maybeSingle();
    if (!result.error) {
      return parseUserSettings(
        result.data as Parameters<typeof parseUserSettings>[0],
      );
    }
    lastError = result.error;
    if (
      !isMissingOnboardingColumn(result.error) &&
      !isMissingSharedFundingColumn(result.error) &&
      !isMissingCarryoverColumn(result.error) &&
      !isMissingGoalsEnabledColumn(result.error)
    ) {
      throw result.error;
    }
  }

  throw lastError ?? new Error("No se pudieron leer los ajustes");
}

export async function saveAccountSetupRemote(
  supabase: SupabaseClient,
  userId: string,
  settings: {
    displayCurrency: DisplayCurrency;
    walletMode: WalletMode;
    sharedEnabled: boolean;
    sharedFunding: SharedFunding;
    usdEnabled: boolean;
    onboardingCompleted: boolean;
  },
): Promise<void> {
  const core = {
    user_id: userId,
    display_currency: settings.displayCurrency,
    wallet_mode: settings.walletMode,
    shared_enabled: settings.sharedEnabled,
    usd_enabled: settings.usdEnabled,
  };
  const attempts = [
    {
      ...core,
      shared_funding: settings.sharedFunding,
      onboarding_completed: settings.onboardingCompleted,
    },
    { ...core, onboarding_completed: settings.onboardingCompleted },
    { ...core, shared_funding: settings.sharedFunding },
    core,
  ];

  let lastError: { code?: string; message?: string } | null = null;
  for (const payload of attempts) {
    const result = await supabase.from("user_settings").upsert(payload);
    if (!result.error) return;
    lastError = result.error;
    if (
      !isMissingOnboardingColumn(result.error) &&
      !isMissingSharedFundingColumn(result.error) &&
      !isMissingCarryoverColumn(result.error)
    ) {
      throw result.error;
    }
  }

  throw lastError ?? new Error("No se pudieron guardar los ajustes");
}

export async function saveCarryoverEnabledRemote(
  supabase: SupabaseClient,
  userId: string,
  enabled: boolean,
): Promise<void> {
  const { error } = await supabase.from("user_settings").upsert({
    user_id: userId,
    carryover_enabled: enabled,
  });
  if (error && !isMissingCarryoverColumn(error)) throw error;
}

export async function saveGoalsEnabledRemote(
  supabase: SupabaseClient,
  userId: string,
  enabled: boolean,
): Promise<void> {
  const { error } = await supabase.from("user_settings").upsert({
    user_id: userId,
    goals_enabled: enabled,
  });
  if (error && !isMissingGoalsEnabledColumn(error)) throw error;
}

type DbSavingsGoal = {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  currency: string;
  saved_amount: number;
  monthly_plan: number | null;
  deduct_from_disponible?: boolean | null;
  target_date: string | null;
  created_at: string;
  completed_at: string | null;
};

function mapGoal(row: DbSavingsGoal): SavingsGoal {
  return {
    id: row.id,
    name: row.name || "Mi meta",
    targetAmount: Number(row.target_amount),
    currency: row.currency === "USD" ? "USD" : "ARS",
    savedAmount: Number(row.saved_amount),
    monthlyPlan:
      row.monthly_plan === null || row.monthly_plan === undefined
        ? null
        : Number(row.monthly_plan),
    deductFromDisponible: row.deduct_from_disponible !== false,
    targetDate: row.target_date,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

function goalToRow(goal: SavingsGoal, userId: string) {
  return {
    id: goal.id,
    user_id: userId,
    name: goal.name,
    target_amount: goal.targetAmount,
    currency: goal.currency,
    saved_amount: goal.savedAmount,
    monthly_plan: goal.monthlyPlan,
    deduct_from_disponible: goal.deductFromDisponible,
    target_date: goal.targetDate,
    created_at: goal.createdAt,
    completed_at: goal.completedAt,
  };
}

export async function fetchSavingsGoals(
  supabase: SupabaseClient,
  userId: string,
): Promise<SavingsGoal[]> {
  const attempts = [
    "id, user_id, name, target_amount, currency, saved_amount, monthly_plan, deduct_from_disponible, target_date, created_at, completed_at",
    "id, user_id, name, target_amount, currency, saved_amount, monthly_plan, target_date, created_at, completed_at",
  ];

  let lastError: { code?: string; message?: string } | null = null;
  for (const columns of attempts) {
    const { data, error } = await supabase
      .from("savings_goals")
      .select(columns)
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (!error) {
      return ((data as unknown as DbSavingsGoal[] | null) ?? []).map(mapGoal);
    }
    lastError = error;
    if (isMissingGoalsTable(error)) return [];
    if (!isMissingColumn(error, "deduct_from_disponible")) throw error;
  }

  throw lastError ?? new Error("No se pudieron leer las metas");
}

export async function upsertSavingsGoalRemote(
  supabase: SupabaseClient,
  userId: string,
  goal: SavingsGoal,
): Promise<void> {
  const row = goalToRow(goal, userId);
  const { error } = await supabase
    .from("savings_goals")
    .upsert(row, { onConflict: "id" });
  if (!error) return;
  if (isMissingGoalsTable(error)) return;
  if (isMissingColumn(error, "deduct_from_disponible")) {
    const { deduct_from_disponible: _, ...without } = row;
    void _;
    const retry = await supabase
      .from("savings_goals")
      .upsert(without, { onConflict: "id" });
    if (retry.error && !isMissingGoalsTable(retry.error)) throw retry.error;
    return;
  }
  throw error;
}

export async function deleteSavingsGoalRemote(
  supabase: SupabaseClient,
  userId: string,
  goalId: string,
): Promise<void> {
  const { error } = await supabase
    .from("savings_goals")
    .delete()
    .eq("id", goalId)
    .eq("user_id", userId);
  if (error && !isMissingGoalsTable(error)) throw error;
}

export async function replaceSavingsGoalsRemote(
  supabase: SupabaseClient,
  userId: string,
  goals: SavingsGoal[],
): Promise<void> {
  const { error: delError } = await supabase
    .from("savings_goals")
    .delete()
    .eq("user_id", userId);
  if (delError) {
    if (isMissingGoalsTable(delError)) return;
    throw delError;
  }
  if (goals.length === 0) return;
  const { error } = await supabase
    .from("savings_goals")
    .insert(goals.map((goal) => goalToRow(goal, userId)));
  if (error && !isMissingGoalsTable(error)) throw error;
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

export async function saveSharedFundingRemote(
  supabase: SupabaseClient,
  userId: string,
  funding: SharedFunding,
): Promise<void> {
  const { error } = await supabase.from("user_settings").upsert({
    user_id: userId,
    shared_funding: funding,
  });
  if (error) throw error;
}

/** Cómo cuenta este grupo en tu mes. Si la RPC no existe, usa el default de la cuenta. */
export async function saveHouseholdSharedFunding(
  supabase: SupabaseClient,
  userId: string,
  householdId: string,
  funding: SharedFunding,
): Promise<"membership" | "settings"> {
  const { error } = await supabase.rpc("set_membership_shared_funding", {
    target_household_id: householdId,
    funding,
  });
  if (!error) return "membership";
  if (!isMissingRpc(error, "set_membership_shared_funding")) throw error;
  await saveSharedFundingRemote(supabase, userId, funding);
  return "settings";
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
  householdId: string,
): Promise<void> {
  const { error } = await supabase.rpc("leave_household", {
    target_household_id: householdId,
  });
  if (error) throw error;
}

export async function closeHousehold(
  supabase: SupabaseClient,
  householdId: string,
): Promise<void> {
  const { error } = await supabase.rpc("close_household", {
    target_household_id: householdId,
  });
  if (error) throw error;
}

export function isMissingNoticesTable(error: {
  code?: string;
  message?: string;
} | null): boolean {
  if (!error) return false;
  const message = (error.message ?? "").toLowerCase();
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    message.includes("user_notices")
  );
}

export async function fetchUnreadNotices(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserNotice[]> {
  const { data, error } = await supabase
    .from("user_notices")
    .select("id, kind, title, body, created_at")
    .eq("user_id", userId)
    .is("read_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingNoticesTable(error)) return [];
    throw error;
  }

  return (data ?? []).flatMap((row) => {
    if (row.kind !== "household_closed") return [];
    return [
      {
        id: row.id as string,
        kind: "household_closed",
        title: row.title as string,
        body: row.body as string,
        createdAt: row.created_at as string,
      },
    ];
  });
}

export async function dismissNotice(
  supabase: SupabaseClient,
  noticeId: string,
): Promise<void> {
  const { error } = await supabase
    .from("user_notices")
    .update({ read_at: new Date().toISOString() })
    .eq("id", noticeId);
  if (error) {
    if (isMissingNoticesTable(error)) return;
    throw error;
  }
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

  const settingsPayload = {
    user_id: userId,
    display_currency: local.displayCurrency,
    wallet_mode: local.walletMode,
    shared_enabled: local.sharedEnabled,
    usd_enabled: local.usdEnabled,
    carryover_enabled: local.carryoverEnabled,
    goals_enabled: local.goalsEnabled === true,
    onboarding_completed: true,
  };
  const firstSettings = await supabase.from("user_settings").upsert(settingsPayload);
  if (firstSettings.error && isMissingOnboardingColumn(firstSettings.error)) {
    const retry = await supabase.from("user_settings").upsert({
      user_id: settingsPayload.user_id,
      display_currency: settingsPayload.display_currency,
      wallet_mode: settingsPayload.wallet_mode,
      shared_enabled: settingsPayload.shared_enabled,
      usd_enabled: settingsPayload.usd_enabled,
      carryover_enabled: settingsPayload.carryover_enabled,
      goals_enabled: settingsPayload.goals_enabled,
    });
    if (retry.error && isMissingGoalsEnabledColumn(retry.error)) {
      const retryNoGoals = await supabase.from("user_settings").upsert({
        user_id: settingsPayload.user_id,
        display_currency: settingsPayload.display_currency,
        wallet_mode: settingsPayload.wallet_mode,
        shared_enabled: settingsPayload.shared_enabled,
        usd_enabled: settingsPayload.usd_enabled,
        carryover_enabled: settingsPayload.carryover_enabled,
      });
      if (retryNoGoals.error) throw retryNoGoals.error;
    } else if (retry.error) {
      throw retry.error;
    }
  } else if (firstSettings.error && isMissingGoalsEnabledColumn(firstSettings.error)) {
    const retry = await supabase.from("user_settings").upsert({
      user_id: settingsPayload.user_id,
      display_currency: settingsPayload.display_currency,
      wallet_mode: settingsPayload.wallet_mode,
      shared_enabled: settingsPayload.shared_enabled,
      usd_enabled: settingsPayload.usd_enabled,
      carryover_enabled: settingsPayload.carryover_enabled,
      onboarding_completed: true,
    });
    if (retry.error && isMissingOnboardingColumn(retry.error)) {
      const retryCore = await supabase.from("user_settings").upsert({
        user_id: settingsPayload.user_id,
        display_currency: settingsPayload.display_currency,
        wallet_mode: settingsPayload.wallet_mode,
        shared_enabled: settingsPayload.shared_enabled,
        usd_enabled: settingsPayload.usd_enabled,
        carryover_enabled: settingsPayload.carryover_enabled,
      });
      if (retryCore.error) throw retryCore.error;
    } else if (retry.error) {
      throw retry.error;
    }
  } else if (firstSettings.error) {
    throw firstSettings.error;
  }

  if ((local.savingsGoals?.length ?? 0) > 0) {
    await replaceSavingsGoalsRemote(supabase, userId, local.savingsGoals ?? []);
  }
}
