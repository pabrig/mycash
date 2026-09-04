/** Textos visibles. Los ids internos no cambian. */

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  alimentacion: "Alimentación",
  servicios: "Servicios",
  transporte: "Transporte",
  educacion: "Educación",
  deporte: "Deporte",
  cultura: "Cultura",
  entretenimiento: "Entretenimiento",
  salud: "Salud",
  streaming: "Streaming",
  seguros: "Seguros",
  alquiler: "Alquiler",
  salidas: "Salidas",
  extras: "Extras",
  otros: "Otros",
};

export const EXPENSE_CATEGORY_ICONS: Record<string, string> = {
  alimentacion: "🛒",
  servicios: "💡",
  transporte: "⛽",
  educacion: "🎓",
  deporte: "🏃",
  cultura: "🎭",
  entretenimiento: "🎥",
  salud: "🏥",
  streaming: "📺",
  seguros: "🛡️",
  alquiler: "🏠",
  salidas: "🍽️",
  extras: "📦",
  otros: "•••",
};

export const INCOME_SOURCE_LABELS: Record<string, string> = {
  sueldo: "Sueldo",
  freelance: "Freelance",
  alquiler: "Alquiler",
  inversion: "Inversión",
  otros: "Otros",
  /** Ids viejos: no se ofrecen al cargar, se muestran genéricos. */
  itti: "Sueldo",
  alquiler_serena: "Alquiler",
  alquiler_obispo: "Alquiler",
};

export const INCOME_KIND_LABELS = {
  active: "Trabajo",
  passive: "Rentas",
} as const;

export const EXPENSE_KIND_LABELS = {
  fixed: "Todos los meses",
  variable: "Una vez",
} as const;

export function expenseCategoryLabel(id: string | undefined): string {
  if (!id) return "";
  if (id === "escuela") return EXPENSE_CATEGORY_LABELS.educacion;
  if (id === "deportes") return EXPENSE_CATEGORY_LABELS.deporte;
  return EXPENSE_CATEGORY_LABELS[id] ?? humanizeSlug(id);
}

export function expenseCategoryIcon(id: string | undefined): string {
  if (!id) return "";
  if (id === "escuela") return EXPENSE_CATEGORY_ICONS.educacion ?? "";
  if (id === "deportes") return EXPENSE_CATEGORY_ICONS.deporte ?? "";
  return EXPENSE_CATEGORY_ICONS[id] ?? "";
}

export function incomeSourceLabel(id: string | undefined): string {
  if (!id) return "";
  return INCOME_SOURCE_LABELS[id] ?? humanizeSlug(id);
}

/** Ids personales viejos → opción genérica del formulario. */
export function normalizeIncomeSource(id: string): string {
  if (id === "itti") return "sueldo";
  if (id === "alquiler_serena" || id === "alquiler_obispo") return "alquiler";
  if (id in INCOME_SOURCE_LABELS) return id;
  return "otros";
}

function humanizeSlug(id: string): string {
  const text = id.replace(/_/g, " ").trim();
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}
