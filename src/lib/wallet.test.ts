import { describe, expect, it } from "vitest";
import {
  computeSplitAnnualSummary,
  computeSplitMonthlySummary,
  resolveWallet,
  walletBucketToUsd,
} from "./wallet";
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
];

describe("resolveWallet", () => {
  it("assigns shared expenses to vida", () => {
    expect(resolveWallet(movements[3])).toBe("vida");
  });

  it("assigns USD income to ahorro", () => {
    expect(resolveWallet(movements[0])).toBe("ahorro");
  });

  it("assigns ARS income to vida", () => {
    expect(resolveWallet(movements[1])).toBe("vida");
  });
});

describe("computeSplitMonthlySummary", () => {
  it("computes native amounts per bucket", () => {
    const split = computeSplitMonthlySummary(movements, rate);

    expect(split.vida.income).toBe(500000);
    expect(split.vida.expenses).toBe(280000 + 100 * 1200);
    expect(split.vida.disponible).toBe(split.vida.income - split.vida.expenses);

    expect(split.ahorro.income).toBe(3500);
    expect(split.ahorro.expenses).toBe(0);
    expect(split.ahorro.disponible).toBe(3500);

    expect(split.equivalentTotalArs).toBe(
      split.vida.disponible + split.ahorro.disponible * 1200,
    );
  });
});

describe("computeSplitAnnualSummary", () => {
  it("converts cotidiano to USD with each month's rate and keeps ahorro in USD", () => {
    const janRate: MonthlyRate = { year: 2026, month: 1, usdToArs: 1000 };
    const yearMovements: Movement[] = [
      ...movements,
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

    const annual = computeSplitAnnualSummary(yearMovements, 2026, [
      janRate,
      rate,
    ]);

    expect(annual.activeMonths).toBe(2);
    expect(annual.vida.currency).toBe("USD");
    expect(annual.vida.income).toBe(500000 / 1200);
    expect(annual.vida.expenses).toBeCloseTo(
      280000 / 1200 + 100 + 50000 / 1000,
    );
    expect(annual.ahorro.income).toBe(3500);
    expect(annual.ahorro.expenses).toBe(0);
  });
});

describe("walletBucketToUsd", () => {
  it("converts an ARS bucket using the month rate", () => {
    const usd = walletBucketToUsd(
      {
        wallet: "vida",
        currency: "ARS",
        income: 1200,
        expenses: 600,
        disponible: 600,
      },
      rate,
    );

    expect(usd).toEqual({
      wallet: "vida",
      currency: "USD",
      income: 1,
      expenses: 0.5,
      disponible: 0.5,
    });
  });
});
