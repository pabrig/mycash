import { describe, expect, it } from "vitest";
import {
  affectsUserBalance,
  canManageMovement,
  householdShareCount,
  matchesMovementFilter,
  movementsForPersonalBalance,
  safeNextPath,
} from "@/lib/movement-access";
import type { Movement } from "@/lib/types";

function movement(partial: Partial<Movement> & Pick<Movement, "type">): Movement {
  return {
    id: "m1",
    date: "2026-08-01",
    amount: 100,
    currency: "ARS",
    description: "test",
    createdAt: "2026-08-01T12:00:00.000Z",
    ...partial,
  };
}

describe("matchesMovementFilter", () => {
  const income = movement({ type: "income", scope: "personal" });
  const personalExpense = movement({ type: "expense", scope: "personal" });
  const sharedExpense = movement({ type: "expense", scope: "shared" });

  it("all includes every movement", () => {
    expect(matchesMovementFilter(income, "all")).toBe(true);
    expect(matchesMovementFilter(personalExpense, "all")).toBe(true);
    expect(matchesMovementFilter(sharedExpense, "all")).toBe(true);
  });

  it("income only", () => {
    expect(matchesMovementFilter(income, "income")).toBe(true);
    expect(matchesMovementFilter(personalExpense, "income")).toBe(false);
    expect(matchesMovementFilter(sharedExpense, "income")).toBe(false);
  });

  it("personal expenses exclude shared", () => {
    expect(matchesMovementFilter(personalExpense, "personal")).toBe(true);
    expect(matchesMovementFilter(sharedExpense, "personal")).toBe(false);
    expect(matchesMovementFilter(income, "personal")).toBe(false);
  });

  it("shared includes expenses and income of the group", () => {
    expect(matchesMovementFilter(sharedExpense, "shared")).toBe(true);
    expect(matchesMovementFilter(personalExpense, "shared")).toBe(false);
    expect(matchesMovementFilter(income, "shared")).toBe(false);
    const sharedIncome = movement({
      type: "income",
      scope: "shared",
      incomeKind: "active",
    });
    expect(matchesMovementFilter(sharedIncome, "shared")).toBe(true);
    expect(matchesMovementFilter(sharedIncome, "income")).toBe(true);
  });
});

describe("affectsUserBalance", () => {
  const mine = movement({
    type: "expense",
    scope: "shared",
    createdByUserId: "user-a",
  });
  const theirs = movement({
    type: "expense",
    scope: "shared",
    createdByUserId: "user-b",
  });
  const legacyShared = movement({
    type: "expense",
    scope: "shared",
  });
  const personal = movement({ type: "expense", scope: "personal" });
  const income = movement({ type: "income" });

  it("personal and income always count", () => {
    expect(affectsUserBalance(personal, "user-a")).toBe(true);
    expect(affectsUserBalance(income, "user-a")).toBe(true);
  });

  it("own shared counts; partner shared is view-only", () => {
    expect(affectsUserBalance(mine, "user-a")).toBe(true);
    expect(affectsUserBalance(theirs, "user-a")).toBe(false);
  });

  it("legacy shared and local (no user) still count", () => {
    expect(affectsUserBalance(legacyShared, "user-a")).toBe(true);
    expect(affectsUserBalance(theirs, undefined)).toBe(true);
  });

  it("pool counts every shared movement of the group", () => {
    expect(affectsUserBalance(mine, "user-a", "pool")).toBe(true);
    expect(affectsUserBalance(theirs, "user-a", "pool")).toBe(true);
  });
});

describe("movementsForPersonalBalance", () => {
  const mine = movement({
    type: "expense",
    scope: "shared",
    amount: 100,
    createdByUserId: "user-a",
    householdId: "casa",
  });
  const theirs = movement({
    id: "m2",
    type: "expense",
    scope: "shared",
    amount: 40,
    createdByUserId: "user-b",
    householdId: "casa",
  });
  const sharedIncome = movement({
    id: "m3",
    type: "income",
    scope: "shared",
    amount: 200,
    incomeKind: "active",
    createdByUserId: "user-b",
    householdId: "casa",
  });
  const personal = movement({
    id: "m4",
    type: "income",
    amount: 50,
  });

  it("payer keeps own shared at full amount and drops the partner's", () => {
    const own = movementsForPersonalBalance(
      [mine, theirs, sharedIncome, personal],
      "user-a",
      "payer",
      { casa: 2 },
    );
    expect(own.map((m) => m.id)).toEqual(["m1", "m4"]);
    expect(own[0]?.amount).toBe(100);
  });

  it("pool splits every shared movement by household size", () => {
    const own = movementsForPersonalBalance(
      [mine, theirs, sharedIncome, personal],
      "user-a",
      "pool",
      { casa: 2 },
    );
    expect(own).toHaveLength(4);
    expect(own.find((m) => m.id === "m1")?.amount).toBe(50);
    expect(own.find((m) => m.id === "m2")?.amount).toBe(20);
    expect(own.find((m) => m.id === "m3")?.amount).toBe(100);
    expect(own.find((m) => m.id === "m4")?.amount).toBe(50);
  });
});

describe("householdShareCount", () => {
  it("defaults to one person without a group size", () => {
    expect(householdShareCount(undefined, {})).toBe(1);
    expect(householdShareCount("casa", {})).toBe(1);
    expect(householdShareCount("casa", { casa: 3 })).toBe(3);
  });
});

describe("canManageMovement", () => {
  const mine = movement({
    type: "expense",
    scope: "shared",
    createdByUserId: "user-a",
  });
  const theirs = movement({
    type: "expense",
    scope: "shared",
    createdByUserId: "user-b",
  });
  const legacyShared = movement({
    type: "expense",
    scope: "shared",
  });
  const personal = movement({ type: "expense", scope: "personal" });

  it("local mode always allows manage", () => {
    expect(canManageMovement(theirs, false, "user-a")).toBe(true);
  });

  it("shared: only author in cloud", () => {
    expect(canManageMovement(mine, true, "user-a")).toBe(true);
    expect(canManageMovement(theirs, true, "user-a")).toBe(false);
  });

  it("shared without createdBy is manageable (legacy)", () => {
    expect(canManageMovement(legacyShared, true, "user-a")).toBe(true);
  });

  it("personal is manageable for the session owner in UI", () => {
    expect(canManageMovement(personal, true, "user-a")).toBe(true);
  });
});

describe("safeNextPath", () => {
  it("allows relative app paths", () => {
    expect(safeNextPath("/")).toBe("/");
    expect(safeNextPath("/cuenta")).toBe("/cuenta");
    expect(safeNextPath("/join/ABC")).toBe("/join/ABC");
  });

  it("blocks open redirects", () => {
    expect(safeNextPath("//evil.com")).toBe("/");
    expect(safeNextPath("https://evil.com")).toBe("/");
    expect(safeNextPath(null)).toBe("/");
    expect(safeNextPath("")).toBe("/");
  });
});
