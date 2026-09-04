import {
  effectiveMonthlyPlan,
  goalProgressPercent,
  goalRemaining,
  isGoalComplete,
  monthsUntilDate,
  suggestedMonthlyPlan,
  type SavingsGoal,
} from "./goals";
import { formatMoney, formatUsd } from "./format";
import { MONTH_NAMES } from "./types";

function money(amount: number, currency: SavingsGoal["currency"]): string {
  return currency === "USD" ? formatUsd(amount) : formatMoney(amount);
}

function monthNameFromIso(iso: string): string | null {
  const match = /^(\d{4})-(\d{2})/.exec(iso);
  if (!match) return null;
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return MONTH_NAMES[month - 1]?.toLowerCase() ?? null;
}

export function goalsSettingsCopy(): {
  title: string;
  description: string;
  guideCta: string;
} {
  return {
    title: "Metas",
    description:
      "Para anotar un objetivo concreto (viaje, fondo, auto) y cuánto vas juntando. Apagado: la app sigue igual, sin esta sección.",
    guideCta: "¿Cómo funcionan las metas?",
  };
}

export function goalsHomeCopy(hasGoals: boolean): {
  title: string;
  subtitle: string;
  emptyTitle: string;
  emptyBody: string;
  add: string;
  doneSection: string;
} {
  return {
    title: "Metas",
    subtitle: hasGoals
      ? "Cuánto juntaste y cuánto te falta para cada objetivo."
      : "Un lugar para lo que estás juntando aparte del día a día.",
    emptyTitle: "Todavía no tenés metas",
    emptyBody:
      "Creá una con un monto y, si querés, una fecha. Después vas sumando lo que apartás.",
    add: "Nueva meta",
    doneSection: "Completadas",
  };
}

export function goalProgressCopy(goal: SavingsGoal): {
  status: string;
  detail: string;
  plan: string | null;
  planMode: "guide" | "deduct" | null;
  planModeLabel: string | null;
} {
  const pct = goalProgressPercent(goal);
  if (isGoalComplete(goal)) {
    return {
      status: "Completada",
      detail: `Juntaste ${money(goal.targetAmount, goal.currency)}`,
      plan: null,
      planMode: null,
      planModeLabel: null,
    };
  }

  const remaining = goalRemaining(goal);
  const planAmount = effectiveMonthlyPlan(goal);
  const suggested = suggestedMonthlyPlan(goal);
  const hasExplicitPlan = goal.monthlyPlan != null && goal.monthlyPlan > 0;

  let plan: string | null = null;
  let planMode: "guide" | "deduct" | null = null;
  let planModeLabel: string | null = null;

  if (planAmount > 0) {
    planMode = goal.deductFromDisponible ? "deduct" : "guide";
    planModeLabel = goal.deductFromDisponible
      ? "Resta del disponible"
      : "Solo recordatorio";
    if (hasExplicitPlan || goal.deductFromDisponible) {
      plan = goal.deductFromDisponible
        ? `Este mes cuenta ${money(planAmount, goal.currency)} como ya apartados`
        : `Este mes: apartá ${money(planAmount, goal.currency)} (no baja el disponible)`;
    } else if (suggested && suggested > 0) {
      plan = `Para llegar a tiempo: ~${money(suggested, goal.currency)} por mes`;
    }
  } else if (suggested && suggested > 0) {
    plan = `Para llegar a tiempo: ~${money(suggested, goal.currency)} por mes`;
  } else if (goal.targetDate) {
    const label = monthNameFromIso(goal.targetDate);
    const months = monthsUntilDate(goal.targetDate);
    if (label && months) {
      plan = `Objetivo: ${label} (${months} ${months === 1 ? "mes" : "meses"})`;
    } else if (label) {
      plan = `Objetivo: ${label}`;
    }
  }

  return {
    status: `${money(goal.savedAmount, goal.currency)} de ${money(goal.targetAmount, goal.currency)}`,
    detail: `Te falta ${money(remaining, goal.currency)} · ${pct.toFixed(0)}%`,
    plan,
    planMode,
    planModeLabel,
  };
}

export function goalsReservedCopy(
  reservedArs: number,
  freeArs: number,
  formatArs: (n: number) => string,
): { reserved: string; free: string; hint: string } | null {
  if (reservedArs <= 0) return null;
  return {
    reserved: `Ya contado en metas: ${formatArs(reservedArs)}`,
    free: `Libre para gastar: ${formatArs(freeArs)}`,
    hint: "Suma de metas con “resta del disponible” este mes.",
  };
}

