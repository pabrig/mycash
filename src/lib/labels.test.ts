import { describe, expect, it } from "vitest";
import {
  expenseCategoryLabel,
  incomeSourceLabel,
  normalizeIncomeSource,
  INCOME_KIND_LABELS,
  EXPENSE_KIND_LABELS,
} from "./labels";

describe("labels", () => {
  it("shows category names people actually use", () => {
    expect(expenseCategoryLabel("alimentacion")).toBe("Alimentación");
    expect(expenseCategoryLabel("salidas")).toBe("Salidas");
    expect(expenseCategoryLabel("educacion")).toBe("Educación");
    expect(expenseCategoryLabel("deporte")).toBe("Deporte");
    expect(expenseCategoryLabel("cultura")).toBe("Cultura");
    expect(expenseCategoryLabel("entretenimiento")).toBe("Entretenimiento");
    expect(expenseCategoryLabel("escuela")).toBe("Educación");
    expect(expenseCategoryLabel("deportes")).toBe("Deporte");
  });

  it("shows generic income sources", () => {
    expect(incomeSourceLabel("sueldo")).toBe("Sueldo");
    expect(incomeSourceLabel("alquiler")).toBe("Alquiler");
    expect(incomeSourceLabel("freelance")).toBe("Freelance");
  });

  it("hides old personal source ids behind generic names", () => {
    expect(incomeSourceLabel("itti")).toBe("Sueldo");
    expect(incomeSourceLabel("alquiler_serena")).toBe("Alquiler");
    expect(incomeSourceLabel("alquiler_obispo")).toBe("Alquiler");
    expect(normalizeIncomeSource("itti")).toBe("sueldo");
    expect(normalizeIncomeSource("alquiler_obispo")).toBe("alquiler");
  });

  it("uses everyday words for income and expense kinds", () => {
    expect(INCOME_KIND_LABELS.active).toBe("Trabajo");
    expect(INCOME_KIND_LABELS.passive).toBe("Rentas");
    expect(EXPENSE_KIND_LABELS.fixed).toBe("Todos los meses");
    expect(EXPENSE_KIND_LABELS.variable).toBe("Una vez");
  });
});
