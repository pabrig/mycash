"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useIsClient } from "@/hooks/useIsClient";
import type { SplitEvent, SplitExpense } from "@/lib/split-bill";
import { loadSplitEvents, saveSplitEvents } from "@/lib/storage";

function newId(): string {
  return crypto.randomUUID();
}

const EMPTY: SplitEvent[] = [];
const listeners = new Set<() => void>();
let memory: SplitEvent[] | null = null;

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function getSnapshot(): SplitEvent[] {
  if (!memory) memory = loadSplitEvents();
  return memory;
}

function getServerSnapshot(): SplitEvent[] {
  return EMPTY;
}

function commit(next: SplitEvent[]) {
  memory = next;
  saveSplitEvents(next);
  emit();
}

export function useSplitEvents() {
  const ready = useIsClient();
  const events = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const replace = useCallback((updater: (prev: SplitEvent[]) => SplitEvent[]) => {
    commit(updater(getSnapshot()));
  }, []);

  const createEvent = useCallback(
    (input: {
      title: string;
      startDate?: string;
      endDate?: string;
      people: Array<{ name: string; isMe: boolean }>;
    }): string => {
      const id = newId();
      const event: SplitEvent = {
        id,
        title: input.title.trim() || "Sin nombre",
        createdAt: new Date().toISOString(),
        startDate: input.startDate || undefined,
        endDate: input.endDate || undefined,
        people: input.people.map((person, i, all) => ({
          id: newId(),
          name: person.name.trim(),
          isMe: all.some((p) => p.isMe) ? person.isMe : i === 0,
        })),
        expenses: [],
      };
      replace((prev) => [event, ...prev]);
      return id;
    },
    [replace],
  );

  const deleteEvent = useCallback(
    (id: string) => {
      replace((prev) => prev.filter((event) => event.id !== id));
    },
    [replace],
  );

  const addExpense = useCallback(
    (
      eventId: string,
      input: { date: string; description: string; amount: number; paidById: string },
    ) => {
      const expense: SplitExpense = {
        id: newId(),
        date: input.date,
        description: input.description.trim(),
        amount: input.amount,
        paidById: input.paidById,
      };
      replace((prev) =>
        prev.map((event) =>
          event.id === eventId
            ? { ...event, expenses: [expense, ...event.expenses] }
            : event,
        ),
      );
    },
    [replace],
  );

  const removeExpense = useCallback(
    (eventId: string, expenseId: string) => {
      replace((prev) =>
        prev.map((event) =>
          event.id === eventId
            ? {
                ...event,
                expenses: event.expenses.filter((item) => item.id !== expenseId),
              }
            : event,
        ),
      );
    },
    [replace],
  );

  const getEvent = useCallback(
    (id: string) => events.find((event) => event.id === id),
    [events],
  );

  return useMemo(
    () => ({
      events,
      ready,
      createEvent,
      deleteEvent,
      addExpense,
      removeExpense,
      getEvent,
    }),
    [events, ready, createEvent, deleteEvent, addExpense, removeExpense, getEvent],
  );
}
