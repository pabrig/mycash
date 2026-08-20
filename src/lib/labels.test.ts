import { describe, expect, it } from "vitest";
import {
  expenseCategoryLabel,
  incomeSourceLabel,
  INCOME_KIND_LABELS,
  EXPENSE_KIND_LABELS,
} from "./labels";

describe("labels", () => {
  it("shows category names people actually use", () => {
    expect(expenseCategoryLabel("alimentacion")).toBe("Alimentación");
    expect(expenseCategoryLabel("salidas")).toBe("Salidas");
  });

  it("shows income sources without underscores", () => {
    expect(incomeSourceLabel("alquiler_serena")).toBe("Alquiler Serena");
    expect(incomeSourceLabel("sueldo")).toBe("Sueldo");
  });

  it("uses everyday words for income and expense kinds", () => {
    expect(INCOME_KIND_LABELS.active).toBe("Trabajo");
    expect(INCOME_KIND_LABELS.passive).toBe("Rentas");
    expect(EXPENSE_KIND_LABELS.fixed).toBe("Todos los meses");
    expect(EXPENSE_KIND_LABELS.variable).toBe("Una vez");
  });
});
