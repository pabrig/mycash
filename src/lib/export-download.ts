import { downloadBlob } from "./download";
import { statementToCsvBlob } from "./export-csv";
import { statementToPdfBlob } from "./export-pdf";
import {
  statementFilename,
  type Statement,
  type StatementFormat,
} from "./export-statement";
import { statementToXlsxBlob } from "./export-xlsx";

export async function downloadStatement(
  statement: Statement,
  format: StatementFormat,
): Promise<void> {
  const name = statementFilename(statement, format);
  if (format === "csv") {
    downloadBlob(statementToCsvBlob(statement), name);
    return;
  }
  if (format === "xlsx") {
    downloadBlob(statementToXlsxBlob(statement), name);
    return;
  }
  downloadBlob(await statementToPdfBlob(statement), name);
}
