"use client";

import { SplitEventList } from "@/components/SplitEventList";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useSplitEvents } from "@/hooks/useSplitEvents";

export default function DividirPage() {
  const { events, ready } = useSplitEvents();

  if (!ready) return <LoadingScreen variant="account" />;

  return (
    <div className="mx-auto w-full max-w-lg pb-4 md:max-w-xl md:pt-2">
      <div className="mb-5">
        <h1 className="text-lg font-bold md:text-2xl">Dividir</h1>
        <p className="meta text-xs">En partes iguales, a lo largo de los días</p>
      </div>
      <SplitEventList events={events} />
    </div>
  );
}
