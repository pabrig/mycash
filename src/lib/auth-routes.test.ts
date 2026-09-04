import { describe, expect, it } from "vitest";
import {
  isAuthShellPath,
  isGuideRequest,
  isLocalDevHost,
  isOnboardingPath,
  isPublicPath,
} from "@/lib/auth-routes";

describe("isPublicPath", () => {
  it("allows login, auth callback and join links", () => {
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/auth/callback")).toBe(true);
    expect(isPublicPath("/join/ABCD1234EFGH")).toBe(true);
  });

  it("protects the app shell", () => {
    expect(isPublicPath("/")).toBe(false);
    expect(isPublicPath("/cuenta")).toBe(false);
    expect(isPublicPath("/onboarding")).toBe(false);
    expect(isPublicPath("/compartido")).toBe(false);
    expect(isPublicPath("/join")).toBe(false);
  });
});

describe("isAuthShellPath", () => {
  it("hides chrome on login, join and onboarding", () => {
    expect(isAuthShellPath("/login")).toBe(true);
    expect(isAuthShellPath("/join/ABCD1234EFGH")).toBe(true);
    expect(isAuthShellPath("/onboarding")).toBe(true);
    expect(isAuthShellPath("/")).toBe(false);
    expect(isAuthShellPath("/cuenta")).toBe(false);
  });
});

describe("isOnboardingPath", () => {
  it("matches only the account setup route", () => {
    expect(isOnboardingPath("/onboarding")).toBe(true);
    expect(isOnboardingPath("/cuenta")).toBe(false);
    expect(isOnboardingPath("/login")).toBe(false);
  });
});

describe("isGuideRequest", () => {
  it("detects FAQ guide query on onboarding", () => {
    expect(isGuideRequest("/onboarding", "guia=1")).toBe(true);
    expect(isGuideRequest("/onboarding", "?guia=1&tema=metas")).toBe(true);
    expect(
      isGuideRequest("/onboarding", new URLSearchParams("guia=1&tema=arrastre")),
    ).toBe(true);
    expect(isGuideRequest("/onboarding", "")).toBe(false);
    expect(isGuideRequest("/cuenta", "guia=1")).toBe(false);
  });
});

describe("isLocalDevHost", () => {
  it("allows localhost and loopback", () => {
    expect(isLocalDevHost("localhost")).toBe(true);
    expect(isLocalDevHost("127.0.0.1")).toBe(true);
    expect(isLocalDevHost("[::1]")).toBe(true);
    expect(isLocalDevHost("mycash.app")).toBe(false);
  });
});
