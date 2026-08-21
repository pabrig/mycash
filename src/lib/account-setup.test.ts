import { describe, expect, it } from "vitest";
import {
  canContinueOnboarding,
  greetingName,
  isOnboardingDone,
  onboardingSteps,
  resolveOnboardingCompleted,
  resolvedWalletMode,
  setupSummaryLines,
} from "./account-setup";

describe("onboardingSteps", () => {
  it("asks money, then shared, then how the app works", () => {
    expect(
      onboardingSteps({
        moneyProfile: "ars_only",
        askShared: true,
        showSharedHowTo: false,
      }),
    ).toEqual([
      "welcome",
      "money",
      "shared",
      "howto_movements",
      "howto_period",
      "done",
    ]);
    expect(
      onboardingSteps({
        moneyProfile: "ars_savings",
        askShared: true,
        showSharedHowTo: false,
      }),
    ).toEqual([
      "welcome",
      "money",
      "shared",
      "howto_movements",
      "howto_period",
      "done",
    ]);
  });

  it("adds how-to-see-it only when they use pesos and dollars", () => {
    expect(
      onboardingSteps({
        moneyProfile: "dual",
        askShared: true,
        showSharedHowTo: true,
      }),
    ).toEqual([
      "welcome",
      "money",
      "view",
      "shared",
      "howto_movements",
      "howto_period",
      "howto_shared",
      "done",
    ]);
  });

  it("skips the shared question when they already joined a group", () => {
    expect(
      onboardingSteps({
        moneyProfile: "ars_only",
        askShared: false,
        showSharedHowTo: true,
      }),
    ).toEqual([
      "welcome",
      "money",
      "howto_movements",
      "howto_period",
      "howto_shared",
      "done",
    ]);
  });

  it("does not show the view step until they pick dual", () => {
    expect(
      onboardingSteps({
        moneyProfile: null,
        askShared: true,
        showSharedHowTo: false,
      }),
    ).toEqual([
      "welcome",
      "money",
      "shared",
      "howto_movements",
      "howto_period",
      "done",
    ]);
  });

  it("explains shared expenses only when that feature is on", () => {
    expect(
      onboardingSteps({
        moneyProfile: "ars_only",
        askShared: false,
        showSharedHowTo: false,
      }),
    ).not.toContain("howto_shared");
  });
});

describe("canContinueOnboarding", () => {
  it("requires a choice on question steps", () => {
    expect(
      canContinueOnboarding("money", {
        moneyProfile: null,
        walletMode: null,
        sharedEnabled: null,
      }),
    ).toBe(false);
    expect(
      canContinueOnboarding("money", {
        moneyProfile: "ars_only",
        walletMode: null,
        sharedEnabled: null,
      }),
    ).toBe(true);
    expect(
      canContinueOnboarding("view", {
        moneyProfile: "dual",
        walletMode: null,
        sharedEnabled: null,
      }),
    ).toBe(false);
    expect(
      canContinueOnboarding("shared", {
        moneyProfile: "ars_only",
        walletMode: null,
        sharedEnabled: false,
      }),
    ).toBe(true);
    expect(
      canContinueOnboarding("howto_movements", {
        moneyProfile: "ars_only",
        walletMode: null,
        sharedEnabled: null,
      }),
    ).toBe(true);
  });
});

describe("resolvedWalletMode", () => {
  it("follows the profile when they are not dual", () => {
    expect(resolvedWalletMode("ars_only", "split")).toBe("unified");
    expect(resolvedWalletMode("ars_savings", "unified")).toBe("split");
  });

  it("keeps the view choice for dual, defaulting to together", () => {
    expect(resolvedWalletMode("dual", "split")).toBe("split");
    expect(resolvedWalletMode("dual", null)).toBe("unified");
  });
});

describe("setupSummaryLines", () => {
  it("says pesos-only in plain language", () => {
    expect(setupSummaryLines("ars_only", "unified", false)).toEqual([
      "Tu plata se ve en pesos.",
      "Por ahora, solo tu plata.",
    ]);
  });

  it("mentions shared expenses when enabled", () => {
    const lines = setupSummaryLines("dual", "split", true);
    expect(lines[0]).toContain("Diario y ahorro");
    expect(lines[1]).toContain("otras personas");
  });
});

describe("greetingName", () => {
  it("uses the first name", () => {
    expect(greetingName("Ana Pérez")).toBe("Ana");
    expect(greetingName("  ")).toBe("");
    expect(greetingName(undefined)).toBe("");
  });
});

describe("isOnboardingDone", () => {
  it("only treats an explicit false as pending", () => {
    expect(isOnboardingDone(false)).toBe(false);
    expect(isOnboardingDone(true)).toBe(true);
    expect(isOnboardingDone(null)).toBe(true);
    expect(isOnboardingDone(undefined)).toBe(true);
  });
});

describe("resolveOnboardingCompleted", () => {
  it("follows the cloud flag when the column exists", () => {
    expect(
      resolveOnboardingCompleted({
        tracked: true,
        completed: false,
        replay: true,
      }),
    ).toBe(false);
    expect(
      resolveOnboardingCompleted({
        tracked: true,
        completed: true,
        replay: true,
      }),
    ).toBe(true);
  });

  it("replays the wizard after logout when the column is missing", () => {
    expect(
      resolveOnboardingCompleted({
        tracked: false,
        completed: true,
        replay: true,
      }),
    ).toBe(false);
    expect(
      resolveOnboardingCompleted({
        tracked: false,
        completed: true,
        replay: false,
      }),
    ).toBe(true);
  });
});