/** Nota corta para la vista año: progreso + impacto en libre, sin ruido. */
export function goalsYearNoteCopy(input: {
  goals: SavingsGoal[];
  yearDisponibleArs: number;
  monthlyReservedArs: number;
  yearProjectedReservedArs: number;
  formatArs: (n: number) => string;
}): {
  title: string;
  progress: string;
  planLine: string | null;
  freeLine: string | null;
  hint: string;
} | null {
  const open = input.goals.filter((g) => !isGoalComplete(g));
  const done = input.goals.filter((g) => isGoalComplete(g));
  if (open.length === 0 && done.length === 0) return null;

  const named = open.slice(0, 2).map((g) => {
    const pct = goalProgressPercent(g);
    return `${g.name}: ${pct.toFixed(0)}% juntado`;
  });
  const extra = open.length - named.length;
  let progress =
    named.length > 0
      ? named.join(" · ")
      : done.length === 1
        ? `${done[0].name}: lista`
        : `${done.length} completadas`;
  if (extra > 0) progress += ` · +${extra}`;

  let planLine: string | null = null;
  let freeLine: string | null = null;

  if (input.monthlyReservedArs > 0 && input.yearProjectedReservedArs > 0) {
    planLine = `Reservás ${input.formatArs(input.monthlyReservedArs)}/mes para metas`;
    const free =
      input.yearDisponibleArs - input.yearProjectedReservedArs;
    freeLine =
      free >= 0
        ? `Si lo cumplís el resto del año, te quedaría libre ≈ ${input.formatArs(free)}`
        : `Ese plan pide más de lo que ahorraste este año (${input.formatArs(Math.abs(free))} de más)`;
  }

  return {
    title: "Metas",
    progress,
    planLine,
    freeLine,
    hint:
      input.monthlyReservedArs > 0
        ? "El ahorro de arriba no cambia: es lo que anotaste. Esto solo marca cuánto queda libre si cumplís el plan."
        : "El ahorro de arriba es lo anotado. Las metas solo dicen para qué estás juntando.",
  };
}

export function goalFormCopy(isEdit: boolean): {
  title: string;
  nameLabel: string;
  namePlaceholder: string;
  targetLabel: string;
  targetHint: string;
  dateLabel: string;
  dateHint: string;
  suggestedPrefix: string;
  planLabel: string;
  planHint: string;
  planModeLabel: string;
  planModeGuide: string;
  planModeGuideHint: string;
  planModeDeduct: string;
  planModeDeductHint: string;
  savedLabel: string;
  savedHint: string;
  save: string;
  delete: string;
  deleteConfirm: string;
  contribute: string;
  contributeHint: string;
  contributeAction: string;
  cancel: string;
} {
  return {
    title: isEdit ? "Editar meta" : "Nueva meta",
    nameLabel: "¿Para qué es?",
    namePlaceholder: "Ej: vacaciones, fondo de emergencia, auto…",
    targetLabel: "¿Cuánto querés juntar en total?",
    targetHint: "",
    dateLabel: "Fecha objetivo",
    dateHint: "Opcional. Sirve para sugerirte un aporte por mes.",
    suggestedPrefix: "Sugerido:",
    planLabel: "Aporte este mes",
    planHint: "Opcional. Cuánto pensás apartar ahora.",
    planModeLabel: "Ese aporte…",
    planModeGuide: "Solo me lo recuerda",
    planModeGuideHint: "No cambia el número de “te queda”.",
    planModeDeduct: "Baja lo disponible",
    planModeDeductHint:
      "Se resta de lo libre este mes, como si ya lo hubieras apartado.",
    savedLabel: "Ya juntaste",
    savedHint: "Opcional. Lo que ya tenés guardado hoy.",
    save: isEdit ? "Guardar cambios" : "Crear meta",
    delete: "Borrar meta",
    deleteConfirm: "¿Borrar esta meta? No se puede deshacer.",
    contribute: "Sumar un aporte",
    contributeHint: "Cuando apartás plata, anotalo acá para ver el progreso.",
    contributeAction: "Sumar",
    cancel: "Cancelar",
  };
}
