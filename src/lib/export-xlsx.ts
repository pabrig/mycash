import { strToU8, zipSync } from "fflate";
import type { Statement, StatementMonthRow, StatementRow } from "./export-statement";

const XLSX_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export function statementToXlsxBlob(statement: Statement): Blob {
  const sheets: { name: string; rows: (string | number)[][] }[] = [
    { name: "Resumen", rows: summarySheet(statement) },
  ];
  if (statement.months.length > 0) {
    sheets.push({ name: "Meses", rows: monthsSheet(statement.months) });
  }
  sheets.push({ name: "Movimientos", rows: movementsSheet(statement.rows) });

  const files: Record<string, Uint8Array> = {
    "[Content_Types].xml": strToU8(contentTypesXml(sheets.length)),
    "_rels/.rels": strToU8(RELS),
    "xl/workbook.xml": strToU8(workbookXml(sheets)),
    "xl/_rels/workbook.xml.rels": strToU8(workbookRelsXml(sheets.length)),
  };
  sheets.forEach((sheet, i) => {
    files[`xl/worksheets/sheet${i + 1}.xml`] = strToU8(worksheetXml(sheet.rows));
  });

  const zipped = zipSync(files, { level: 6 });
  return new Blob([new Uint8Array(zipped)], { type: XLSX_TYPE });
}

function summarySheet(statement: Statement): (string | number)[][] {
  return [
    ["Myca$h"],
    [statement.title],
    [`Generado ${statement.generatedOn}`],
    [],
    ["Concepto", "ARS"],
    ...statement.totals.map((line) => [line.label, round2(line.amountArs)]),
    [],
    ["Movimientos", statement.rows.length],
  ];
}

function monthsSheet(months: StatementMonthRow[]): (string | number)[][] {
  return [
    ["Mes", "Ingreso", "Gasto", "Ahorro"],
    ...months.map((row) => [
      row.month,
      round2(row.income),
      round2(row.expenses),
      round2(row.saved),
    ]),
  ];
}

function movementsSheet(rows: StatementRow[]): (string | number)[][] {
  return [
    [
      "Fecha",
      "Tipo",
      "Descripción",
      "Monto",
      "Moneda",
      "Equiv. ARS",
      "Categoría",
      "Ámbito",
      "Clase",
      "Bolsillo",
      "Grupo",
    ],
    ...rows.map((row) => [
      row.date,
      row.type,
      row.description,
      round2(row.amount),
      row.currency,
      round2(row.amountArs),
      row.category,
      row.scope,
      row.kind,
      row.wallet,
      row.group,
    ]),
  ];
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function worksheetXml(rows: (string | number)[][]): string {
  const body = rows
    .map((row, r) => {
      const cells = row
        .map((value, c) => cellXml(colLetter(c + 1), r + 1, value))
        .join("");
      return `<row r="${r + 1}">${cells}</row>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${body}</sheetData></worksheet>`;
}

function cellXml(col: string, row: number, value: string | number): string {
  const ref = `${col}${row}`;
  if (typeof value === "number" && Number.isFinite(value)) {
    return `<c r="${ref}" t="n"><v>${value}</v></c>`;
  }
  return `<c r="${ref}" t="inlineStr"><is><t>${xmlEscape(String(value))}</t></is></c>`;
}

function colLetter(index: number): string {
  let n = index;
  let out = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function sheetName(name: string): string {
  return xmlEscape(name.slice(0, 31));
}

function contentTypesXml(sheetCount: number): string {
  const overrides = Array.from({ length: sheetCount }, (_, i) => {
    return `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
${overrides}
</Types>`;
}

const RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

function workbookXml(sheets: { name: string }[]): string {
  const list = sheets
    .map(
      (sheet, i) =>
        `<sheet name="${sheetName(sheet.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`,
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets>${list}</sheets>
</workbook>`;
}

function workbookRelsXml(sheetCount: number): string {
  const rels = Array.from({ length: sheetCount }, (_, i) => {
    return `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${rels}
</Relationships>`;
}
