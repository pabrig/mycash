import { describe, expect, it } from "vitest";
import {
  equalShares,
  formatSplitSummary,
  parseSplitExpensePrefill,
  settleEqualSplit,
  splitSharePath,
} from "./split-bill";

describe("equalShares", () => {
  it("splits evenly", () => {
    expect(equalShares(15000, 3)).toEqual([5000, 5000, 5000]);
  });

  it("distributes remainder so shares sum to total", () => {
    const shares = equalShares(10000, 3);
    expect(shares.reduce((a, b) => a + b, 0)).toBe(10000);
    expect(shares).toEqual([3334, 3333, 3333]);
  });

  it("empty group", () => {
    expect(equalShares(100, 0)).toEqual([]);
  });
});

describe("settleEqualSplit", () => {
  it("one person paid the meal, others transfer their share", () => {
    const result = settleEqualSplit([
      { id: "a", name: "Ana", paid: 15000 },
      { id: "b", name: "Bob", paid: 0 },
      { id: "c", name: "Cara", paid: 0 },
    ]);
    expect(result.total).toBe(15000);
    expect(result.transfers).toEqual([
      {
        fromId: "b",
        fromName: "Bob",
        toId: "a",
        toName: "Ana",
        amount: 5000,
      },
      {
        fromId: "c",
        fromName: "Cara",
        toId: "a",
        toName: "Ana",
        amount: 5000,
      },
    ]);
  });

  it("two payers, one didn't put money", () => {
    const result = settleEqualSplit([
      { id: "a", name: "Ana", paid: 8000 },
      { id: "b", name: "Bob", paid: 4000 },
      { id: "c", name: "Cara", paid: 0 },
    ]);
    expect(result.total).toBe(12000);
    expect(result.transfers).toEqual([
      {
        fromId: "c",
        fromName: "Cara",
        toId: "a",
        toName: "Ana",
        amount: 4000,
      },
    ]);
    expect(result.balances.find((b) => b.id === "b")?.net).toBe(0);
  });

  it("everyone paid the same — no transfers", () => {
    const result = settleEqualSplit([
      { id: "a", name: "Ana", paid: 3000 },
      { id: "b", name: "Bob", paid: 3000 },
    ]);
    expect(result.transfers).toEqual([]);
  });

  it("ignores negative paid and blank names", () => {
    const result = settleEqualSplit([
      { id: "a", name: "  ", paid: -10 },
      { id: "b", name: "Bob", paid: 1000 },
    ]);
    expect(result.balances[0].name).toBe("Persona 1");
    expect(result.balances[0].paid).toBe(0);
    expect(result.transfers[0]?.amount).toBe(500);
  });
});

describe("splitSharePath", () => {
  it("builds nuevo prefill for my share", () => {
    expect(splitSharePath("Cena", 5000)).toBe(
      "/nuevo?monto=5000&desc=Cena&cat=salidas",
    );
  });

  it("falls back when title is empty", () => {
    expect(splitSharePath("  ", 1000)).toContain("Cuenta+dividida");
  });

  it("parses prefill from the query", () => {
    const href = splitSharePath("Asado", 4200);
    const params = new URLSearchParams(href.split("?")[1]);
    expect(parseSplitExpensePrefill(params)).toEqual({
      amount: "4200",
      description: "Asado",
      category: "salidas",
    });
  });
});

describe("formatSplitSummary", () => {
  it("lists transfers for sharing", () => {
    const result = settleEqualSplit([
      { id: "a", name: "Ana", paid: 10000 },
      { id: "b", name: "Bob", paid: 0 },
    ]);
    const text = formatSplitSummary("Cena", result, (n) => `$${n}`);
    expect(text).toContain("Cena");
    expect(text).toContain("Bob → Ana  $5000");
  });
});
