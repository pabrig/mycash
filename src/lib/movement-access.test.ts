import { describe, expect, it } from "vitest";
import {
  affectsUserBalance,
  canManageMovement,
  matchesMovementFilter,
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

  it("shared only shared expenses", () => {
    expect(matchesMovementFilter(sharedExpense, "shared")).toBe(true);
    expect(matchesMovementFilter(personalExpense, "shared")).toBe(false);
    expect(matchesMovementFilter(income, "shared")).toBe(false);
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
