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
          Podés tener más de un grupo. En cada uno elegís si el gasto resta de
          quien lo pagó, o si sale de la plata del grupo.
        </p>
        <ol className="space-y-3 text-sm">
          <Step
            n="1"
            title="Un grupo"
            body="Casa, amigos, un viaje. Cada lista es aparte: el resto no se entera."
          />
          <Step
            n="2"
            title="Invitar"
            body="Mandás un código o usás el de alguien. Ahí ven la misma lista."
          />
          <Step
            n="3"
            title="Cómo cuenta en tu mes"
            body="De quien pagó: resta solo de tu plata. De la plata del grupo: ingresos y gastos se parten y entran en tu mes solos. Cada grupo se elige aparte."
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
