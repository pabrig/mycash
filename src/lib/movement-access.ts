import type { Movement, SharedFunding } from "@/lib/types";

export type MovementListFilter = "all" | "income" | "personal" | "shared";

/** Filtros de la lista del mes (Inicio). */
export function matchesMovementFilter(
  movement: Movement,
  filter: MovementListFilter,
): boolean {
  switch (filter) {
    case "all":
      return true;
    case "income":
      return movement.type === "income";
    case "personal":
      return movement.type === "expense" && movement.scope !== "shared";
    case "shared":
      return movement.scope === "shared";
  }
}

/**
 * Si el movimiento entra en el disponible de este usuario.
 * Payer (default): lo compartido del otro se ve, pero no descuenta (ni suma) acá.
 * Pool: todo lo shared del grupo entra, partido entre los miembros.
 * Local / sin autor: cuenta como propio.
 */
export function affectsUserBalance(
  movement: Movement,
  userId: string | undefined,
  funding: SharedFunding = "payer",
): boolean {
  if (movement.scope !== "shared") return true;
  if (funding === "pool") return true;
  if (!userId || !movement.createdByUserId) return true;
  return movement.createdByUserId === userId;
}

/** Cuántos miembros parten un gasto/ingreso del grupo. Sin dato, 1. */
export function householdShareCount(
  householdId: string | undefined,
  memberCounts: Record<string, number>,
): number {
  if (!householdId) return 1;
  return Math.max(1, memberCounts[householdId] ?? 1);
}

/**
 * Movimientos que entran en tu mes, con el monto que te toca.
 * Payer: el shared propio al 100%. Pool: cada shared del grupo ÷ miembros.
 */
export function movementsForPersonalBalance(
  movements: Movement[],
  userId: string | undefined,
  funding: SharedFunding,
  memberCounts: Record<string, number>,
): Movement[] {
  const result: Movement[] = [];
  for (const movement of movements) {
    if (!affectsUserBalance(movement, userId, funding)) continue;
    if (movement.scope !== "shared" || funding !== "pool") {
      result.push(movement);
      continue;
    }
    const n = householdShareCount(movement.householdId, memberCounts);
    result.push(n === 1 ? movement : { ...movement, amount: movement.amount / n });
  }
  return result;
}

/**
 * Quién puede editar/borrar en la UI.
 * Local (sin nube): siempre.
 * Shared en nube: solo el autor (o sin createdBy → legacy/local).
 * Personal: el dueño de la sesión (la UI solo lista los propios).
 */
export function canManageMovement(
  movement: Movement,
  cloudEnabled: boolean,
  userId: string | undefined,
): boolean {
  if (!cloudEnabled) return true;
  if (movement.scope === "shared") {
    return !movement.createdByUserId || movement.createdByUserId === userId;
  }
  return true;
}

/** Solo paths relativos de la app — evita open redirect (//evil.com, https://…). */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}
