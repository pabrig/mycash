import { describe, expect, it } from "vitest";
import {
  equalShares,
  eventDaySpan,
  eventMyShare,
  formatEventDates,
  formatEventSplitSummary,
  formatIsoDay,
  formatSplitSummary,
  groupExpensesByDate,
  paidByPerson,
  parseSplitExpensePrefill,
  settleEqualSplit,
  settleEvent,
  splitSharePath,
  type SplitEvent,
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

const trip: SplitEvent = {
  id: "e1",
  title: "Bariloche",
  createdAt: "2026-01-10T12:00:00.000Z",
  startDate: "2026-01-12",
  endDate: "2026-01-18",
  people: [
    { id: "a", name: "Ana", isMe: true },
    { id: "b", name: "Bob", isMe: false },
    { id: "c", name: "Cara", isMe: false },
  ],
  expenses: [
    {
      id: "g1",
      date: "2026-01-12",
      description: "Nafta",
      amount: 15000,
      paidById: "a",
    },
    {
      id: "g2",
      date: "2026-01-13",
      description: "Cena",
      amount: 9000,
      paidById: "b",
    },
    {
      id: "g3",
      date: "2026-01-13",
      description: "Almuerzo",
      amount: 6000,
      paidById: "a",
    },
  ],
};

describe("paidByPerson / settleEvent", () => {
  it("sums what each person paid across expenses", () => {
    expect(paidByPerson(trip)).toEqual([
      { id: "a", name: "Ana", paid: 21000 },
      { id: "b", name: "Bob", paid: 9000 },
      { id: "c", name: "Cara", paid: 0 },
    ]);
  });

  it("settles the trip equally", () => {
    const result = settleEvent(trip);
    expect(result.total).toBe(30000);
    expect(result.share).toBe(10000);
    expect(result.transfers).toEqual([
      {
        fromId: "b",
        fromName: "Bob",
        toId: "a",
        toName: "Ana",
        amount: 1000,
      },
      {
        fromId: "c",
        fromName: "Cara",
        toId: "a",
        toName: "Ana",
        amount: 10000,
      },
    ]);
  });

  it("uses my share from the event", () => {
    const result = settleEvent(trip);
    expect(eventMyShare(trip, result)).toBe(10000);
  });
});

describe("groupExpensesByDate", () => {
  it("groups newest day first", () => {
    const groups = groupExpensesByDate(trip.expenses);
    expect(groups.map((g) => g.date)).toEqual(["2026-01-13", "2026-01-12"]);
    expect(groups[0].items.map((e) => e.description)).toEqual([
      "Almuerzo",
      "Cena",
    ]);
  });
});

describe("event dates", () => {
  it("formats iso day without Date", () => {
    expect(formatIsoDay("2026-01-12")).toBe("12/1");
  });

  it("counts inclusive days", () => {
    expect(eventDaySpan("2026-01-12", "2026-01-18")).toBe(7);
    expect(eventDaySpan("2026-01-12", "2026-01-12")).toBe(1);
    expect(eventDaySpan("2026-01-18", "2026-01-12")).toBeNull();
  });

  it("formats range with day count", () => {
    expect(formatEventDates(trip)).toBe("12/1 – 18/1 · 7 días");
  });
});

describe("formatEventSplitSummary", () => {
  it("includes dates, transfers and recent expenses", () => {
    const text = formatEventSplitSummary(trip, settleEvent(trip), (n) => `$${n}`);
    expect(text).toContain("Bariloche");
    expect(text).toContain("12/1 – 18/1");
    expect(text).toContain("Cara → Ana  $10000");
    expect(text).toContain("Nafta $15000 (Ana)");
  });
});
