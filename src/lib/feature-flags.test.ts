import { describe, expect, it } from "vitest";
import {
  featureFlagEnvKey,
  parseFeatureFlagValue,
} from "./feature-flags";

describe("parseFeatureFlagValue", () => {
  it("accepts common truthy values", () => {
    expect(parseFeatureFlagValue("1")).toBe(true);
    expect(parseFeatureFlagValue("true")).toBe(true);
    expect(parseFeatureFlagValue("ON")).toBe(true);
    expect(parseFeatureFlagValue(" yes ")).toBe(true);
  });

  it("accepts common falsy values", () => {
    expect(parseFeatureFlagValue("0")).toBe(false);
    expect(parseFeatureFlagValue("false")).toBe(false);
    expect(parseFeatureFlagValue("off")).toBe(false);
    expect(parseFeatureFlagValue("NO")).toBe(false);
  });

  it("returns null when unset or unknown", () => {
    expect(parseFeatureFlagValue(undefined)).toBeNull();
    expect(parseFeatureFlagValue("")).toBeNull();
    expect(parseFeatureFlagValue("maybe")).toBeNull();
  });
});

describe("featureFlagEnvKey", () => {
  it("maps flags to NEXT_PUBLIC_FF_* keys", () => {
    expect(featureFlagEnvKey("skipAuth")).toBe("NEXT_PUBLIC_FF_SKIP_AUTH");
    expect(featureFlagEnvKey("savingsGoals")).toBe(
      "NEXT_PUBLIC_FF_SAVINGS_GOALS",
    );
  });
});
