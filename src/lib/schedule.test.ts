import { describe, expect, it } from "vitest";
import {
  addDaysIso,
  addMonthsIso,
  defaultDateForPeriod,
  expandMonthlyDates,
  installmentLabel,
  notesInPeriodLabel,
  seriesPreview,
} from "./schedule";

describe("addMonthsIso", () => {
  it("keeps the day across months", () => {
    expect(addMonthsIso("2026-01-10", 1)).toBe("2026-02-10");
    expect(addMonthsIso("2026-08-21", 2)).toBe("2026-10-21");
  });

  it("clamps to the last day of a shorter month", () => {
    expect(addMonthsIso("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonthsIso("2026-01-31", 2)).toBe("2026-03-31");
  });
});

describe("addDaysIso", () => {
  it("moves yesterday and tomorrow", () => {
    expect(addDaysIso("2026-08-21", -1)).toBe("2026-08-20");
    expect(addDaysIso("2026-08-21", 1)).toBe("2026-08-22");
    expect(addDaysIso("2026-01-01", -1)).toBe("2025-12-31");
  });
});

describe("defaultDateForPeriod", () => {
  it("uses today when the selected month is the current one", () => {
    expect(defaultDateForPeriod(2026, 8, "2026-08-21")).toBe("2026-08-21");
  });

  it("uses the first day when looking at another month", () => {
    expect(defaultDateForPeriod(2026, 3, "2026-08-21")).toBe("2026-03-01");
    expect(defaultDateForPeriod(2027, 1, "2026-08-21")).toBe("2027-01-01");
  });
});

describe("expandMonthlyDates", () => {
  it("builds one date per month from the start", () => {
    expect(expandMonthlyDates("2026-08-05", 3)).toEqual([
      "2026-08-05",
      "2026-09-05",
      "2026-10-05",
    ]);
  });
});

describe("installmentLabel", () => {
  it("appends n/total and does not stack suffixes", () => {
    expect(installmentLabel("TV Samsung", 3, 12)).toBe("TV Samsung 3/12");
    expect(installmentLabel("TV Samsung 3/12", 4, 12)).toBe("TV Samsung 4/12");
  });
});

describe("seriesPreview", () => {
  it("explains a monthly service", () => {
    expect(
      seriesPreview({
        mode: "monthly",
        startIso: "2026-08-21",
        count: 12,
      }),
    ).toBe("12 meses · Ago 2026 → Jul 2027");
  });

  it("explains remaining installments", () => {
    expect(
      seriesPreview({
        mode: "installments",
        startIso: "2026-08-21",
        count: 10,
        firstInstallment: 3,
        totalInstallments: 12,
      }),
    ).toBe("10 cuotas · 3/12 a 12/12 · Ago 2026 → May 2027");
  });
});

describe("notesInPeriodLabel", () => {
  it("says which month the movement lands in", () => {
    expect(notesInPeriodLabel("2026-03-01")).toBe("Se anota en marzo 2026");
  });
});
