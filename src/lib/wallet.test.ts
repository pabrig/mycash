import { describe, expect, it } from "vitest";
import {
  computeSplitMonthlySummary,
  resolveWallet,
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
