import { describe, expect, it } from "vitest";
import {
  goalFormCopy,
  goalProgressCopy,
  goalsHomeCopy,
  goalsReservedCopy,
  goalsSettingsCopy,
  goalsYearNoteCopy,
} from "./goals-copy";
import type { SavingsGoal } from "./goals";

function goal(partial: Partial<SavingsGoal>): SavingsGoal {
  return {
    id: "g1",
    name: "Viaje",
    targetAmount: 100_000,
    currency: "ARS",
    savedAmount: 25_000,
    monthlyPlan: 10_000,
    deductFromDisponible: true,
    place: "disponible",
    targetDate: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    completedAt: null,
    ...partial,
  };
}

describe("goalsSettingsCopy", () => {
  it("explains the toggle in plain language", () => {
    const copy = goalsSettingsCopy();
    expect(copy.title).toBe("Metas");
    expect(copy.description).toMatch(/objetivo concreto/i);
    expect(copy.description).toMatch(/apagado/i);
  });
});

describe("goalsHomeCopy", () => {
  it("has a concrete empty state", () => {
    const copy = goalsHomeCopy(false);
    expect(copy.emptyTitle).toMatch(/no tenés metas/i);
    expect(copy.emptyBody).toMatch(/monto/i);
    expect(copy.add).toBe("Nueva meta");
  });
});

describe("goalProgressCopy", () => {
  it("shows saved vs target and remaining", () => {
    const copy = goalProgressCopy(goal({}));
    expect(copy.status).toMatch(/25\.000/);
    expect(copy.status).toMatch(/100\.000/);
    expect(copy.detail).toMatch(/te falta/i);
    expect(copy.planModeLabel).toMatch(/resta del libre/i);
  });

  it("labels guide-only plans as reminder", () => {
    const copy = goalProgressCopy(
      goal({ deductFromDisponible: false, monthlyPlan: 8_000 }),
    );
    expect(copy.planModeLabel).toMatch(/recordatorio/i);
    expect(copy.plan).toMatch(/no baja el libre/i);
  });

  it("never treats ahorro goals as deducting libre", () => {
    const copy = goalProgressCopy(
      goal({
        place: "ahorro",
        currency: "USD",
        deductFromDisponible: true,
        monthlyPlan: 50,
      }),
    );
    expect(copy.planModeLabel).toMatch(/recordatorio/i);
    expect(copy.placeLabel).toBe("Ahorro");
  });

  it("marks completed goals clearly", () => {
    const copy = goalProgressCopy(
      goal({ savedAmount: 100_000, monthlyPlan: null }),
    );
    expect(copy.status).toBe("Completada");
    expect(copy.detail).toMatch(/juntaste/i);
  });
});

describe("goalsReservedCopy", () => {
  it("explains reserved vs free spend", () => {
    const copy = goalsReservedCopy(20_000, 80_000, (n) => `$${n}`);
    expect(copy?.reserved).toMatch(/ya contado en metas/i);
    expect(copy?.free).toMatch(/libre para gastar/i);
    expect(copy?.hint).toMatch(/resta del libre/i);
  });

  it("names Diario when the account is split", () => {
    const copy = goalsReservedCopy(20_000, 80_000, (n) => `$${n}`, {
      split: true,
    });
    expect(copy?.free).toMatch(/libre en diario/i);
  });
});

describe("goalsYearNoteCopy", () => {
  it("returns null without goals", () => {
    expect(
      goalsYearNoteCopy({
        goals: [],
        yearDisponibleArs: 100_000,
        monthlyReservedArs: 0,
        yearProjectedReservedArs: 0,
        formatArs: (n) => `$${n}`,
      }),
    ).toBeNull();
  });

  it("shows progress and year free when a plan deducts", () => {
    const copy = goalsYearNoteCopy({
      goals: [goal({ name: "Viaje", savedAmount: 40_000, targetAmount: 100_000 })],
      yearDisponibleArs: 500_000,
      monthlyReservedArs: 20_000,
      yearProjectedReservedArs: 80_000,
      formatArs: (n) => `$${n}`,
    });
    expect(copy?.progress).toMatch(/Viaje/);
    expect(copy?.progress).toMatch(/40% juntado/);
    expect(copy?.planLine).toMatch(/reservás/i);
    expect(copy?.planLine).toMatch(/\$20000|\$20_000/);
    expect(copy?.freeLine).toMatch(/te quedaría libre/i);
    expect(copy?.hint).toMatch(/ahorro de arriba/i);
  });

  it("warns when the plan asks more than year savings", () => {
    const copy = goalsYearNoteCopy({
      goals: [goal({ name: "Viaje", savedAmount: 10_000, targetAmount: 100_000 })],
      yearDisponibleArs: 50_000,
      monthlyReservedArs: 40_000,
      yearProjectedReservedArs: 160_000,
      formatArs: (n) => `$${n}`,
    });
    expect(copy?.freeLine).toMatch(/pide más/i);
    expect(copy?.freeLine).not.toMatch(/-/);
  });
});

describe("goalFormCopy", () => {
  it("names place, plan and contribute clearly", () => {
    const copy = goalFormCopy(false);
    expect(copy.placeLabel).toMatch(/de qué plata/i);
    expect(copy.planModeGuide).toMatch(/recordame/i);
    expect(copy.planModeDeduct).toMatch(/reservo/i);
    expect(copy.contribute).toBe("Apartar");
    expect(copy.targetLabel).toMatch(/juntar/i);
  });
});
