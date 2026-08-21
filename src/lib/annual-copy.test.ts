import { describe, expect, it } from "vitest";
import { formatDayAndMonth } from "./format";
import {
  incomeMixCopy,
  isCurrentCalendarYear,
  savingsRateCopy,
  sharedYearCopy,
  visibleMonthCount,
  yearHeroCopy,
  yearListCopy,
} from "./annual-copy";

const today = new Date(2026, 7, 21);

describe("formatDayAndMonth", () => {
  it("writes a plain Spanish date", () => {
    expect(formatDayAndMonth(today)).toBe("21 de agosto");
  });
});

describe("yearHeroCopy", () => {
  it("says the hero is the running total up to today", () => {
    const copy = yearHeroCopy(2026, 8, today);
    expect(copy.label).toBe("Ahorro hasta hoy");
    expect(copy.asOf).toBe("Suma de enero a agosto");
    expect(copy.hint).toContain("Este es el total");
    expect(copy.hint).toContain("21 de agosto");
  });

  it("does not pretend empty months were filled", () => {
    const copy = yearHeroCopy(2026, 3, today);
    expect(copy.asOf).toBe("Suma de 3 meses con movimientos");
  });

  it("names a full past year when all months have data", () => {
    const copy = yearHeroCopy(2025, 12, today);
    expect(copy.label).toBe("Ahorro del año");
    expect(copy.asOf).toBe("Suma de los 12 meses · 2025");
    expect(isCurrentCalendarYear(2025, today)).toBe(false);
  });
});

describe("visibleMonthCount", () => {
  it("stops at the current month in the current year", () => {
    expect(visibleMonthCount(2026, today)).toBe(8);
    expect(visibleMonthCount(2025, today)).toBe(12);
  });
});

describe("savingsRateCopy", () => {
  it("says how much of income was kept", () => {
    const copy = savingsRateCopy(6_506_645, 2_216_824);
    expect(copy.percent).toBeCloseTo(34, 0);
    expect(copy.line).toBe("Ahorraste el 34% de lo que entró");
    expect(copy.savedShare + copy.spentShare).toBe(100);
  });

  it("flags a year that spent more than it earned", () => {
    const copy = savingsRateCopy(100, -20);
    expect(copy.line).toBe("Gastaste más de lo que entró");
    expect(copy.spentShare).toBe(100);
  });
});

describe("year mix copy", () => {
  it("splits income into rentas and trabajo shares", () => {
    const mix = incomeMixCopy(4500, 6500);
    expect(mix?.passiveShare).toBeCloseTo(69, 0);
    expect(mix?.activeShare).toBeCloseTo(31, 0);
  });

  it("treats shared spend as a slice of gastos", () => {
    const shared = sharedYearCopy(99, 100);
    expect(shared?.sharedShare).toBe(99);
    expect(shared?.personalShare).toBe(1);
    expect(shared?.caption).toContain("Gastos");
  });

  it("hides shared when nothing was annotated with others", () => {
    expect(sharedYearCopy(0, 100)).toBeNull();
    expect(yearListCopy().subtitle).toContain("Ahorro");
  });
});
