import {
  settingsForMoneyProfile,
  type MoneyProfile,
} from "./money-profile";
import type { SharedFunding, WalletMode } from "./types";
export const SHARED_FUNDING_OPTIONS: {
  id: SharedFunding;
  title: string;
  description: string;
  example: string;
}[] = [
  {
    id: "payer",
    title: "De quien lo pagó",
    description:
      "Cada uno anota lo que pagó. Eso resta de su propia plata. El otro lo ve, pero no le descuenta.",
    example:
      "Vos pagás el súper: sale de tu mes. Tu pareja ve el gasto, pero no le resta.",
  },
  {
    id: "pool",
    title: "De la plata del grupo",
    description:
      "El grupo tiene ingresos y gastos juntos. Se parten entre todos y eso entra en tu mes, solo.",
    example:
      "Entran $200.000 al grupo y gastan $80.000. Si son dos, a vos te suman $100.000 y te restan $40.000.",
  },
];

export const MONEY_PROFILE_OPTIONS: {
  id: MoneyProfile;
  title: string;
  description: string;
  example: string;
  hint: string;
}[] = [
  {
    id: "ars_only",
    title: "Solo pesos",
    description: "Cobrás y pagás todo en pesos. No usás dólares.",
    example: "El sueldo, el súper, los servicios: todo en pesos.",
    hint: "Todo queda en pesos. Lo que ya cargaste en dólares se sigue contando.",
  },
  {
    id: "ars_savings",
    title: "Pesos, y ahorro en dólares",
    description:
      "Cobrás en pesos. Lo que te sobra a fin de mes lo pasás a dólares.",
    example:
      "Si un mes lo necesitás, lo usás o lo volvés a pesos. No hace falta cargar ingresos en dólares.",
    hint: "En inicio ves Diario (pesos) y Ahorro (dólares). Pasás el sobrante, y si hace falta lo gastás del ahorro o lo volvés a diario.",
  },
  {
    id: "dual",
    title: "Pesos y dólares",
    description:
      "Tenés plata en las dos. Cobrás o gastás en pesos y también en dólares.",
    example: "Por ejemplo: sueldo en pesos y algún ingreso o gasto en dólares.",
    hint: "Vas a poder anotar ingresos y gastos en las dos monedas.",
  },
];

export const WALLET_VIEW_OPTIONS: {
  id: WalletMode;
  title: string;
  description: string;
}[] = [
  {
    id: "unified",
    title: "Todo junto",
    description: "Un solo número. Toda tu plata, pesos y dólares, en un lugar.",
  },
  {
    id: "split",
    title: "Dos lugares",
    description:
      "Uno para el día a día en pesos. Otro para los dólares que no querés gastar.",
  },
];

export const SHARED_SETUP_OPTIONS: {
  id: boolean;
  title: string;
  description: string;
}[] = [
  {
    id: false,
    title: "No, solo yo",
    description: "Anoto nada más lo mío.",
  },
  {
    id: true,
    title: "Sí, con otras personas",
    description:
      "Gastos de la casa, la pareja o con quien viva. Cada uno sigue viendo su propia plata. Después invitás a alguien desde Cuenta.",
  },
];

export type OnboardingStep =
  | "welcome"
  | "money"
  | "view"
  | "shared"
  | "shared_funding"
  | "howto_movements"
  | "howto_period"
  | "howto_goals"
  | "howto_split"
  | "howto_shared"
  | "done";

export const HOWTO_MOVEMENTS = {
  title: "Cómo anotar tu plata",
  sub: "La app no se conecta al banco. Vos anotá lo que cobrás y lo que pagás.",
  items: [
    {
      title: "El botón +",
      body: "Está abajo, en el medio. Tocá ahí para cargar un movimiento.",
    },
    {
      title: "Hoy, antes o después",
      body: "No tiene que ser de hoy. Podés anotar un gasto o un cobro que ya pasó, o uno que viene.",
    },
    {
      title: "Lo que entra",
      body: "Un sueldo, un trabajo, un extra. Es plata que cobrás.",
    },
    {
      title: "Lo que sale",
      body: "El súper, un servicio, un taxi. Es plata que pagás.",
    },
    {
      title: "Si te equivocás",
      body: "Tocá el movimiento en la lista y lo cambiás o lo borrás.",
    },
  ],
} as const;

