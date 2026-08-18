import { describe, expect, it } from "vitest";
import { parseOfficialRate } from "./dolarapi";

describe("parseOfficialRate", () => {
  it("maps oficial venta to USD", () => {
    const rates = parseOfficialRate({
      moneda: "USD",
      casa: "oficial",
      nombre: "Oficial",
      compra: 1300,
      venta: 1350,
      fechaActualizacion: "2026-08-18T19:01:00.000Z",
    });

    expect(rates.usdToArs).toBe(1350);
    expect(rates.updatedAt).toBe("2026-08-18T19:01:00.000Z");
  });
});
