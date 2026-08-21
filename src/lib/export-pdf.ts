import { formatMoney } from "./format";
import type { Statement } from "./export-statement";

const TEAL: [number, number, number] = [13, 148, 136];
const MUTED: [number, number, number] = [113, 113, 122];
const LINE: [number, number, number] = [228, 228, 231];

export async function statementToPdfBlob(statement: Statement): Promise<Blob> {
  const [{ jsPDF }, autoTableMod] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const autoTable = autoTableMod.default;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 16;
  let y = 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...TEAL);
  doc.text("Myca$h", margin, y);

  y += 8;
  doc.setTextColor(24, 24, 27);
  doc.setFontSize(18);
  doc.text(statement.title, margin, y);

  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(`Generado ${statement.generatedOn}`, margin, y);

  y += 10;
  const colW = (pageWidth - margin * 2) / Math.min(statement.totals.length, 4);
  statement.totals.slice(0, 4).forEach((line, i) => {
    const x = margin + i * colW;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(line.label, x, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(24, 24, 27);
    doc.text(formatMoney(line.amountArs), x, y + 6);
  });
  y += 16;

  if (statement.months.length > 0) {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Mes", "Ingreso", "Gasto", "Ahorro"]],
      body: statement.months.map((row) => [
        row.month,
        formatMoney(row.income),
        formatMoney(row.expenses),
        formatMoney(row.saved),
      ]),
      styles: {
        font: "helvetica",
        fontSize: 8,
        cellPadding: 2,
        textColor: [39, 39, 42],
        lineColor: LINE,
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [250, 250, 250],
        textColor: MUTED,
        fontStyle: "bold",
        fontSize: 7,
      },
      columnStyles: {
        1: { halign: "right" },
        2: { halign: "right" },
        3: { halign: "right" },
      },
    });
    y = lastTableY(
      doc as unknown as { lastAutoTable?: { finalY: number } },
      y,
    ) + 8;
  }

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Fecha", "Tipo", "Que fue", "Monto", "Detalle"]],
    body: statement.rows.map((row) => [
      row.date,
      row.type,
      row.description,
      row.currency === "USD"
        ? `USD ${row.amount.toFixed(2)}`
        : formatMoney(row.amount),
      row.scope || row.kind,
    ]),
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 2,
      textColor: [39, 39, 42],
      lineColor: LINE,
      lineWidth: 0.1,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [250, 250, 250],
      textColor: MUTED,
      fontStyle: "bold",
      fontSize: 7,
    },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 22 },
      3: { halign: "right", cellWidth: 28 },
      4: { cellWidth: 28 },
    },
    didDrawPage: (data) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...MUTED);
      doc.text(
        String(data.pageNumber),
        pageWidth - margin,
        doc.internal.pageSize.getHeight() - 10,
        { align: "right" },
      );
    },
  });

  return doc.output("blob");
}

function lastTableY(doc: { lastAutoTable?: { finalY: number } }, fallback: number): number {
  return doc.lastAutoTable?.finalY ?? fallback;
}
