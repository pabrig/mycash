import { describe, expect, it } from "vitest";
import {
  hasLocalToMigrate,
  isMissingOnboardingColumn,
  parseUserSettings,
  type LocalSnapshot,
} from "@/lib/supabase/data";
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

describe("parseUserSettings", () => {
  it("marks a new account as pending onboarding", () => {
    const settings = parseUserSettings({
      display_currency: "ARS",
      wallet_mode: "unified",
      shared_enabled: false,
      usd_enabled: true,
      onboarding_completed: false,
    });
    expect(settings.onboardingCompleted).toBe(false);
    expect(settings.onboardingTracked).toBe(true);
  });

  it("does not trap older rows without the column", () => {
    expect(parseUserSettings(null).onboardingTracked).toBe(false);
    expect(parseUserSettings({}).onboardingTracked).toBe(false);
    expect(parseUserSettings({}).onboardingCompleted).toBe(true);
  });
});

describe("isMissingOnboardingColumn", () => {
  it("detects postgres and postgrest missing-column errors", () => {
    expect(isMissingOnboardingColumn({ code: "42703" })).toBe(true);
    expect(isMissingOnboardingColumn({ code: "PGRST204" })).toBe(true);
    expect(
      isMissingOnboardingColumn({
        message: "Could not find the 'onboarding_completed' column",
      }),
    ).toBe(true);
    expect(isMissingOnboardingColumn({ code: "42501" })).toBe(false);
  });
});
