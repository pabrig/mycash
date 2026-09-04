import { describe, expect, it } from "vitest";
import {
  applyGoalPatch,
  buildGoal,
  defaultGoalPlace,
  effectiveMonthlyPlan,
  goalCanReserveDisponible,
  goalPlaceOptions,
  goalProgressPercent,
  goalRemaining,
  goalReservesFromLibre,
  isGoalComplete,
  monthsUntilDate,
  normalizeGoalPlace,
  projectedYearReserved,
  remainingMonthsInYear,
  suggestedMonthlyPlan,
  totalMonthlyReserved,
  withContribution,
} from "./goals";

const now = new Date(2026, 8, 4); // 4 sep 2026

describe("monthsUntilDate", () => {
  it("counts remaining months to a future date", () => {
    expect(monthsUntilDate("2026-12-15", now)).toBe(4);
  });

  it("returns null for past dates", () => {
    expect(monthsUntilDate("2026-01-01", now)).toBeNull();
  });
});

describe("suggestedMonthlyPlan", () => {
  it("splits what is left across remaining months", () => {
    const plan = suggestedMonthlyPlan(
      { targetAmount: 120_000, savedAmount: 20_000, targetDate: "2026-12-15" },
      now,
    );
    expect(plan).toBe(25_000); // 100000 / 4
  });
});

describe("goal progress", () => {
  it("tracks remaining and percent", () => {
    const goal = buildGoal(
      {
        name: "Viaje",
        targetAmount: 100,
        currency: "ARS",
        savedAmount: 40,
      },
      now,
    );
    expect(goal.place).toBe("disponible");
    expect(goalRemaining(goal)).toBe(60);
    expect(goalProgressPercent(goal)).toBe(40);
    expect(isGoalComplete(goal)).toBe(false);
  });

  it("marks complete when contribution reaches target", () => {
    const goal = buildGoal(
      { name: "Fondo", targetAmount: 100, currency: "ARS", savedAmount: 90 },
      now,
    );
    const next = withContribution(goal, 20, now);
    expect(isGoalComplete(next)).toBe(true);
    expect(next.completedAt).toBeTruthy();
  });
});

describe("goal place", () => {
  it("defaults and options follow wallet mode", () => {
    expect(defaultGoalPlace("unified")).toBe("disponible");
    expect(defaultGoalPlace("split")).toBe("diario");
    expect(goalPlaceOptions("unified")).toEqual(["disponible"]);
    expect(goalPlaceOptions("split")).toEqual(["diario", "ahorro"]);
  });

  it("normalizes legacy disponible into diario when split", () => {
    expect(normalizeGoalPlace("disponible", "split")).toBe("diario");
    expect(normalizeGoalPlace("ahorro", "split")).toBe("ahorro");
    expect(normalizeGoalPlace("diario", "unified")).toBe("disponible");
  });

  it("forces ahorro goals to never reserve libre", () => {
    const goal = buildGoal(
      {
        name: "Viaje USD",
        targetAmount: 1000,
        currency: "USD",
        place: "ahorro",
        monthlyPlan: 100,
        deductFromDisponible: true,
      },
      now,
    );
    expect(goal.deductFromDisponible).toBe(false);
    expect(goalCanReserveDisponible(goal.place)).toBe(false);
    expect(goalReservesFromLibre(goal)).toBe(false);
  });
});

describe("effectiveMonthlyPlan", () => {
  it("prefers the user plan over the suggestion", () => {
    const goal = buildGoal(
      {
        name: "Auto",
        targetAmount: 1_000_000,
        currency: "ARS",
        targetDate: "2026-12-15",
        monthlyPlan: 10_000,
      },
      now,
    );
    expect(effectiveMonthlyPlan(goal, now)).toBe(10_000);
  });
});

describe("totalMonthlyReserved", () => {
  it("sums only plans that reserve libre", () => {
    const goals = [
      buildGoal(
        {
          name: "A",
          targetAmount: 100,
          currency: "ARS",
          place: "diario",
          monthlyPlan: 30,
          deductFromDisponible: true,
        },
        now,
      ),
      buildGoal(
        {
          name: "B",
          targetAmount: 100,
          currency: "USD",
          place: "ahorro",
          monthlyPlan: 2,
          deductFromDisponible: true,
        },
        now,
      ),
      buildGoal(
        {
          name: "C",
          targetAmount: 100,
          currency: "ARS",
          place: "disponible",
          monthlyPlan: 10,
          deductFromDisponible: false,
        },
        now,
      ),
    ];
    const total = totalMonthlyReserved(
      goals,
      (amount, currency) => (currency === "USD" ? amount * 1000 : amount),
      now,
    );
    expect(total).toBe(30);
  });
});

describe("projectedYearReserved", () => {
  it("multiplies monthly plan by remaining months in the year", () => {
    const midYear = new Date(2026, 8, 4); // September → 4 months left
    expect(remainingMonthsInYear(2026, midYear)).toBe(4);
    expect(projectedYearReserved(10_000, 2026, midYear)).toBe(40_000);
    expect(projectedYearReserved(10_000, 2025, midYear)).toBe(0);
  });
});

describe("applyGoalPatch", () => {
  it("clears completion if target grows", () => {
    const done = withContribution(
      buildGoal(
        { name: "X", targetAmount: 50, currency: "ARS", savedAmount: 50 },
        now,
      ),
      0,
      now,
    );
    expect(isGoalComplete(done)).toBe(true);
    const reopened = applyGoalPatch(done, { targetAmount: 80 }, now);
    expect(isGoalComplete(reopened)).toBe(false);
    expect(reopened.completedAt).toBeNull();
  });

  it("clears deduct when moving a goal to ahorro", () => {
    const goal = buildGoal(
      {
        name: "Fondo",
        targetAmount: 100,
        currency: "ARS",
        place: "diario",
        deductFromDisponible: true,
        monthlyPlan: 20,
      },
      now,
    );
    const moved = applyGoalPatch(goal, { place: "ahorro", currency: "USD" }, now);
    expect(moved.place).toBe("ahorro");
    expect(moved.deductFromDisponible).toBe(false);
  });
});
