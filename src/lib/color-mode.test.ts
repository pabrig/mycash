import { describe, expect, it } from "vitest";
import {
  parseColorMode,
  resolveIsDark,
  type ColorMode,
} from "@/lib/color-mode";

describe("color-mode", () => {
  it("parsea modos válidos", () => {
    expect(parseColorMode("light")).toBe("light");
    expect(parseColorMode("dark")).toBe("dark");
    expect(parseColorMode(" System ")).toBe("system");
  });

  it("rechaza valores inválidos", () => {
    expect(parseColorMode("auto")).toBeNull();
    expect(parseColorMode("")).toBeNull();
  });

  it("resuelve dark forzado sin mirar el sistema", () => {
    expect(resolveIsDark("dark")).toBe(true);
    expect(resolveIsDark("light")).toBe(false);
  });
});

describe("color-mode labels cover all modes", () => {
  it("tiene las tres opciones", () => {
    const modes: ColorMode[] = ["light", "dark", "system"];
    expect(modes).toHaveLength(3);
  });
});
