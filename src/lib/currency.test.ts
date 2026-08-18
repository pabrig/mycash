import { describe, expect, it } from "vitest";
import { getDefaultRate, toArs } from "./currency";

describe("toArs", () => {
  const rate = { year: 2026, month: 8, usdToArs: 1350 };

  it("returns ARS unchanged", () => {
    expect(toArs(100000, "ARS", rate)).toBe(100000);
  });

  it("converts USD with official rate", () => {
    expect(toArs(100, "USD", rate)).toBe(135000);
  });
});

describe("getDefaultRate", () => {
  it("returns fallback rates", () => {
    const rate = getDefaultRate(2026, 3);
    expect(rate.year).toBe(2026);
    expect(rate.month).toBe(3);
    expect(rate.usdToArs).toBeGreaterThan(0);
  });
});
