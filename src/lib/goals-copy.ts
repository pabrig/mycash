import {
  effectiveMonthlyPlan,
  goalProgressPercent,
  goalRemaining,
  goalReservesFromLibre,
  isGoalComplete,
  monthsUntilDate,
  suggestedMonthlyPlan,
  type GoalPlace,
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

export function goalPlaceLabel(place: GoalPlace): string {
  switch (place) {
    case "diario":
      return "Diario";
    case "ahorro":
      return "Ahorro";
    case "disponible":
      return "Tu libre";
  }
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
      "Creá una con un monto y, si querés, de qué plata es. Después vas apartando lo que guardás.",
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
  placeLabel: string;
} {
  const placeLabel = goalPlaceLabel(goal.place);
  const pct = goalProgressPercent(goal);
  if (isGoalComplete(goal)) {
    return {
      status: "Completada",
      detail: `Juntaste ${money(goal.targetAmount, goal.currency)}`,
      plan: null,
      planMode: null,
      planModeLabel: null,
      placeLabel,
    };
  }

  const remaining = goalRemaining(goal);
  const planAmount = effectiveMonthlyPlan(goal);
  const suggested = suggestedMonthlyPlan(goal);
  const hasExplicitPlan = goal.monthlyPlan != null && goal.monthlyPlan > 0;
  const reserves = goalReservesFromLibre(goal);

  let plan: string | null = null;
  let planMode: "guide" | "deduct" | null = null;
  let planModeLabel: string | null = null;

  if (planAmount > 0) {
    planMode = reserves ? "deduct" : "guide";
    planModeLabel = reserves
      ? goal.place === "diario"
        ? "Resta del Diario"
        : "Resta del libre"
      : "Solo recordatorio";
    if (hasExplicitPlan || reserves) {
      plan = reserves
        ? `Este mes cuenta ${money(planAmount, goal.currency)} como ya apartados`
        : `Este mes: apartá ${money(planAmount, goal.currency)} (no baja el libre)`;
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
    placeLabel,
  };
}

export function goalsReservedCopy(
  reservedArs: number,
  freeArs: number,
  formatArs: (n: number) => string,
  opts?: { split?: boolean },
): { reserved: string; free: string; hint: string } | null {
  if (reservedArs <= 0) return null;
  const freeLabel = opts?.split ? "Libre en Diario" : "Libre para gastar";
  const hint = opts?.split
    ? "Suma de metas del Diario con “resta del libre” este mes."
    : "Suma de metas con “resta del libre” este mes.";
  return {
    reserved: `Ya contado en metas: ${formatArs(reservedArs)}`,
    free: `${freeLabel}: ${formatArs(freeArs)}`,
    hint,
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
  placeLabel: string;
  placeDiario: string;
  placeDiarioHint: string;
  placeAhorro: string;
  placeAhorroHint: string;
  planLabel: string;
  planHint: string;
  planModeLabel: string;
  planModeGuide: string;
  planModeGuideHint: string;
  planModeDeduct: string;
  planModeDeductHint: string;
  planModeAhorroHint: string;
  savedLabel: string;
  savedHint: string;
  save: string;
  delete: string;
  deleteConfirm: string;
  contribute: string;
  contributeHint: string;
  contributeHintAhorro: string;
  contributeAction: string;
  contributeUsePlan: string;
  editMeta: string;
  cancel: string;
  moreOptions: string;
  moreOptionsHint: string;
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
    placeLabel: "¿De qué plata es esta meta?",
    placeDiario: "Diario",
    placeDiarioHint: "Sale del día a día en pesos. Podés reservar del libre.",
    placeAhorro: "Ahorro",
    placeAhorroHint:
      "Vive en el bolsillo USD. Cuando pases el sobrante a dólares, anotá el aporte acá.",
    planLabel: "Plan de este mes",
    planHint: "Opcional. Cuánto pensás apartar.",
    planModeLabel: "¿Contarlo en “te queda”?",
    planModeGuide: "No, solo recordame",
    planModeGuideHint: "Te lo mostramos en la meta, sin tocar el libre.",
    planModeDeduct: "Sí, ya lo reservo",
    planModeDeductHint:
      "Se resta de lo libre este mes, como si ya lo hubieras apartado.",
    planModeAhorroHint:
      "Las metas de Ahorro no tocan el Diario: el plan es solo un recordatorio.",
    savedLabel: "Ya juntaste",
    savedHint: "Opcional. Lo que ya tenés guardado hoy.",
    save: isEdit ? "Guardar cambios" : "Crear meta",
    delete: "Borrar meta",
    deleteConfirm: "¿Borrar esta meta? No se puede deshacer.",
    contribute: "Apartar",
    contributeHint: "Cuando apartás plata, anotalo para ver el progreso.",
    contributeHintAhorro:
      "Cuando pases el sobrante a dólares, anotá el aporte acá. Comprar USD no suma solo a la meta.",
    contributeAction: "Apartar",
    contributeUsePlan: "Usar el plan",
    editMeta: "Editar meta",
    cancel: "Cancelar",
    moreOptions: "Más opciones",
    moreOptionsHint: "Fecha, lo ya juntado y el plan del mes.",
  };
}
