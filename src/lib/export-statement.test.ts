import { unzipSync, strFromU8 } from "fflate";
import { describe, expect, it } from "vitest";
import { statementToCsv, csvCell } from "./export-csv";
import { statementToPdfBlob } from "./export-pdf";
import {
  buildStatement,
  slugPeriod,
  statementFilename,
} from "./export-statement";
import { statementToXlsxBlob } from "./export-xlsx";
import type { MonthlyRate, Movement } from "./types";

const rate: MonthlyRate = {
  year: 2026,
  month: 2,
  usdToArs: 1200,
};

const movements: Movement[] = [
  {
    id: "1",
    type: "income",
    date: "2026-02-10",
    amount: 3500,
    currency: "USD",
    description: "Sueldo",
    incomeKind: "passive",
    source: "sueldo",
    createdAt: "2026-02-10T00:00:00Z",
  },
  {
    id: "2",
    type: "expense",
    date: "2026-02-08",
    amount: 100,
    currency: "USD",
    description: "Super; compartido",
    scope: "shared",
    kind: "variable",
    category: "alimentacion",
    householdName: "Casa",
    createdAt: "2026-02-08T00:00:00Z",
  },
  {
    id: "3",
    type: "expense",
    date: "2026-01-10",
    amount: 50000,
    currency: "ARS",
    description: "Enero",
    scope: "personal",
    kind: "variable",
    category: "otros",
    createdAt: "2026-01-10T00:00:00Z",
  },
];

describe("buildStatement", () => {
  it("exports the selected month in chronological order", () => {
    const statement = buildStatement({
      scope: "month",
      year: 2026,
      month: 2,
      movements,
      rates: [rate],
      generatedAt: new Date("2026-08-21T12:00:00"),
    });

    expect(statement.title).toBe("Febrero 2026");
    expect(statement.filenameBase).toBe("mycash-febrero-2026");
    expect(statement.rows.map((row) => row.description)).toEqual([
      "Super; compartido",
      "Sueldo",
    ]);
    expect(statement.rows[0]?.scope).toBe("Compartido");
    expect(statement.rows[0]?.group).toBe("Casa");
    expect(statement.rows[0]?.amountArs).toBe(120000);
    expect(statement.totals.map((line) => line.label)).toContain("Disponible");
    expect(statement.months).toEqual([]);
  });

  it("exports the year with monthly totals and skips other years", () => {
    const statement = buildStatement({
      scope: "year",
      year: 2026,
      month: 2,
      movements,
      rates: [rate, { year: 2026, month: 1, usdToArs: 1200 }],
      generatedAt: new Date("2026-08-21T12:00:00"),
    });

    expect(statement.title).toBe("Año 2026");
    expect(statement.filenameBase).toBe("mycash-2026");
    expect(statement.rows).toHaveLength(3);
    expect(statement.months).toHaveLength(8);
    expect(statement.months[1]?.month).toBe("Febrero 2026");
    expect(statement.totals.some((line) => line.label === "Ahorro")).toBe(true);
  });
});

describe("csv", () => {
  it("uses a BOM and semicolon so Excel in Spanish keeps columns", () => {
    const statement = buildStatement({
      scope: "month",
      year: 2026,
      month: 2,
      movements,
      rates: [rate],
      generatedAt: new Date("2026-08-21T12:00:00"),
    });
    const csv = statementToCsv(statement);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("Fecha;Tipo;Descripción");
    expect(csv).toContain('"Super; compartido"');
    expect(csv).toContain("120000,00");
  });

  it("quotes cells that contain the separator", () => {
    expect(csvCell("a;b")).toBe('"a;b"');
    expect(csvCell('dijo "hola"')).toBe('"dijo ""hola"""');
  });
});

describe("xlsx", () => {
  it("packs a workbook with summary and movements sheets", async () => {
    const statement = buildStatement({
      scope: "year",
      year: 2026,
      month: 2,
      movements,
      rates: [rate, { year: 2026, month: 1, usdToArs: 1200 }],
      generatedAt: new Date("2026-08-21T12:00:00"),
    });
    const blob = statementToXlsxBlob(statement);
    const files = unzipSync(new Uint8Array(await blob.arrayBuffer()));
    const workbook = strFromU8(files["xl/workbook.xml"]);
    expect(workbook).toContain("Resumen");
    expect(workbook).toContain("Meses");
    expect(workbook).toContain("Movimientos");
    expect(strFromU8(files["xl/worksheets/sheet3.xml"])).toContain("Sueldo");
  });
});

describe("pdf", () => {
  it("builds a printable PDF", async () => {
    const statement = buildStatement({
      scope: "month",
      year: 2026,
      month: 2,
      movements,
      rates: [rate],
      generatedAt: new Date("2026-08-21T12:00:00"),
    });
    const blob = await statementToPdfBlob(statement);
    const header = new TextDecoder().decode(
      new Uint8Array(await blob.arrayBuffer()).slice(0, 5),
    );
    expect(header).toBe("%PDF-");
  });
});

describe("filename", () => {
  it("slugs the month name", () => {
    expect(slugPeriod("Agosto 2026")).toBe("agosto-2026");
    const statement = buildStatement({
      scope: "month",
      year: 2026,
      month: 2,
      movements,
      rates: [rate],
      generatedAt: new Date("2026-08-21T12:00:00"),
    });
    expect(statementFilename(statement, "pdf")).toBe(
      "mycash-febrero-2026.pdf",
    );
  });
});
