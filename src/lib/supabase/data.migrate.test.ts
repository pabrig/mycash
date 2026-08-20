import { describe, expect, it } from "vitest";
import { hasLocalToMigrate, type LocalSnapshot } from "@/lib/supabase/data";
import type { Movement } from "@/lib/types";

function snapshot(partial: Partial<LocalSnapshot> = {}): LocalSnapshot {
  return {
    movements: [],
    rates: [],
    displayCurrency: "ARS",
    walletMode: "unified",
    sharedEnabled: false,
    usdEnabled: true,
    ...partial,
  };
}

function movement(scope: Movement["scope"] = "personal"): Movement {
  return {
    id: "m1",
    type: "expense",
    date: "2026-08-01",
    amount: 100,
    currency: "ARS",
    description: "test",
    scope,
    createdAt: "2026-08-01T12:00:00.000Z",
  };
}

describe("hasLocalToMigrate", () => {
  it("skips an empty default snapshot", () => {
    expect(hasLocalToMigrate(snapshot())).toBe(false);
  });

  it("migrates personal movements, not only shared leftovers", () => {
    expect(hasLocalToMigrate(snapshot({ movements: [movement("shared")] }))).toBe(
      false,
    );
    expect(
      hasLocalToMigrate(snapshot({ movements: [movement("personal")] })),
    ).toBe(true);
  });

  it("migrates non-default settings and rates", () => {
    expect(hasLocalToMigrate(snapshot({ displayCurrency: "USD" }))).toBe(true);
    expect(hasLocalToMigrate(snapshot({ walletMode: "split" }))).toBe(true);
    expect(hasLocalToMigrate(snapshot({ sharedEnabled: true }))).toBe(true);
    expect(hasLocalToMigrate(snapshot({ usdEnabled: false }))).toBe(true);
    expect(
      hasLocalToMigrate(
        snapshot({
          rates: [{ year: 2026, month: 8, usdToArs: 1400 }],
        }),
      ),
    ).toBe(true);
  });
});
