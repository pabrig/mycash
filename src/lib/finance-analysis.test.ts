import { describe, expect, it } from "vitest";
import {
  buildFinanceInsights,
  buildMonthEvolution,
  computeExpenseCategoryMix,
  evolutionBarHeights,
  monthDeltaCopy,
} from "./finance-analysis";
import type { MonthSnapshot, MonthlyRate, Movement } from "./types";

const rates: MonthlyRate[] = [
  { year: 2026, month: 1, usdToArs: 1000 },
  { year: 2026, month: 2, usdToArs: 1000 },
  { year: 2026, month: 3, usdToArs: 1000 },
];

function snap(
  month: number,
  income: number,
  expenses: number,
  movementCount: number,
): MonthSnapshot {
  return {
    year: 2026,
    month,
    movementCount,
    summary: {
      passiveIncome: 0,
      activeIncome: income,
      personalExpenses: expenses,
      personalFixed: 0,
      personalVariable: expenses,
      totalIncome: income,
      sharedExpenses: 0,
      totalExpenses: expenses,
      disponible: income - expenses,
    },
  };
}

function expense(
  date: string,
  amount: number,
  category: string,
): Movement {
  return {
    id: `${date}-${category}-${amount}`,
    type: "expense",
    date,
    amount,
    currency: "ARS",
    description: category,
    scope: "personal",
    kind: "variable",
    category,
    createdAt: `${date}T00:00:00Z`,
  };
}

describe("buildMonthEvolution", () => {
  it("compares each active month to the previous active one", () => {
    const points = buildMonthEvolution(
      [snap(1, 100, 40, 2), snap(2, 100, 70, 2), snap(3, 0, 0, 0)],
      3,
    );
    expect(points[0].vsPrevDisponible).toBeNull();
    expect(points[1].vsPrevDisponible).toBe(-30);
    expect(points[2].vsPrevDisponible).toBeNull();
  });

  it("skips empty months when chaining comparisons", () => {
    const points = buildMonthEvolution(
      [snap(1, 100, 40, 1), snap(2, 0, 0, 0), snap(3, 100, 20, 1)],
      3,
    );
    expect(points[2].vsPrevDisponible).toBe(20);
  });
});

describe("computeExpenseCategoryMix", () => {
  it("ranks categories by pesos spent", () => {
    const mix = computeExpenseCategoryMix(
      [
        expense("2026-01-10", 300, "alimentacion"),
        expense("2026-02-10", 100, "transporte"),
        expense("2026-02-12", 100, "alimentacion"),
      ],
      2026,
      rates,
    );
    expect(mix[0].category).toBe("alimentacion");
    expect(mix[0].share).toBeCloseTo(80, 0);
    expect(mix[1].category).toBe("transporte");
  });
});

describe("buildFinanceInsights", () => {
  it("explains savings in plain money-per-100 language", () => {
    const points = buildMonthEvolution(
      [snap(1, 1000, 600, 2), snap(2, 1000, 400, 2)],
      2,
    );
    const insights = buildFinanceInsights(points, [], 2000, 1000);
    expect(insights[0]?.text).toBe(
      "De cada $100 que entró, te quedaron $50.",
    );
  });

  it("names the best month and latest change", () => {
    const points = buildMonthEvolution(
      [snap(1, 100, 80, 1), snap(2, 100, 20, 1)],
      2,
    );
    const insights = buildFinanceInsights(points, [], 200, 100);
    const texts = insights.map((i) => i.text);
    expect(texts.some((t) => t.includes("febrero"))).toBe(true);
    expect(texts.some((t) => t.includes("más que en enero"))).toBe(true);
  });

  it("mentions the top spending category when it is meaningful", () => {
    const points = buildMonthEvolution([snap(1, 100, 50, 1)], 1);
    const insights = buildFinanceInsights(
      points,
      [
        {
          category: "alimentacion",
          amountArs: 40,
          amountUsd: 0.04,
          share: 80,
          count: 2,
        },
      ],
      100,
      50,
    );
    expect(
      insights.some((i) =>
        i.text.includes("alimentación") && i.text.includes("80%"),
      ),
    ).toBe(true);
  });
});

describe("monthDeltaCopy", () => {
  it("formats signed peso deltas", () => {
    expect(monthDeltaCopy(null)).toBeNull();
    expect(monthDeltaCopy(0)).toBe("Igual");
    expect(monthDeltaCopy(1500)).toBe("+$1.500");
    expect(monthDeltaCopy(-1500)).toBe("−$1.500");
  });
});

describe("evolutionBarHeights", () => {
  it("scales bars to the peak absolute ahorro", () => {
    const points = buildMonthEvolution(
      [snap(1, 100, 0, 1), snap(2, 50, 0, 1)],
      2,
    );
    const heights = evolutionBarHeights(points);
    expect(heights[0]).toBe(100);
    expect(heights[1]).toBe(50);
  });
});
