import { describe, expect, it } from "vitest";
import {
  applyLocationPatch,
  buildLocation,
  locationSharePercent,
  locationsGap,
  sortedLocations,
  sumLocations,
  type SavingsLocation,
} from "./savings-locations";

function loc(
  partial: Partial<SavingsLocation> & Pick<SavingsLocation, "id" | "name">,
): SavingsLocation {
  return {
    amount: 0,
    sortOrder: 0,
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

describe("savings-locations", () => {
  it("builds a location with trimmed name and non-negative amount", () => {
    const created = buildLocation({ name: "  Brubank  ", amount: -10 }, 2);
    expect(created.name).toBe("Brubank");
    expect(created.amount).toBe(0);
    expect(created.sortOrder).toBe(2);
    expect(created.id).toBeTruthy();
  });

  it("applies patches without wiping name on blank", () => {
    const base = loc({ id: "1", name: "IBKR", amount: 100 });
    const next = applyLocationPatch(base, { name: "   ", amount: 50 });
    expect(next.name).toBe("IBKR");
    expect(next.amount).toBe(50);
  });

  it("sums and sorts locations", () => {
    const list = [
      loc({ id: "b", name: "B", amount: 20, sortOrder: 2 }),
      loc({ id: "a", name: "A", amount: 10, sortOrder: 1 }),
    ];
    expect(sumLocations(list)).toBe(30);
    expect(sortedLocations(list).map((l) => l.id)).toEqual(["a", "b"]);
  });

  it("computes share percent and gap vs ahorro total", () => {
    expect(locationSharePercent(50, 200)).toBe(25);
    expect(locationSharePercent(10, 0)).toBe(0);
    const list = [loc({ id: "1", name: "A", amount: 80 })];
    expect(locationsGap(list, 100)).toBe(-20);
    expect(locationsGap(list, 70)).toBe(10);
  });
});
