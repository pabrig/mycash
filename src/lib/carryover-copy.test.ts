import { describe, expect, it } from "vitest";
import { priorMonthsRangeLabel } from "./carryover-copy";

describe("priorMonthsRangeLabel", () => {
  it("returns null for january", () => {
    expect(priorMonthsRangeLabel(1)).toBeNull();
  });

  it("returns a single month for february", () => {
    expect(priorMonthsRangeLabel(2)).toBe("Enero");
  });

  it("returns a range for later months", () => {
    expect(priorMonthsRangeLabel(4)).toBe("Enero a Marzo");
  });
});
