import { describe, expect, it } from "vitest";
import {
  sharedCategoryCopy,
  sharedMonthHeroCopy,
  sharedMonthListCopy,
  sharedYearHeroCopy,
} from "./shared-copy";

const today = new Date(2026, 7, 21);

describe("sharedMonthHeroCopy", () => {
  it("names the month and says the mix is of that month", () => {
    const copy = sharedMonthHeroCopy(2026, 8);
    expect(copy.label).toBe("Gastado en el grupo");
    expect(copy.asOf).toBe("Agosto 2026");
    expect(copy.hint).toContain("este mes");
  });
});

describe("sharedYearHeroCopy", () => {
  it("says the hero is the running total up to today", () => {
    const copy = sharedYearHeroCopy(2026, 8, today);
    expect(copy.label).toBe("Gastado hasta hoy");
    expect(copy.asOf).toBe("Suma de enero a agosto");
    expect(copy.hint).toContain("Este es el total del grupo");
    expect(copy.hint).toContain("21 de agosto");
  });

  it("does not pretend empty months were filled", () => {
    const copy = sharedYearHeroCopy(2026, 3, today);
    expect(copy.asOf).toBe("Suma de 3 meses con gastos");
  });

  it("names a full past year when all months have data", () => {
    const copy = sharedYearHeroCopy(2025, 12, today);
    expect(copy.label).toBe("Gastado en el año");
    expect(copy.asOf).toBe("Suma de los 12 meses · 2025");
  });
});

describe("shared mix copy", () => {
  it("titles the category mix and the month list", () => {
    expect(sharedCategoryCopy().title).toBe("En qué se fue");
    expect(sharedMonthListCopy().subtitle).toContain("cada mes");
  });
});