export const HOWTO_PERIOD = {
  title: "Mes y año",
  sub: "Arriba hay dos botones: Mes y Año. No cambia tu plata: cambia hasta dónde mirás.",
  items: [
    {
      title: "Mes",
      body: "Cuánto te queda este mes. En Cuenta podés activar el arrastre anual para sumar meses anteriores. Deslizá para cambiar de mes.",
    },
    {
      title: "Año",
      body: "Junta lo que te fue quedando mes a mes. Sirve para ver cómo venís en el año, no cada gasto.",
    },
  ],
} as const;

export const HOWTO_CARRYOVER = {
  title: "Arrastre anual",
  sub: "Es un interruptor en Cuenta. Cambia cómo se calcula “te queda” en la vista Mes.",
  items: [
    {
      title: "Encendido",
      body: "En Mes suma lo que te fue quedando desde enero. Útil si querés ver el acumulado del año mientras mirás el mes.",
    },
    {
      title: "Apagado",
      body: "En Mes solo ves el mes actual. El Año sigue juntando mes a mes igual.",
    },
    {
      title: "Lo podés cambiar",
      body: "En Cuenta → Arrastre anual. No borra movimientos: solo cambia cómo se muestra el número.",
    },
  ],
} as const;

export const HOWTO_MONEY = {
  title: "Cómo es tu plata",
  sub: "En Cuenta elegís cómo cobrás y si usás dólares. Se puede cambiar cuando quieras.",
  items: [
    {
      title: "Solo pesos",
      body: "Todo se ve en pesos. Simple si no manejás dólares.",
    },
    {
      title: "Pesos y ahorro en dólares",
      body: "Cobrás en pesos y podés pasar sobrante a dólares cuando quieras.",
    },
    {
      title: "Pesos y dólares",
      body: "Cargás las dos monedas. Después elegís si las ves juntas o en dos lugares.",
    },
  ],
} as const;

export const HOWTO_VIEW = {
  title: "Cómo querés verla",
  sub: "Solo aparece si usás pesos y dólares. Elegís un número solo o Diario y Ahorro aparte.",
  items: [
    {
      title: "Todo junto",
      body: "Un solo disponible. Pesos y dólares se muestran convertidos al tipo de cambio del mes.",
    },
    {
      title: "Diario y ahorro",
      body: "Dos lugares: lo del día a día en pesos, y el ahorro en dólares. No se mezclan en el número principal.",
    },
    {
      title: "Dónde se cambia",
      body: "Cuenta → Cómo es tu plata → Pesos y dólares → Cómo querés verla.",
    },
  ],
} as const;

export const HOWTO_GOALS = {
  title: "Metas",
  sub: "Son opcionales. Sirven para juntar plata con un objetivo concreto (viaje, fondo, auto). Si no las usás, la app sigue igual.",
  items: [
    {
      title: "Se activan en Cuenta",
      body: "En Cuenta → Metas. Apagado: no aparece la sección. Encendido: las ves en Inicio.",
    },
    {
      title: "Creás un objetivo",
      body: "Nombre, monto total a juntar y, si querés, una fecha. Con fecha te sugerimos cuánto apartar por mes.",
    },
    {
      title: "Vas sumando aportes",
      body: "Cuando apartás plata, lo anatás en la meta. Ves cuánto juntaste, cuánto falta y el %.",
    },
    {
      title: "Recordatorio o resta del disponible",
      body: "Solo recordatorio: te muestra el aporte del mes, pero “te queda” no cambia. Resta del disponible: ese aporte se resta de lo libre este mes, como si ya lo hubieras apartado.",
    },
  ],
} as const;

export const HOWTO_SPLIT = {
  title: "Dividir una cuenta",
  sub: "Abajo está la pestaña Dividir. Sirve para un asado, un viaje o un finde. No es la plata del mes.",
  items: [
    {
      title: "Armás el evento",
      body: "Le ponés un nombre y quiénes están. Después cargás lo que vaya pagando cada uno.",
    },
    {
      title: "Partes iguales",
      body: "Al final te dice quién le tiene que pasar a quién, para que queden parejos.",
    },
    {
      title: "Tu parte, si querés",
      body: "Cuando termina, podés anotar tu parte en tu mes. El resto no se mezcla con tu cuenta.",
    },
  ],
} as const;

