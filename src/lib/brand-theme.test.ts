import { describe, expect, it } from "vitest";
import {
  BRAND_THEME,
  DEFAULT_BRAND_THEME,
  brandThemeBackground,
} from "@/lib/brand-theme";

describe("brand-theme", () => {
  it("solo Ciruela (indigo)", () => {
    expect(BRAND_THEME).toBe("indigo");
    expect(DEFAULT_BRAND_THEME).toBe("indigo");
  });

  it("fondos light/dark", () => {
    expect(brandThemeBackground(false)).toBe("#f7f4fc");
    expect(brandThemeBackground(true)).toBe("#100a18");
  });
});
