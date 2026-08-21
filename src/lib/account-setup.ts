import {
  settingsForMoneyProfile,
  type MoneyProfile,
} from "./money-profile";
import type { WalletMode } from "./types";

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
  | "howto_movements"
  | "howto_period"
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
      body: "Cuánto te queda este mes: lo que cobraste menos lo que gastaste. Es el día a día.",
    },
    {
      title: "Año",
      body: "Junta lo que te fue quedando mes a mes. Sirve para ver cómo venís en el año, no cada gasto.",
    },
  ],
} as const;

export const HOWTO_SHARED = {
  title: "Cómo se ven los gastos con otros",
  sub: "Aparece una pestaña que se llama Compartido. Ahí hay una lista que ven todos.",
  items: [
    {
      title: "Cada uno anota lo suyo",
      body: "Si vos pagaste el súper, lo cargás vos. Resta de tu plata.",
    },
    {
      title: "Los demás lo ven",
      body: "El otro lo ve en la lista, pero no le descuenta. No se mezclan las cuentas.",
    },
    {
      title: "Invitar",
      body: "Desde Cuenta mandás un código. Cuando la otra persona entra, ven la misma lista.",
    },
  ],
} as const;

/** Pasos del wizard según lo que eligió. Una idea por pantalla. */
export function onboardingSteps(input: {
  moneyProfile: MoneyProfile | null;
  askShared: boolean;
  showSharedHowTo: boolean;
}): OnboardingStep[] {
  const steps: OnboardingStep[] = ["welcome", "money"];
  if (input.moneyProfile === "dual") steps.push("view");
  if (input.askShared) steps.push("shared");
  steps.push("howto_movements", "howto_period");
  if (input.showSharedHowTo) steps.push("howto_shared");
  steps.push("done");
  return steps;
}

export function isSetupQuestionStep(step: OnboardingStep): boolean {
  return step === "money" || step === "view" || step === "shared";
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
 * Con la columna en la nube, esa es la verdad.
 * Sin migración: al cerrar sesión se marca un replay local para poder
 * probar el wizard otra vez.
 */
export function resolveOnboardingCompleted(input: {
  tracked: boolean;
  completed: boolean;
  replay: boolean;
}): boolean {
  if (input.tracked) return input.completed;
  return !input.replay;
}

export function setupSummaryLines(
  profile: MoneyProfile,
  walletMode: WalletMode,
  sharedEnabled: boolean,
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
  lines.push(
    sharedEnabled
      ? "También podés anotar gastos con otras personas."
      : "Por ahora, solo tu plata.",
  );
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
  },
): boolean {
  switch (step) {
    case "welcome":
    case "howto_movements":
    case "howto_period":
    case "howto_shared":
    case "done":
      return true;
    case "money":
      return input.moneyProfile != null;
    case "view":
      return input.walletMode != null;
    case "shared":
      return input.sharedEnabled != null;
  }
}