export const HOWTO_SHARED = {
  title: "Gastos con otras personas",
  sub: "Aparece la pestaña Compartido. Podés tener más de un grupo: casa, amigos, un viaje. Cada uno tiene su lista.",
  items: [
    {
      title: "Elegís el grupo",
      body: "Cuando cargás un gasto compartido, decís a qué grupo va. Casa no se mezcla con amigos.",
    },
    {
      title: "De dónde sale",
      body: "Cada grupo puede ser distinto. De quien pagó: el súper que cargás sale de tu plata. De la plata del grupo: lo que entra y sale se parte y entra solo en tu mes. Lo elegís en Cuenta, por grupo.",
    },
    {
      title: "Invitar",
      body: "Desde Cuenta creás un grupo y mandás un código. Quien entra ve esa lista, no las otras.",
    },
  ],
} as const;

/** Pasos del wizard según lo que eligió. Una idea por pantalla. */
export function onboardingSteps(input: {
  moneyProfile: MoneyProfile | null;
  askShared: boolean;
  sharedEnabled: boolean | null;
  showSharedHowTo: boolean;
  includeGoalsHowTo?: boolean;
}): OnboardingStep[] {
  const steps: OnboardingStep[] = ["welcome", "money"];
  if (input.moneyProfile === "dual") steps.push("view");
  if (input.askShared) steps.push("shared");
  if (input.sharedEnabled === true) steps.push("shared_funding");
  steps.push("howto_movements", "howto_period");
  if (input.includeGoalsHowTo !== false) steps.push("howto_goals");
  steps.push("howto_split");
  if (input.showSharedHowTo) steps.push("howto_shared");
  steps.push("done");
  return steps;
}

/**
 * Guía opcional (tipo FAQ): solo explica cómo funciona, sin volver a armar la cuenta.
 */
export function onboardingGuideSteps(input: {
  showSharedHowTo: boolean;
  includeGoalsHowTo?: boolean;
}): OnboardingStep[] {
  const steps: OnboardingStep[] = [
    "welcome",
    "howto_movements",
    "howto_period",
  ];
  if (input.includeGoalsHowTo !== false) steps.push("howto_goals");
  steps.push("howto_split");
  if (input.showSharedHowTo) steps.push("howto_shared");
  steps.push("done");
  return steps;
}

/** Temas de la guía tipo FAQ (después del login, desde Cuenta). */
export const GUIDE_TOPIC_IDS = [
  "anotar",
  "mes-ano",
  "arrastre",
  "plata",
  "vista",
  "metas",
  "dividir",
  "compartido",
] as const;

export type GuideTopicId = (typeof GUIDE_TOPIC_IDS)[number];

export type GuideHowTo = {
  title: string;
  sub: string;
  items: readonly { title: string; body: string }[];
};

export type GuideTopic = {
  id: GuideTopicId;
  title: string;
  blurb: string;
  /** Agrupa en el índice FAQ. */
  group: "uso" | "cuenta";
  content: GuideHowTo;
  /** Ocultar si el feature no aplica. */
  requires?: "goals" | "shared";
};

const GUIDE_TOPICS: GuideTopic[] = [
  {
    id: "anotar",
    title: HOWTO_MOVEMENTS.title,
    blurb: "El botón +, ingresos, gastos y cómo corregir.",
    group: "uso",
    content: HOWTO_MOVEMENTS,
  },
  {
    id: "mes-ano",
    title: HOWTO_PERIOD.title,
    blurb: "Qué muestra Mes y qué muestra Año.",
    group: "uso",
    content: HOWTO_PERIOD,
  },
  {
    id: "dividir",
    title: HOWTO_SPLIT.title,
    blurb: "Asado, viaje o finde: partes iguales, aparte del mes.",
    group: "uso",
    content: HOWTO_SPLIT,
  },
  {
    id: "arrastre",
    title: HOWTO_CARRYOVER.title,
    blurb: "Si el mes suma lo que te fue quedando desde enero.",
    group: "cuenta",
    content: HOWTO_CARRYOVER,
  },
  {
    id: "plata",
    title: HOWTO_MONEY.title,
    blurb: "Pesos, dólares y cómo cobrás.",
    group: "cuenta",
    content: HOWTO_MONEY,
  },
  {
    id: "vista",
    title: HOWTO_VIEW.title,
    blurb: "Todo junto o Diario y Ahorro aparte.",
    group: "cuenta",
    content: HOWTO_VIEW,
  },
  {
    id: "metas",
    title: HOWTO_GOALS.title,
    blurb: "Objetivos opcionales y si restan del disponible.",
    group: "cuenta",
    content: HOWTO_GOALS,
    requires: "goals",
  },
  {
    id: "compartido",
    title: HOWTO_SHARED.title,
    blurb: "Grupos, de dónde sale la plata e invitaciones.",
    group: "cuenta",
    content: HOWTO_SHARED,
    requires: "shared",
  },
];

