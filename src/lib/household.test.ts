import { describe, expect, it } from "vitest";
import {
  closeHouseholdConfirmMessage,
  HOUSEHOLD_NAME_MAX,
  MAX_HOUSEHOLDS_PER_USER,
  MAX_MEMBERS_PER_HOUSEHOLD,
  normalizeHouseholdName,
  resolveSharedHouseholdId,
} from "./household";

describe("household caps", () => {
  it("matches the SQL F&F limits", () => {
    expect(MAX_HOUSEHOLDS_PER_USER).toBe(8);
    expect(MAX_MEMBERS_PER_HOUSEHOLD).toBe(8);
  });
});

describe("normalizeHouseholdName", () => {
  it("trims and rejects an empty name", () => {
    expect(normalizeHouseholdName("  Casa  ")).toBe("Casa");
    expect(normalizeHouseholdName("   ")).toBeNull();
    expect(normalizeHouseholdName("")).toBeNull();
  });

  it("collapses inner spaces and caps length", () => {
    expect(normalizeHouseholdName("Casa   grande")).toBe("Casa grande");
    expect(normalizeHouseholdName("x".repeat(HOUSEHOLD_NAME_MAX + 5))).toHaveLength(
      HOUSEHOLD_NAME_MAX,
    );
  });
});

describe("closeHouseholdConfirmMessage", () => {
  it("does not mention others when the owner is alone", () => {
    expect(closeHouseholdConfirmMessage("Casa", [])).toMatch(/borrar casa/i);
    expect(closeHouseholdConfirmMessage("Casa", [])).not.toMatch(/avisamos/i);
  });

  it("says it will notify the other people in the group", () => {
    expect(closeHouseholdConfirmMessage("Casa", ["Ana"])).toMatch(/le avisamos a ana/i);
    expect(closeHouseholdConfirmMessage("Viaje", ["Ana", "Luis"])).toMatch(
      /les avisamos a ana y luis/i,
    );
  });
});

describe("resolveSharedHouseholdId", () => {
  it("returns null for personal movements", () => {
    expect(resolveSharedHouseholdId("personal", "h1", "h2")).toBeNull();
    expect(resolveSharedHouseholdId(undefined, "h1", "h2")).toBeNull();
  });

  it("prefers the explicit group over the active one", () => {
    expect(resolveSharedHouseholdId("shared", "h1", "h2")).toBe("h1");
  });

  it("falls back to the active group", () => {
    expect(resolveSharedHouseholdId("shared", undefined, "h2")).toBe("h2");
    expect(resolveSharedHouseholdId("shared", "  ", "h2")).toBe("h2");
  });

  it("returns null when there is no group", () => {
    expect(resolveSharedHouseholdId("shared", undefined, null)).toBeNull();
  });
});
