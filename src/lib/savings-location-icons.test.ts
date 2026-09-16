import { describe, expect, it } from "vitest";
import {
  faviconUrl,
  logoDevNameUrl,
  normalizeLocationName,
  resolveLocationIcon,
} from "./savings-location-icons";

describe("resolveLocationIcon", () => {
  it("maps known Argentine brands to a favicon domain", () => {
    const brubank = resolveLocationIcon("Brubank USD");
    expect(brubank.kind).toBe("brand");
    expect(brubank.matchedAlias).toBe("brubank");
    expect(brubank.src).toBe(faviconUrl("brubank.com"));

    const mp = resolveLocationIcon("Mercado Pago");
    expect(mp.matchedAlias).toBe("mercado pago");
    expect(mp.src).toBe(faviconUrl("mercadopago.com.ar"));
  });

  it("treats efectivo as a generic cash icon", () => {
    const cash = resolveLocationIcon("Efectivo");
    expect(cash.kind).toBe("cash");
    expect(cash.src).toBeNull();
  });

  it("falls back to a letter when the name is unknown", () => {
    const unknown = resolveLocationIcon("Cajón del escritorio");
    expect(unknown.kind).toBe("letter");
    expect(unknown.letter).toBe("C");
    expect(unknown.src).toBeNull();
  });

  it("uses Logo.dev name lookup only when a token is provided", () => {
    const withToken = resolveLocationIcon("Acme Bank", {
      logoDevToken: "pk_test",
    });
    expect(withToken.src).toBe(logoDevNameUrl("Acme Bank", "pk_test"));

    const without = resolveLocationIcon("Acme Bank", { logoDevToken: null });
    expect(without.src).toBeNull();
    expect(without.kind).toBe("letter");
  });

  it("normalizes accents for matching", () => {
    expect(normalizeLocationName("Caja de seguridad")).toBe("caja de seguridad");
    expect(resolveLocationIcon("Caja de seguridad").kind).toBe("safe");
  });
});
