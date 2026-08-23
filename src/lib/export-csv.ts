import type { Statement } from "./export-statement";

const SEPARATOR = ";";

/** CSV con BOM y `;` para que Excel en español abra las columnas bien. */
export function statementToCsv(statement: Statement): string {
  const header = [
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
  ];
  const lines = [
    header.map(csvCell).join(SEPARATOR),
    ...statement.rows.map((row) =>
      [
        row.date,
        row.type,
        row.description,
        csvNumber(row.amount),
        row.currency,
        csvNumber(row.amountArs),
        row.category,
        row.scope,
        row.kind,
        row.wallet,
        row.group,
      ]
        .map(csvCell)
        .join(SEPARATOR),
    ),
  ];
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

export function statementToCsvBlob(statement: Statement): Blob {
  return new Blob([statementToCsv(statement)], {
    type: "text/csv;charset=utf-8",
  });
}

export function csvNumber(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

export function csvCell(value: string): string {
  if (/[;"\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