export function parseGuideTopic(raw: string | null | undefined): GuideTopicId | null {
  if (!raw) return null;
  const value = raw.trim().toLowerCase();
  return (GUIDE_TOPIC_IDS as readonly string[]).includes(value)
    ? (value as GuideTopicId)
    : null;
}

/** Link a la guía FAQ. Con tema abre ese artículo. */
export function guideHref(topic?: GuideTopicId | null): string {
  if (!topic) return "/onboarding?guia=1";
  return `/onboarding?guia=1&tema=${topic}`;
}

export function getGuideTopic(id: GuideTopicId): GuideTopic | null {
  return GUIDE_TOPICS.find((t) => t.id === id) ?? null;
}

export function listGuideTopics(input: {
  includeGoals?: boolean;
  includeShared?: boolean;
}): GuideTopic[] {
  return GUIDE_TOPICS.filter((topic) => {
    if (topic.requires === "goals" && input.includeGoals === false) return false;
    if (topic.requires === "shared" && input.includeShared === false) return false;
    return true;
  });
}

export function guideTopicsByGroup(topics: GuideTopic[]): {
  uso: GuideTopic[];
  cuenta: GuideTopic[];
} {
  return {
    uso: topics.filter((t) => t.group === "uso"),
    cuenta: topics.filter((t) => t.group === "cuenta"),
  };
}

export function isSetupQuestionStep(step: OnboardingStep): boolean {
  return (
    step === "money" ||
    step === "view" ||
    step === "shared" ||
    step === "shared_funding"
  );
}

export function greetingName(displayName: string | undefined | null): string {
  const name = displayName?.trim();
  if (!name) return "";
  return name.split(/\s+/)[0] ?? "";
}

/** Sin fila / columna vieja: no bloquear a quien ya usa la app. */
export function isOnboardingDone(value: boolean | null | undefined): boolean {
  return value !== false;
}

/**
 * Replay local gana: sirve para ver el wizard de nuevo en esta máquina
 * sin tocar el flag de la nube. Si no hay replay, la columna en la nube
 * es la verdad. Sin migración: se considera hecho.
 */
export function resolveOnboardingCompleted(input: {
  tracked: boolean;
  completed: boolean;
  replay: boolean;
}): boolean {
  if (input.replay) return false;
  if (input.tracked) return input.completed;
  return true;
}

export function setupSummaryLines(
  profile: MoneyProfile,
  walletMode: WalletMode,
  sharedEnabled: boolean,
  sharedFunding: SharedFunding = "payer",
): string[] {
  const lines: string[] = [];
  switch (profile) {
    case "ars_only":
      lines.push("Tu plata se ve en pesos.");
      break;
    case "ars_savings":
      lines.push("Cobrás en pesos y podés pasar el sobrante a dólares.");
      break;
    case "dual":
      lines.push(
        walletMode === "split"
          ? "Cargás pesos y dólares. Diario y ahorro, aparte."
          : "Cargás pesos y dólares. Los ves juntos.",
      );
      break;
  }
  if (sharedEnabled) {
    lines.push("También podés anotar gastos con otras personas.");
    lines.push(
      sharedFunding === "pool"
        ? "Los gastos del grupo salen de la plata compartida."
        : "Cada uno anota lo que pagó, de su propia plata.",
    );
  } else {
    lines.push("Por ahora, solo tu plata.");
  }
  return lines;
}

export function resolvedWalletMode(
  profile: MoneyProfile,
  walletMode: WalletMode | null,
): WalletMode {
  if (profile !== "dual") {
    return settingsForMoneyProfile(profile, "unified").walletMode;
  }
  return walletMode === "split" ? "split" : "unified";
}

export function canContinueOnboarding(
  step: OnboardingStep,
  input: {
    moneyProfile: MoneyProfile | null;
    walletMode: WalletMode | null;
    sharedEnabled: boolean | null;
    sharedFunding?: SharedFunding | null;
  },
): boolean {
  switch (step) {
    case "welcome":
    case "howto_movements":
    case "howto_period":
    case "howto_goals":
    case "howto_split":
    case "howto_shared":
    case "done":
      return true;
    case "money":
      return input.moneyProfile != null;
    case "view":
      return input.walletMode != null;
    case "shared":
      return input.sharedEnabled != null;
    case "shared_funding":
      return input.sharedFunding != null;
  }
}
