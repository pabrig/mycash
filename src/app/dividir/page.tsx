"use client";

import { SplitBill } from "@/components/SplitBill";

export default function DividirPage() {
  return (
    <div className="mx-auto w-full max-w-lg pb-4 md:max-w-xl md:pt-2">
      <div className="mb-5 flex items-center gap-3">
        <div>
          <h1 className="text-lg font-bold md:text-2xl">Dividir</h1>
          <p className="meta text-xs">En partes iguales</p>
        </div>
      </div>
      <SplitBill />
    </div>
  );
}
