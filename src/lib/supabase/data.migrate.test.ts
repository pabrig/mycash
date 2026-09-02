import { describe, expect, it } from "vitest";
import {
  hasLocalToMigrate,
  isMissingNoticesTable,
  isMissingOnboardingColumn,
  isMissingRpc,
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
    sharedFunding: "payer",
    usdEnabled: true,
    carryoverEnabled: false,
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
    expect(hasLocalToMigrate(snapshot({ sharedFunding: "pool" }))).toBe(true);
    expect(hasLocalToMigrate(snapshot({ usdEnabled: false }))).toBe(true);
    expect(hasLocalToMigrate(snapshot({ carryoverEnabled: true }))).toBe(true);
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
    expect(parseUserSettings({}).sharedFunding).toBe("payer");
    expect(parseUserSettings({ shared_funding: "pool" }).sharedFunding).toBe(
      "pool",
    );
  });

  it("defaults carryover to off", () => {
    expect(parseUserSettings(null).carryoverEnabled).toBe(false);
    expect(parseUserSettings({ carryover_enabled: true }).carryoverEnabled).toBe(
      true,
    );
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

describe("isMissingNoticesTable", () => {
  it("detects a missing user_notices relation", () => {
    expect(isMissingNoticesTable({ code: "42P01" })).toBe(true);
    expect(isMissingNoticesTable({ message: "Could not find the table 'user_notices'" })).toBe(
      true,
    );
    expect(isMissingNoticesTable({ code: "42501" })).toBe(false);
  });
});

describe("isMissingRpc", () => {
  it("detects a missing postgres function", () => {
    expect(isMissingRpc({ code: "42883" }, "set_membership_shared_funding")).toBe(
      true,
    );
    expect(isMissingRpc({ code: "PGRST202" }, "set_membership_shared_funding")).toBe(
      true,
    );
    expect(
      isMissingRpc(
        {
          message:
            "Could not find the function public.set_membership_shared_funding",
        },
        "set_membership_shared_funding",
      ),
    ).toBe(true);
    expect(isMissingRpc({ code: "42501" }, "set_membership_shared_funding")).toBe(
      false,
    );
  });
});
