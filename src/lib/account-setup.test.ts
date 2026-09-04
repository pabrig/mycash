import { describe, expect, it } from "vitest";
import {
  canContinueOnboarding,
  greetingName,
  guideHref,
  HOWTO_GOALS,
  HOWTO_MOVEMENTS,
  HOWTO_SHARED,
  HOWTO_SPLIT,
  isOnboardingDone,
  listGuideTopics,
  onboardingGuideSteps,
  onboardingSteps,
  parseGuideTopic,
  resolveOnboardingCompleted,
  resolvedWalletMode,
  setupSummaryLines,
  SHARED_FUNDING_OPTIONS,
} from "./account-setup";

describe("onboardingSteps", () => {
  it("asks money, then shared, then how the app works", () => {
    expect(
      onboardingSteps({
        moneyProfile: "ars_only",
        askShared: true,
        sharedEnabled: null,
        showSharedHowTo: false,
      }),
    ).toEqual([
      "welcome",
      "money",
      "shared",
      "howto_movements",
      "howto_period",
      "howto_goals",
      "howto_split",
      "done",
    ]);
    expect(
      onboardingSteps({
        moneyProfile: "ars_savings",
        askShared: true,
        sharedEnabled: false,
        showSharedHowTo: false,
      }),
    ).toEqual([
      "welcome",
      "money",
      "shared",
      "howto_movements",
      "howto_period",
      "howto_goals",
      "howto_split",
      "done",
    ]);
  });

  it("asks how shared expenses count after they turn shared on", () => {
    expect(
      onboardingSteps({
        moneyProfile: "dual",
        askShared: true,
        sharedEnabled: true,
        showSharedHowTo: true,
      }),
    ).toEqual([
      "welcome",
      "money",
      "view",
      "shared",
      "shared_funding",
      "howto_movements",
      "howto_period",
      "howto_goals",
      "howto_split",
      "howto_shared",
      "done",
    ]);
  });

  it("asks how the group counts when they already joined", () => {
    expect(
      onboardingSteps({
        moneyProfile: "ars_only",
        askShared: false,
        sharedEnabled: true,
        showSharedHowTo: true,
      }),
    ).toEqual([
      "welcome",
      "money",
      "shared_funding",
      "howto_movements",
      "howto_period",
      "howto_goals",
      "howto_split",
      "howto_shared",
      "done",
    ]);
  });

  it("does not show the view step until they pick dual", () => {
    expect(
      onboardingSteps({
        moneyProfile: null,
        askShared: true,
        sharedEnabled: null,
        showSharedHowTo: false,
      }),
    ).toEqual([
      "welcome",
      "money",
      "shared",
      "howto_movements",
      "howto_period",
      "howto_goals",
      "howto_split",
      "done",
    ]);
  });

  it("explains shared expenses only when that feature is on", () => {
    expect(
      onboardingSteps({
        moneyProfile: "ars_only",
        askShared: false,
        sharedEnabled: false,
        showSharedHowTo: false,
      }),
    ).not.toContain("howto_shared");
    expect(
      onboardingSteps({
        moneyProfile: "ars_only",
        askShared: false,
        sharedEnabled: false,
        showSharedHowTo: false,
      }),
    ).not.toContain("shared_funding");
  });

  it("always explains how to split a bill", () => {
    expect(
      onboardingSteps({
        moneyProfile: "ars_only",
        askShared: false,
        sharedEnabled: false,
        showSharedHowTo: false,
      }),
    ).toContain("howto_split");
  });

  it("always explains savings goals", () => {
    expect(
      onboardingSteps({
        moneyProfile: "ars_only",
        askShared: false,
        sharedEnabled: false,
        showSharedHowTo: false,
      }),
    ).toContain("howto_goals");
  });

  it("can hide the goals how-to behind a feature flag", () => {
    expect(
      onboardingSteps({
        moneyProfile: "ars_only",
        askShared: false,
        sharedEnabled: false,
        showSharedHowTo: false,
        includeGoalsHowTo: false,
      }),
    ).not.toContain("howto_goals");
  });
});

describe("onboardingGuideSteps", () => {
  it("skips setup questions and keeps the how-to screens", () => {
    expect(onboardingGuideSteps({ showSharedHowTo: false })).toEqual([
      "welcome",
      "howto_movements",
      "howto_period",
      "howto_goals",
      "howto_split",
      "done",
    ]);
    expect(onboardingGuideSteps({ showSharedHowTo: true })).toContain(
      "howto_shared",
    );
  });

  it("can omit goals how-to", () => {
    expect(
      onboardingGuideSteps({
        showSharedHowTo: false,
        includeGoalsHowTo: false,
      }),
    ).not.toContain("howto_goals");
  });
});

