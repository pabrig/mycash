import { describe, expect, it } from "vitest";
import {
  MAX_HOUSEHOLDS_PER_USER,
  MAX_MEMBERS_PER_HOUSEHOLD,
  resolveSharedHouseholdId,
} from "./household";

describe("household caps", () => {
  it("matches the SQL F&F limits", () => {
    expect(MAX_HOUSEHOLDS_PER_USER).toBe(8);
    expect(MAX_MEMBERS_PER_HOUSEHOLD).toBe(8);
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
