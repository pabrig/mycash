import type { Movement } from "@/lib/types";

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
      return movement.type === "expense" && movement.scope === "shared";
  }
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