describe("guide FAQ topics", () => {
  it("parses tema ids and builds hrefs", () => {
    expect(parseGuideTopic("metas")).toBe("metas");
    expect(parseGuideTopic("nope")).toBeNull();
    expect(guideHref()).toBe("/onboarding?guia=1");
    expect(guideHref("arrastre")).toBe("/onboarding?guia=1&tema=arrastre");
  });

  it("lists cuenta options for settings help", () => {
    const topics = listGuideTopics({ includeGoals: true, includeShared: true });
    const ids = topics.map((t) => t.id);
    expect(ids).toContain("arrastre");
    expect(ids).toContain("plata");
    expect(ids).toContain("metas");
    expect(ids).toContain("compartido");
    expect(listGuideTopics({ includeGoals: false }).map((t) => t.id)).not.toContain(
      "metas",
    );
  });
});

describe("SHARED_FUNDING_OPTIONS", () => {
  it("explains payer and pool with a concrete example", () => {
    const payer = SHARED_FUNDING_OPTIONS.find((option) => option.id === "payer");
    const pool = SHARED_FUNDING_OPTIONS.find((option) => option.id === "pool");
    expect(payer?.example).toMatch(/súper/i);
    expect(pool?.example).toMatch(/parten|suman|restan/i);
  });
});

describe("HOWTO_MOVEMENTS", () => {
  it("explains that movements can be in the past or the future", () => {
    const text = [
      HOWTO_MOVEMENTS.sub,
      ...HOWTO_MOVEMENTS.items.map((item) => `${item.title} ${item.body}`),
    ].join(" ");
    expect(text).toMatch(/ya pasó/i);
    expect(text).toMatch(/viene/i);
  });
});

describe("HOWTO_GOALS", () => {
  it("explains optional goals in plain language", () => {
    const text = [
      HOWTO_GOALS.sub,
      ...HOWTO_GOALS.items.map((item) => `${item.title} ${item.body}`),
    ].join(" ");
    expect(text).toMatch(/opcionales/i);
    expect(text).toMatch(/cuenta/i);
    expect(text).toMatch(/recordatorio|resta del disponible/i);
  });
});

describe("HOWTO_SPLIT", () => {
  it("explains equal shares without mixing it with the monthly budget", () => {
    const text = [
      HOWTO_SPLIT.sub,
      ...HOWTO_SPLIT.items.map((item) => `${item.title} ${item.body}`),
    ].join(" ");
    expect(text).toMatch(/dividir/i);
    expect(text).toMatch(/partes iguales/i);
    expect(text).toMatch(/no es la plata del mes/i);
  });
});

describe("HOWTO_SHARED", () => {
  it("explains that shared expenses can go to more than one group", () => {
    const text = [
      HOWTO_SHARED.sub,
      ...HOWTO_SHARED.items.map((item) => `${item.title} ${item.body}`),
    ].join(" ");
    expect(text).toMatch(/más de un grupo/i);
    expect(text).toMatch(/elegís el grupo/i);
  });

  it("recaps payer vs pool per group instead of sending them to Cuenta first", () => {
    const body = HOWTO_SHARED.items.find((item) => item.title === "De dónde sale")
      ?.body;
    expect(body).toMatch(/de quien pagó/i);
    expect(body).toMatch(/plata del grupo/i);
    expect(body).toMatch(/por grupo|cada grupo/i);
    expect(body).not.toMatch(/en cuenta elegís/i);
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
    expect(
      canContinueOnboarding("shared_funding", {
        moneyProfile: "ars_only",
        walletMode: null,
        sharedEnabled: true,
        sharedFunding: null,
      }),
    ).toBe(false);
    expect(
      canContinueOnboarding("shared_funding", {
        moneyProfile: "ars_only",
        walletMode: null,
        sharedEnabled: true,
        sharedFunding: "pool",
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
    const lines = setupSummaryLines("dual", "split", true, "payer");
    expect(lines[0]).toContain("Diario y ahorro");
    expect(lines[1]).toContain("otras personas");
    expect(lines[2]).toMatch(/propia plata/);
  });

  it("says when shared expenses come from the group pool", () => {
    const lines = setupSummaryLines("ars_only", "unified", true, "pool");
    expect(lines).toContain("Los gastos del grupo salen de la plata compartida.");
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
  it("follows the cloud flag when the column exists and they are not replaying", () => {
    expect(
      resolveOnboardingCompleted({
        tracked: true,
        completed: false,
        replay: false,
      }),
    ).toBe(false);
    expect(
      resolveOnboardingCompleted({
        tracked: true,
        completed: true,
        replay: false,
      }),
    ).toBe(true);
  });

  it("replays the wizard locally even if the cloud already marked it done", () => {
    expect(
      resolveOnboardingCompleted({
        tracked: true,
        completed: true,
        replay: true,
      }),
    ).toBe(false);
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
