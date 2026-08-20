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
    <DetailSheet open={open} onClose={onClose} title="Cuenta compartida">
      <div className="space-y-5 pb-2">
        <p className="text-sm leading-relaxed text-zinc-500">
          No es una cuenta en común. Cada persona tiene su propio disponible, y
          hay una lista que ve todo el grupo.
        </p>
        <ol className="space-y-3 text-sm">
          <Step
            n="1"
            title="Armar el grupo"
            body="Generás un código o usás el de alguien. Recién ahí el grupo ve la misma lista."
          />
          <Step
            n="2"
            title="El saldo es individual"
            body="Si vos cargás un gasto compartido, resta de tu fondo. El resto lo ve, sin tocar el suyo."
          />
          <Step
            n="3"
            title="Tu nombre"
            body="El nombre de tu usuario es el que ven las demás personas cuando cargás un gasto."
          />
        </ol>
        <button
          type="button"
          onClick={() => void handleActivate()}
          className="btn-primary w-full"
        >
          Activar compartido
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
