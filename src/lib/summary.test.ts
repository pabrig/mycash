import { describe, expect, it } from "vitest";
import { formatDisplay, formatMoney, formatUsd } from "./format";
import { computeAnnualSummary, computeMonthlyBreakdown, computeMonthlySummary, filterByMonth } from "./summary";
import type { MonthlyRate, Movement } from "./types";

const rate: MonthlyRate = {
  year: 2026,
  month: 2,
  usdToArs: 1200,
};

const movements: Movement[] = [
  {
    id: "1",
    type: "income",
    date: "2026-02-10",
    amount: 3500,
    currency: "USD",
    description: "Itti",
    incomeKind: "passive",
    source: "itti",
    createdAt: "2026-02-10T00:00:00Z",
  },
  {
    id: "2",
    type: "income",
    date: "2026-02-15",
    amount: 500000,
    currency: "ARS",
    description: "Sueldo",
    incomeKind: "active",
    source: "sueldo",
    createdAt: "2026-02-15T00:00:00Z",
  },
  {
    id: "3",
    type: "expense",
    date: "2026-02-05",
    amount: 280000,
    currency: "ARS",
    description: "OSDE",
    scope: "personal",
    kind: "fixed",
    category: "salud",
    createdAt: "2026-02-05T00:00:00Z",
  },
  {
    id: "4",
    type: "expense",
    date: "2026-02-08",
    amount: 100,
    currency: "USD",
    description: "Super compartido",
    scope: "shared",
    kind: "variable",
    category: "alimentacion",
    createdAt: "2026-02-08T00:00:00Z",
  },
  {
    id: "5",
    type: "expense",
    date: "2026-01-10",
    amount: 50000,
    currency: "ARS",
    description: "Enero",
    scope: "personal",
    kind: "variable",
    category: "otros",
    createdAt: "2026-01-10T00:00:00Z",
  },
];

describe("formatDisplay", () => {
  it("converts ARS to USD for display", () => {
    expect(formatDisplay(1200, "USD", 1200)).toBe("USD 1");
  });
});

describe("formatMoney", () => {
  it("formats deterministically for SSR and client", () => {
    expect(formatMoney(1200)).toBe("$1.200");
    expect(formatMoney(-500000)).toBe("-$500.000");
  });
});

describe("formatUsd", () => {
  it("prefixes amounts with USD", () => {
    expect(formatUsd(1983)).toBe("USD 1,983");
  });
});

describe("computeMonthlySummary", () => {
  it("computes disponible including shared expenses", () => {
    const feb = filterByMonth(movements, 2026, 2);
    const summary = computeMonthlySummary(feb, rate);

    expect(summary.disponible).toBe(
      3500 * 1200 + 500000 - 280000 - 100 * 1200,
    );
  });
});

describe("computeAnnualSummary", () => {
  it("aggregates all months in the year", () => {
    const annual = computeAnnualSummary(movements, 2026, [rate]);

    expect(annual.movementCount).toBe(5);
    expect(annual.personalExpenses).toBe(280000 + 50000);
    expect(annual.disponible).toBe(
      annual.totalIncome - annual.totalExpenses,
    );
  });

  it("computes monthly averages over active months", () => {
    const annual = computeAnnualSummary(movements, 2026, [rate]);

    expect(annual.activeMonths).toBe(2);
    expect(annual.averages.totalIncome).toBe(annual.totalIncome / 2);
    expect(annual.averages.totalExpenses).toBe(annual.totalExpenses / 2);
    expect(annual.averages.disponible).toBe(annual.disponible / 2);
  });
});

describe("computeMonthlyBreakdown", () => {
  it("returns 12 months with per-month totals", () => {
    const breakdown = computeMonthlyBreakdown(movements, 2026, [rate]);

    expect(breakdown).toHaveLength(12);
    expect(breakdown[0].month).toBe(1);
    expect(breakdown[0].movementCount).toBe(1);
    expect(breakdown[1].movementCount).toBe(4);
    expect(breakdown[2].movementCount).toBe(0);
    expect(breakdown[2].summary.disponible).toBe(0);
  });
});
