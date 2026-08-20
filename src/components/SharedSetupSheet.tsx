"use client";

import { useFinance } from "@/context/FinanceContext";
import { DetailSheet } from "@/components/ui/DetailSheet";

export function SharedSetupSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { setSharedEnabled } = useFinance();

  async function handleActivate() {
    await setSharedEnabled(true);
    onClose();
  }

  return (
    <DetailSheet open={open} onClose={onClose} title="Gastos con otros">
      <div className="space-y-5 pb-2">
        <p className="text-sm leading-relaxed text-zinc-500">
          No mezclan la plata. Cada uno ve lo suyo, y hay una lista de gastos
          que ven todos.
        </p>
        <ol className="space-y-3 text-sm">
          <Step
            n="1"
            title="Invitar"
            body="Mandás un código o usás el de alguien. Ahí ven la misma lista."
          />
          <Step
            n="2"
            title="La plata es de cada uno"
            body="Si vos cargás un gasto, resta de tu plata. Los demás lo ven, pero no les descuenta."
          />
          <Step
            n="3"
            title="Tu nombre"
            body="Así te van a ver cuando cargues un gasto."
          />
        </ol>
        <button
          type="button"
          onClick={() => void handleActivate()}
          className="btn-primary w-full"
        >
          Usar gastos con otros
        </button>
      </div>
    </DetailSheet>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-500/15 text-xs font-bold text-teal-700 dark:text-teal-300">
        {n}
      </span>
      <div>
        <p className="font-semibold tracking-tight">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">{body}</p>
      </div>
    </li>
  );
}
