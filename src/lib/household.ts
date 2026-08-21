import type { ExpenseScope } from "@/lib/types";

/** Caps F&F — deben coincidir con supabase/migrations/008_multi_household.sql */
export const MAX_HOUSEHOLDS_PER_USER = 8;
export const MAX_MEMBERS_PER_HOUSEHOLD = 8;

/**
 * household_id a persistir en un movimiento.
 * Personal → null. Shared en nube → el elegido, o el grupo activo.
 */
export function resolveSharedHouseholdId(
  scope: ExpenseScope | undefined,
  explicitId: string | undefined,
  activeHouseholdId: string | null,
): string | null {
  if (scope !== "shared") return null;
  const id = explicitId?.trim() || activeHouseholdId;
  return id || null;
}
