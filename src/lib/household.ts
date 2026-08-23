import type { ExpenseScope } from "@/lib/types";

/** Caps F&F — deben coincidir con supabase/migrations/008_multi_household.sql */
export const MAX_HOUSEHOLDS_PER_USER = 8;
export const MAX_MEMBERS_PER_HOUSEHOLD = 8;
export const HOUSEHOLD_NAME_MAX = 40;

/** Vacío → null. Recorta a 40, como al crear el grupo. */
export function normalizeHouseholdName(name: string): string | null {
  const n = name.trim().replace(/\s+/g, " ");
  if (!n) return null;
  return n.length > HOUSEHOLD_NAME_MAX ? n.slice(0, HOUSEHOLD_NAME_MAX) : n;
}

/** Confirmación al dueño antes de disolver el grupo. */
export function closeHouseholdConfirmMessage(
  groupName: string,
  otherNames: string[],
): string {
  const name = groupName.trim() || "este grupo";
  if (otherNames.length === 0) {
    return `¿Borrar ${name}? Se van los gastos compartidos de esta lista.`;
  }
  if (otherNames.length === 1) {
    return `¿Cerrar ${name}? Se borra la lista de todos. Le avisamos a ${otherNames[0]}.`;
  }
  const last = otherNames[otherNames.length - 1] ?? "";
  const rest = otherNames.slice(0, -1).join(", ");
  return `¿Cerrar ${name}? Se borra la lista de todos. Les avisamos a ${rest} y ${last}.`;
}

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
