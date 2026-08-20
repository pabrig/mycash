"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSplitEvents } from "@/hooks/useSplitEvents";
import { IconClose, IconPlus } from "@/components/ui/Icons";

type PersonDraft = { key: string; name: string; isMe: boolean };

export function SplitEventWizard() {
  const router = useRouter();
  const { createEvent } = useSplitEvents();
  const [step, setStep] = useState<1 | 2>(1);
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const nextKey = useRef(3);
  const [people, setPeople] = useState<PersonDraft[]>([
    { key: "p1", name: "", isMe: true },
    { key: "p2", name: "", isMe: false },
  ]);

  const titleOk = title.trim().length > 0;
  const datesOk = !startDate || !endDate || endDate >= startDate;
  const canContinue = titleOk && datesOk;
  const canCreate = people.length >= 2;

  function setMe(key: string) {
    setPeople((prev) => prev.map((p) => ({ ...p, isMe: p.key === key })));
  }

  function create() {
    if (!canCreate) return;
    const id = createEvent({
      title,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      people: people.map((p) => ({ name: p.name, isMe: p.isMe })),
    });
    router.replace(`/dividir/${id}`);
  }

  return (
    <div className="space-y-6">
      <p className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">
        Paso {step} de 2
      </p>

      {step === 1 ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">¿Qué están compartiendo?</h2>
            <p className="mt-1 text-sm leading-relaxed text-zinc-500">
              Un viaje, un asado, un finde. Después vas cargando lo que pague cada
              uno.
            </p>
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field"
            placeholder="Ej: viaje a Bariloche"
            autoFocus
          />
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-zinc-500">Desde</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-zinc-500">Hasta</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-field"
              />
            </label>
          </div>
          {!datesOk && (
            <p className="text-sm text-rose-500">La fecha hasta no puede ser antes.</p>
          )}
          <p className="text-xs text-zinc-400">Las fechas son opcionales.</p>
          <button
            type="button"
            disabled={!canContinue}
            onClick={() => setStep(2)}
            className="btn-primary w-full text-sm"
          >
            Seguir · quiénes van
          </button>
        </section>
      ) : (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">¿Quiénes van?</h2>
            <p className="mt-1 text-sm leading-relaxed text-zinc-500">
              Marcate a vos. Si alguien no pagó nada, igual entra: se divide entre
              todos.
            </p>
          </div>
          <ul className="space-y-2">
            {people.map((person, i) => (
              <li
                key={person.key}
                className="flex items-center gap-2 rounded-2xl bg-[var(--card)] p-2 pl-3"
              >
                <input
                  type="text"
                  value={person.name}
                  onChange={(e) =>
                    setPeople((prev) =>
                      prev.map((p) =>
                        p.key === person.key ? { ...p, name: e.target.value } : p,
                      ),
                    )
                  }
                  className="min-w-0 flex-1 bg-transparent py-2 text-sm font-medium outline-none"
                  placeholder={i === 0 ? "Yo" : `Persona ${i + 1}`}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setMe(person.key)}
                  className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold transition active:scale-95 ${
                    person.isMe
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                      : "text-zinc-400"
                  }`}
                >
                  yo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (people.length <= 2) return;
                    const next = people.filter((p) => p.key !== person.key);
                    if (person.isMe && next[0]) next[0] = { ...next[0], isMe: true };
                    setPeople(next);
                  }}
                  disabled={people.length <= 2}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-400 transition active:scale-95 disabled:opacity-30"
                  aria-label="Quitar"
                >
                  <IconClose className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() =>
              setPeople((prev) => [
                ...prev,
                { key: `p${nextKey.current++}`, name: "", isMe: false },
              ])
            }
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-zinc-600 dark:text-zinc-300"
          >
            <IconPlus className="h-4 w-4" />
            Agregar persona
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 rounded-2xl bg-[var(--card-muted)] py-3.5 text-sm font-semibold"
            >
              Atrás
            </button>
            <button
              type="button"
              disabled={!canCreate}
              onClick={create}
              className="btn-primary flex-[2] text-sm"
            >
              Crear evento
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
