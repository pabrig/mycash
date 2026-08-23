"use client";

import { useState } from "react";
import { ChoiceOption } from "@/components/ChoiceOption";
import { DetailSheet } from "@/components/ui/DetailSheet";
import { useFinance } from "@/context/FinanceContext";
import { downloadStatement } from "@/lib/export-download";
import {
  buildStatement,
  STATEMENT_FORMATS,
  type StatementFormat
} from "@/lib/export-statement";
import { friendlyError } from "@/lib/errors";
import { formatMonth } from "@/lib/format";
import type { SummaryScope } from "@/lib/types";

export function ExportStatementSheet({
  open,
  onClose,
  initialScope
}: {
  open: boolean;
  onClose: () => void;
  initialScope: SummaryScope;
}) {
  if (!open) return null;
  return <ExportStatementBody onClose={onClose} initialScope={initialScope} />;
}

function ExportStatementBody({
  onClose,
  initialScope
}: {
  onClose: () => void;
  initialScope: SummaryScope;
}) {
  const { year, month, balanceMovements, rates } = useFinance();
  const [scope, setScope] = useState<SummaryScope>(initialScope);
  const [format, setFormat] = useState<StatementFormat>("pdf");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const periodLabel =
    scope === "year" ? `Año ${year}` : formatMonth(year, month);

  async function handleDownload() {
    setBusy(true);
    setError("");
    try {
      const statement = buildStatement({
        scope,
        year,
        month,
        movements: balanceMovements,
        rates
      });
      await downloadStatement(statement, format);
      onClose();
    } catch (e) {
      setError(friendlyError(e, "No se pudo armar el archivo."));
      setBusy(false);
    }
  }

  return (
    <DetailSheet open onClose={onClose} title="Descargar">
      <div className="space-y-6 pb-2">
        <p className="text-sm leading-relaxed text-zinc-500">
          Un archivo con el resumen de {periodLabel}: ingresos, gastos y cada
          movimiento. Para imprimir, Excel o Google Sheets.
        </p>

        <fieldset className="space-y-2.5">
          <legend className="text-sm font-semibold tracking-tight">
            Qué periodo
          </legend>
          <div className="space-y-2" role="radiogroup" aria-label="Periodo">
            <ChoiceOption
              title={formatMonth(year, month)}
              description="Como el mes en Inicio."
              selected={scope === "month"}
              onSelect={() => setScope("month")}
            />
            <ChoiceOption
              title={`Año ${year}`}
              description="Totales y el desglose mes a mes."
              selected={scope === "year"}
              onSelect={() => setScope("year")}
            />
          </div>
        </fieldset>

        <fieldset className="space-y-2.5">
          <legend className="text-sm font-semibold tracking-tight">
            Formato
          </legend>
          <div className="space-y-2" role="radiogroup" aria-label="Formato">
            {STATEMENT_FORMATS.map((option) => (
              <ChoiceOption
                key={option.id}
                title={option.title}
                description={option.description}
                selected={format === option.id}
                onSelect={() => setFormat(option.id)}
              />
            ))}
          </div>
        </fieldset>

        {error ? <p className="text-sm text-red-500">{error}</p> : null}

        <button
          type="button"
          disabled={busy}
          onClick={() => void handleDownload()}
          className="btn-primary w-full"
        >
          {busy ? "Armando…" : `Descargar ${formatLabel(format)}`}
        </button>
      </div>
    </DetailSheet>
  );
}

function formatLabel(format: StatementFormat): string {
  if (format === "pdf") return "PDF";
  if (format === "xlsx") return "Excel";
  return "CSV";
}
