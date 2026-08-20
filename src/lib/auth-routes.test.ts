import { describe, expect, it } from "vitest";
import { isAuthShellPath, isPublicPath } from "@/lib/auth-routes";

describe("isPublicPath", () => {
  it("allows login, auth callback and join links", () => {
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/auth/callback")).toBe(true);
    expect(isPublicPath("/join/ABCD1234EFGH")).toBe(true);
  });

  it("protects the app shell", () => {
    expect(isPublicPath("/")).toBe(false);
    expect(isPublicPath("/cuenta")).toBe(false);
    expect(isPublicPath("/compartido")).toBe(false);
    expect(isPublicPath("/join")).toBe(false);
  });
});

describe("isAuthShellPath", () => {
  it("hides chrome on login and join", () => {
    expect(isAuthShellPath("/login")).toBe(true);
    expect(isAuthShellPath("/join/ABCD1234EFGH")).toBe(true);
    expect(isAuthShellPath("/")).toBe(false);
    expect(isAuthShellPath("/cuenta")).toBe(false);
  });
});
