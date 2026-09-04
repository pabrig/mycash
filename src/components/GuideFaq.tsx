"use client";

import { useMemo, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IconChevronLeft, IconMyCash, IconPlus, IconSplit } from "@/components/ui/Icons";
import { useFinance } from "@/context/FinanceContext";
import {
  getGuideTopic,
  guideHref,
  guideTopicsByGroup,
  listGuideTopics,
  parseGuideTopic,
  type GuideTopic,
  type GuideTopicId,
} from "@/lib/account-setup";
import { isFeatureEnabled } from "@/lib/feature-flags";

/**
 * Guía post-login tipo FAQ: índice de temas + artículo por `?tema=`.
 * No vuelve a armar la cuenta ni toca el flag de onboarding.
 */
export function GuideFaq() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { sharedEnabled } = useFinance();
  const topicId = parseGuideTopic(searchParams.get("tema"));
  const topic = topicId ? getGuideTopic(topicId) : null;

  const topics = useMemo(
    () =>
      listGuideTopics({
        includeGoals: isFeatureEnabled("savingsGoals"),
        includeShared: true,
      }),
    [],
  );
  const groups = guideTopicsByGroup(topics);

  function exit() {
    router.replace("/cuenta");
  }

  function openTopic(id: GuideTopicId) {
    router.replace(guideHref(id));
  }

  function backToIndex() {
    router.replace(guideHref());
  }

  if (topic) {
    return (
      <div className="flex min-h-[calc(100dvh-6rem)] flex-col">
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={backToIndex}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--card)] active:scale-95"
            aria-label="Volver al índice"
          >
            <IconChevronLeft className="h-5 w-5" />
          </button>
          <p className="text-sm font-semibold text-zinc-500">Ayuda</p>
          <button
            type="button"
            onClick={exit}
            className="h-11 shrink-0 px-2 text-sm font-semibold text-zinc-500"
          >
            Salir
          </button>
        </div>

        <div className="mt-8 flex-1 animate-slide-up">
          <HowToArticle
            title={topic.content.title}
            sub={topic.content.sub}
            items={topic.content.items}
            preview={previewFor(topic.id)}
          />
        </div>

        <div className="sticky bottom-0 mt-8 space-y-2 bg-[var(--background)] pb-2 pt-3">
          <button
            type="button"
            onClick={backToIndex}
            className="btn-primary w-full text-base"
          >
            Más preguntas
          </button>
          <button
            type="button"
            onClick={exit}
            className="w-full py-3 text-sm font-semibold text-zinc-500"
          >
            Volver a Cuenta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-6rem)] flex-col">
      <div className="flex items-center justify-between gap-3 pt-2">
        <span className="h-11 w-11" />
        <p className="text-sm font-semibold text-zinc-500">Ayuda</p>
        <button
          type="button"
          onClick={exit}
          className="h-11 shrink-0 px-2 text-sm font-semibold text-zinc-500"
        >
          Salir
        </button>
      </div>

      <div className="mt-8 flex-1 animate-slide-up space-y-8">
        <div className="space-y-3 text-center">
          <IconMyCash className="mx-auto h-12 w-12" />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Cómo funciona</h1>
            <p className="mx-auto max-w-sm text-base leading-relaxed text-zinc-500">
              Elegí un tema. Sirve cuando cambiás algo en Cuenta y querés
              entender qué hace.
            </p>
          </div>
          <p className="text-sm text-zinc-400">
            No cambia tu cuenta ni tu plata.
          </p>
        </div>

        <TopicGroup
          label="Uso del día a día"
          topics={groups.uso}
          onOpen={openTopic}
        />
        <TopicGroup
          label="Opciones de Cuenta"
          topics={groups.cuenta}
          onOpen={openTopic}
          badgeShared={sharedEnabled}
        />
      </div>
    </div>
  );
}

function TopicGroup({
  label,
  topics,
  onOpen,
  badgeShared,
}: {
  label: string;
  topics: GuideTopic[];
  onOpen: (id: GuideTopicId) => void;
  badgeShared?: boolean;
}) {
  if (topics.length === 0) return null;
  return (
    <section className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
        {label}
      </p>
      <ul className="space-y-2">
        {topics.map((topic) => (
          <li key={topic.id}>
            <button
              type="button"
              onClick={() => onOpen(topic.id)}
              className="flex w-full items-start justify-between gap-3 rounded-2xl bg-[var(--card)] px-4 py-3.5 text-left transition active:scale-[0.99]"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                  {topic.title}
                  {topic.id === "compartido" && badgeShared ? (
                    <span className="ml-1.5 text-[10px] font-medium text-teal-600 dark:text-teal-400">
                      activo
                    </span>
                  ) : null}
                </p>
                <p className="mt-0.5 text-xs leading-snug text-zinc-400">
                  {topic.blurb}
                </p>
              </div>
              <span className="shrink-0 text-zinc-300 dark:text-zinc-600" aria-hidden>
                ›
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function HowToArticle({
  title,
  sub,
  items,
  preview,
}: {
  title: string;
  sub: string;
  items: readonly { title: string; body: string }[];
  preview?: ReactNode;
}) {
  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-base leading-relaxed text-zinc-500">{sub}</p>
      </div>
      {preview}
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item.title} className="rounded-2xl bg-[var(--card)] p-4">
            <p className="text-base font-semibold tracking-tight">{item.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-500">{item.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function previewFor(id: GuideTopicId): ReactNode {
  if (id === "anotar") {
    return (
      <div
        className="flex items-center justify-center gap-3 rounded-2xl bg-[var(--card)] px-4 py-5"
        aria-hidden
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
          <IconPlus className="h-6 w-6" />
        </span>
        <p className="text-sm font-semibold text-zinc-500">Cargar un movimiento</p>
      </div>
    );
  }
  if (id === "mes-ano") {
    return (
      <div
        className="flex justify-center gap-2 rounded-2xl bg-[var(--card)] px-4 py-4"
        aria-hidden
      >
        <span className="rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-semibold text-white dark:bg-white dark:text-zinc-900">
          Mes
        </span>
        <span className="rounded-full bg-zinc-100 px-4 py-1.5 text-sm font-semibold text-zinc-500 dark:bg-zinc-800">
          Año
        </span>
      </div>
    );
  }
  if (id === "dividir") {
    return (
      <div
        className="flex items-center justify-center gap-3 rounded-2xl bg-[var(--card)] px-4 py-5"
        aria-hidden
      >
        <IconSplit className="h-8 w-8 text-zinc-500" />
        <p className="text-sm font-semibold text-zinc-500">Partes iguales</p>
      </div>
    );
  }
  return null;
}
