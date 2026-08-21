import { describe, expect, it } from "vitest";
import {
  resolveMoneyProfile,
  settingsForMoneyProfile,
  showOfficialRate,
} from "./money-profile";

describe("resolveMoneyProfile", () => {
  it("is pesos-only when USD and bolsillos are off", () => {
    expect(resolveMoneyProfile(false, "unified")).toBe("ars_only");
  });

  it("is savings when bolsillos are on without loading USD", () => {
    expect(resolveMoneyProfile(false, "split")).toBe("ars_savings");
  });

  it("is dual whenever USD loading is on", () => {
    expect(resolveMoneyProfile(true, "unified")).toBe("dual");
    expect(resolveMoneyProfile(true, "split")).toBe("dual");
  });
});

describe("settingsForMoneyProfile", () => {
  it("turns off USD and bolsillos for pesos-only", () => {
    expect(settingsForMoneyProfile("ars_only", "split")).toEqual({
      usdEnabled: false,
      walletMode: "unified",
    });
  });

  it("keeps bolsillos without USD loading for savings", () => {
    expect(settingsForMoneyProfile("ars_savings", "unified")).toEqual({
      usdEnabled: false,
      walletMode: "split",
    });
  });

  it("enables USD loading and keeps the current bolsillo choice", () => {
    expect(settingsForMoneyProfile("dual", "split")).toEqual({
      usdEnabled: true,
      walletMode: "split",
    });
    expect(settingsForMoneyProfile("dual", "unified")).toEqual({
      usdEnabled: true,
      walletMode: "unified",
    });
  });
});

describe("showOfficialRate", () => {
  it("shows the rate for USD loading or USD savings", () => {
    expect(showOfficialRate(true, "unified")).toBe(true);
    expect(showOfficialRate(false, "split")).toBe(true);
    expect(showOfficialRate(false, "unified")).toBe(false);
  });
});
