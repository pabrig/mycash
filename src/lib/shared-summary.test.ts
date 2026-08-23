import { describe, expect, it } from "vitest";
import {
  computeSharedMonthlyBreakdown,
  computeSharedPeriodSummary,
  householdSharedMovements,
} from "./shared-summary";
import type { MonthlyRate, Movement } from "./types";

const febRate: MonthlyRate = { year: 2026, month: 2, usdToArs: 1200 };
const janRate: MonthlyRate = { year: 2026, month: 1, usdToArs: 1000 };

function expense(
  partial: Partial<Movement> & Pick<Movement, "id" | "date" | "amount">,
): Movement {
  return {
    type: "expense",
    currency: "ARS",
    description: "Gasto",
    scope: "shared",
    kind: "variable",
    createdAt: "2026-02-01T00:00:00Z",
    ...partial,
  };
}

const movements: Movement[] = [
  expense({
    id: "1",
    date: "2026-02-08",
    amount: 100,
    currency: "USD",
    category: "alimentacion",
    householdId: "casa",
  }),
  expense({
    id: "2",
    date: "2026-02-12",
    amount: 60_000,
    category: "transporte",
    householdId: "casa",
  }),
  expense({
    id: "3",
    date: "2026-01-10",
    amount: 50_000,
    category: "alimentacion",
    householdId: "casa",
  }),
  expense({
    id: "4",
    date: "2026-02-20",
    amount: 10_000,
    householdId: "otro",
  }),
];

describe("householdSharedMovements", () => {
  it("keeps every shared movement without cloud or group", () => {
    expect(householdSharedMovements(movements, null, false)).toHaveLength(4);
    expect(householdSharedMovements(movements, undefined, true)).toHaveLength(
      4,
    );
  });

  it("keeps the active group and movements without a group id", () => {
    const ofCasa = householdSharedMovements(movements, "casa", true);
    expect(ofCasa.map((m) => m.id)).toEqual(["1", "2", "3"]);
  });
});

describe("computeSharedPeriodSummary", () => {
  it("splits spend by category using each month's rate", () => {
    const ofCasa = householdSharedMovements(movements, "casa", true);
    const summary = computeSharedPeriodSummary(ofCasa, [janRate, febRate]);

    expect(summary.movementCount).toBe(3);
    expect(summary.activeMonths).toBe(2);
    expect(summary.totalArs).toBe(100 * 1200 + 60_000 + 50_000);
    expect(summary.totalUsd).toBe(100 + 60_000 / 1200 + 50_000 / 1000);
    expect(summary.categories.map((c) => c.category)).toEqual([
      "alimentacion",
      "transporte",
    ]);
    expect(summary.categories[0]?.amountArs).toBe(100 * 1200 + 50_000);
    expect(summary.categories[1]?.amountArs).toBe(60_000);
    expect(
      summary.categories[0]!.share + summary.categories[1]!.share,
    ).toBeCloseTo(100);
  });

  it("buckets a missing category as otros", () => {
    const summary = computeSharedPeriodSummary(
      [expense({ id: "x", date: "2026-02-01", amount: 20_000 })],
      [febRate],
    );
    expect(summary.categories).toEqual([
      {
        category: "otros",
        amountArs: 20_000,
        amountUsd: 20_000 / 1200,
        share: 100,
        count: 1,
      },
    ]);
  });
});

describe("computeSharedMonthlyBreakdown", () => {
  it("returns 12 months with per-month totals", () => {
    const ofCasa = householdSharedMovements(movements, "casa", true);
    const breakdown = computeSharedMonthlyBreakdown(ofCasa, 2026, [
      janRate,
      febRate,
    ]);

    expect(breakdown).toHaveLength(12);
    expect(breakdown[0]?.movementCount).toBe(1);
    expect(breakdown[0]?.totalArs).toBe(50_000);
    expect(breakdown[1]?.movementCount).toBe(2);
    expect(breakdown[1]?.totalArs).toBe(100 * 1200 + 60_000);
    expect(breakdown[2]?.movementCount).toBe(0);
    expect(breakdown[2]?.totalArs).toBe(0);
  });
});
